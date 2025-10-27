import { type InternalConfig, type WebServer, WebServerType } from '../types.js';
import { ExpressServer } from './instances/express-server.js';

export function getWebServer(config: InternalConfig): WebServer {
     switch (config.server.type) {
        case WebServerType.express:
            return new ExpressServer(config.server);
        default:
            throw new Error(`Unsupported web server type: ${config.server.type}`);
    }
}
