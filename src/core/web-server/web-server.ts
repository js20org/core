import { InternalConfig, WebServer, WebServerType } from '../types';
import { ExpressServer } from './instances/express-server';

export function getWebServer(config: InternalConfig): WebServer {
     switch (config.server.type) {
        case WebServerType.express:
            return new ExpressServer(config.server);
        default:
            throw new Error(`Unsupported web server type: ${config.server.type}`);
    }
}
