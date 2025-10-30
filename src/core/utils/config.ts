import { WebServerType, type AppConfig as InputConfig, type InternalConfig } from '../types.js';

// Rewrite so it looks good in the docs
type AppConfig = InternalConfig;

//<DefaultConfig>
const defaultConfig: AppConfig = {
    isProduction: true,
    server: {
        type: WebServerType.express,
        port: 3000,
        allowedOrigins: [],
        rateLimit: {
            windowMs: 15 * 60 * 1000,
            max: 300,
        }
    },
}
//</DefaultConfig>

export function getInternalConfig(config: InputConfig = {}): InternalConfig {
    const { server = {} } = config;

    return {
        isProduction: config.isProduction ?? defaultConfig.isProduction,
        server: {
            type: server.type ?? defaultConfig.server.type,
            port: server.port ?? defaultConfig.server.port,
            allowedOrigins: server.allowedOrigins ?? defaultConfig.server.allowedOrigins,
            rateLimit: {
                windowMs: server.rateLimit?.windowMs ?? defaultConfig.server.rateLimit!.windowMs,
                max: server.rateLimit?.max ?? defaultConfig.server.rateLimit!.max,
            },
        },
    };
}
