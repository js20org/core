import Express from 'express';
import type { AppData, Authenticator, ComputedEndpoint, NoUndefined, RequestHandlerProps, WebServer, WebServerConfig } from '../../types.js';
import { getExpressHeaders, getExpressRequestInput } from '../../utils/express.js';
import { handleRequest } from '../../request-handler/request-handler.js';
import type { CorsOptions } from 'cors';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

export class ExpressServer implements WebServer {
    private app: Express.Application | null = null;
    private config: NoUndefined<WebServerConfig> | null = null;
    private server: any = null;

    private addRateLimiter(config: NoUndefined<WebServerConfig>) {
        const globalLimiter = rateLimit({
            windowMs: config.rateLimit.windowMs,
            max: config.rateLimit.max,
            standardHeaders: true,
            legacyHeaders: false
        });

        this.app!.use(globalLimiter);
    }

    private addSecurityHeaders() {
        this.app!.use(helmet({
            contentSecurityPolicy: {
                useDefaults: true,
                directives: {
                    defaultSrc: ['\'self\''],
                    scriptSrc: ['\'self\''],
                    styleSrc: ['\'self\''],
                    imgSrc: ['\'self\'', 'data:'],
                    connectSrc: ['\'self\''],
                    objectSrc: ['\'none\''],
                    baseUri: ['\'self\''],
                    frameAncestors: ['\'none\'']
                }
            },
            referrerPolicy: { policy: 'no-referrer' },
            frameguard: { action: 'deny' },
            hsts: { maxAge: 15552000, includeSubDomains: true, preload: false },
            xssFilter: false,
            noSniff: true,
            permittedCrossDomainPolicies: { permittedPolicies: 'none' },
            crossOriginEmbedderPolicy: true,
            crossOriginOpenerPolicy: { policy: 'same-origin' },
            crossOriginResourcePolicy: { policy: 'same-origin' }
        }));
    }

    private addCors(config: NoUndefined<WebServerConfig>, isProduction: boolean) {
        const hasSetCors = config.allowedOrigins.length > 0;
        const methods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'];

        if (hasSetCors) {
            const corsOptions: CorsOptions = {
                origin: function (origin, callback) {
                    const isAllowed = !origin || config.allowedOrigins.includes(origin);

                    if (isAllowed) {
                        callback(null, true);
                    } else {
                        callback(new Error('Not allowed by CORS'));
                    }
                },
                credentials: true,
                methods,
            };

            this.app!.use(cors(corsOptions));
        } else {
            // No wildcard in production
            if (isProduction) {
                throw new Error('[Security feature] In production, "allowedOrigins" must be set on the server configuration with a list of allowed origins for CORS.');
            }

            // Allow all origins
            this.app!.use(cors({
                origin: '*',
                methods,
                credentials: true,
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

            if (computed.endpoint.isLoggedIn) {
                res.setHeader('Cache-Control', 'no-store');
            }

            res.status(response.code).json(payload);
        }

        switch (method) {
            case 'GET':
                this.app!.get(path, handler);
                break;
            case 'POST':
                this.app!.post(path, handler);
                break;
            case 'PUT':
                this.app!.put(path, handler);
                break;
            case 'DELETE':
                this.app!.delete(path, handler);
                break;
            default:
                throw new Error(`Unsupported method: ${method}`);
        }
    }

    private setupAuthenticatorRoutes(authenticator?: Authenticator) {
        if (!authenticator) {
            return;
        }

        const { path, getHandler} = authenticator.getRoutesHandler();

        const authLimiter = rateLimit({
            windowMs: 15 * 60 * 1000,
            max: 10
        });

        this.app!.all(path, authLimiter, getHandler());
    }

    async initialize(props: RequestHandlerProps, data: AppData, config: NoUndefined<WebServerConfig>, isProduction: boolean, authenticator?: Authenticator) {
        this.config = config;
        this.app = Express();

        this.app.disable('x-powered-by');
        this.app.set('trust proxy', 1);

        // Add auth routes before express.json()
        this.setupAuthenticatorRoutes(authenticator);
        this.addCors(config, isProduction);
        this.addSecurityHeaders();
        this.addRateLimiter(config);

        this.app.use(Express.json({ limit: '200kb' }));
        this.app.use(Express.urlencoded({ extended: false, limit: '200kb' }));

        // Last resort error handler without leaking info
        this.app.use((_err: any, _req: any, res: any, _next: any) => {
            res.status(500).json({ error: 'Internal Server Error' });
        });

        for (const endpoint of data.endpoints) {
            this.registerEndpoint(props, endpoint);
        }

        for (const regexEndpoint of data.regexpEndpoints) {
            this.app.all(regexEndpoint.path, regexEndpoint.getHandler());
        }
    }

    start(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.config || !this.app) {
                return reject('Server not initialized');
            }

            this.server = this.app!.listen(this.config.port, () => {
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
