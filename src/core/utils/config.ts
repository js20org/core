import { WebServerType, type AppConfig as InputConfig, type InternalConfig } from '../types.js';

// Rewrite so it looks good in the docs
type AppConfig = InternalConfig;

//<DefaultConfig>
const defaultConfig: AppConfig = {
    server: {
        type: WebServerType.express,
        port: 3000,
    },
}
//</DefaultConfig>

export function getInternalConfig(config: InputConfig = {}): InternalConfig {
    const { server = {} } = config;

    return {
        server: {
            type: server.type ?? defaultConfig.server.type,
            port: server.port ?? defaultConfig.server.port,
        },
    };
}
