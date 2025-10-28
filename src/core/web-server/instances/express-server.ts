import Express from 'express';
import type { AppData, ComputedEndpoint, NoUndefined, RequestHandlerProps, WebServer, WebServerConfig } from '../../types.js';
import { getExpressHeaders, getExpressRequestInput } from '../../utils/express.js';
import { handleRequest } from '../../request-handler/request-handler.js';
import type { CorsOptions } from 'cors';
import cors from 'cors';

export class ExpressServer implements WebServer {
    private app: Express.Application;
    private config: NoUndefined<WebServerConfig>;
    private server: any = null;

    constructor(config: NoUndefined<WebServerConfig>) {
        this.app = Express();
        this.config = config;
        this.addCors(config);
        this.app.use(Express.json());
    }

    private addCors(config: NoUndefined<WebServerConfig>) {
        const hasSetCors = config.allowedOrigins.length > 0;
        const methods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'];

        if (hasSetCors) {
            const corsOptions: CorsOptions = {
                origin: function (origin, callback) {
                    const isAllowed = origin && config.allowedOrigins.includes(origin);

                    if (isAllowed) {
                        callback(null, true);
                    } else {
                        callback(new Error('Not allowed by CORS'));
                    }
                },
                methods,
            };

            this.app.use(cors(corsOptions));
        } else {
            // Allow all origins
            this.app.use(cors({
                origin: '*',
                methods,
            }));
        }
    }

    private registerEndpoint(props: RequestHandlerProps, computed: ComputedEndpoint) {
        const { method, path } = computed.endpoint;

        async function handler(req: Express.Request, res: Express.Response) {
            const headers = getExpressHeaders(req);
            const input = getExpressRequestInput(req);
            const response = await handleRequest(props, computed, headers, input);
            const payload = 'error' in response ? {
                error: response.error,
                additionalInfo: response.additionalInfo || {}
            } : response.data;

            res.status(response.code).json(payload);
        }

        switch (method) {
            case 'GET':
                this.app.get(path, handler);
                break;
            case 'POST':
                this.app.post(path, handler);
                break;
            case 'PUT':
                this.app.put(path, handler);
                break;
            case 'DELETE':
                this.app.delete(path, handler);
                break;
            default:
                throw new Error(`Unsupported method: ${method}`);
        }
    }

    async initialize(props: RequestHandlerProps, data: AppData) {
        for (const endpoint of data.endpoints) {
            this.registerEndpoint(props, endpoint);
        }

        for (const regexEndpoint of data.regexpEndpoints) {
            this.app.all(regexEndpoint.path, regexEndpoint.getHandler());
        }
    }

    start(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.config) {
                return reject('Server configuration is not set');
            }

            this.server = this.app.listen(this.config.port, () => {
                console.log(`Express server is running on port ${this.config!.port} 🚀`);
                resolve();
            });
        });
    }

    stop(): Promise<void> {
        return new Promise((resolve) => {
            if (!this.server) {
                return resolve();
            }

            this.server.close(() => {
                setTimeout(() => {
                    console.log('Express server has been stopped');
                    resolve();
                }, 50);
            });
        });
    }
}
