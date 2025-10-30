import { describe, it, expect } from 'vitest';
import { Endpoint, EndpointMethod, WebServerType } from '../../../src/core/types';
import { ExpressServer } from '../../../src/core/web-server/instances/express-server';
import { globalHandleError } from '../../../src/core/utils/error';
import { sAny } from '@js20/schema';
import { getComputedEndpoints } from '../../../src/core/utils/endpoints';

function getEndpoint(method: EndpointMethod, path: string): Endpoint<any, any, any> {
    return {
        method,
        path,
        isLoggedIn: false,
        inputSchema: sAny().type(),
        outputSchema: sAny().type(),
        run: async (_system, input) => {
            return input;
        },
    };
}

async function getWebServer(allowedOrigins: string[], isProduction = false) {
    const webServer = new ExpressServer();

    webServer.initialize({
        databases: [],
        handleError: async (e) => globalHandleError(e),
    }, {
        endpoints: getComputedEndpoints([
            getEndpoint('GET', '/get'),
            getEndpoint('POST', '/post'),
        ], true),
        regexpEndpoints: [],
        models: [],
    }, {
        port: 3000,
        type: WebServerType.express,
        allowedOrigins,
        rateLimit: {
            windowMs: 15 * 60 * 1000,
            max: 300,
        }
    }, isProduction);

    await webServer.start();

    return webServer;
}

describe('CORS', () => {
    it('no allow list means all allowed in GET request', async () => {
        const server = await getWebServer([]);

        const res = await fetch('http://localhost:3000/get', {
            method: 'GET',
            headers: {
                Origin: 'http://example.com',
            },
        });

        expect(res.status).toBe(200);
        expect(res.headers.get('access-control-allow-origin')).toBe('*');
        // No Access-Control-Allow-Methods header for non-preflight requests
        expect(res.headers.get('access-control-allow-methods')).toBeNull();

        await server.stop();
    });

    it('no allow list means all allowed in POST request', async () => {
        const server = await getWebServer([]);

        const res = await fetch('http://localhost:3000/post', {
            method: 'POST',
            headers: {
                Origin: 'http://example.com',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ test: 'data' }),
        });

        expect(res.status).toBe(200);
        expect(res.headers.get('access-control-allow-origin')).toBe('*');
        // No Access-Control-Allow-Methods header for non-preflight requests
        expect(res.headers.get('access-control-allow-methods')).toBeNull();

        await server.stop();
    });

    it('no allow list accepts preflight requests', async () => {
        const server = await getWebServer([]);

        const res = await fetch('http://localhost:3000/get', {
            method: 'OPTIONS',
            headers: {
                Origin: 'http://example.com',
                'Access-Control-Request-Method': 'GET',
            },
        });
        
        expect(res.status).toBe(204);
        expect(res.headers.get('access-control-allow-origin')).toBe('*');
        expect(res.headers.get('access-control-allow-methods')).toBe('GET,POST,PUT,DELETE,OPTIONS');

        await server.stop();
    });

    it('with allow list rejects not allowed origin', async () => {
        const server = await getWebServer(['http://allowed.com']);

        const res = await fetch('http://localhost:3000/get', {
            method: 'GET',
            headers: {
                Origin: 'http://notallowed.com',
            },
        });

        // Default express error handler returns 500 on Cors new Error()
        expect(res.status).toBe(500);

        await server.stop();
    });

    it('with allow list accepts allowed origin', async () => {
        const server = await getWebServer(['http://allowed.com']);

        const res = await fetch('http://localhost:3000/get', {
            method: 'GET',
            headers: {
                Origin: 'http://allowed.com',
            },
        });

        expect(res.status).toBe(200);
        expect(res.headers.get('access-control-allow-origin')).toBe('http://allowed.com');
        // No Access-Control-Allow-Methods header for non-preflight requests
        expect(res.headers.get('access-control-allow-methods')).toBeNull();

        await server.stop();
    });

    it('with allow list accepts preflight requests from allowed origin', async () => {
        const server = await getWebServer(['http://allowed.com']);

        const res = await fetch('http://localhost:3000/get', {
            method: 'OPTIONS',
            headers: {
                Origin: 'http://allowed.com',
                'Access-Control-Request-Method': 'GET',
            },
        });
        
        expect(res.status).toBe(204);
        expect(res.headers.get('access-control-allow-origin')).toBe('http://allowed.com');
        expect(res.headers.get('access-control-allow-methods')).toBe('GET,POST,PUT,DELETE,OPTIONS');

        await server.stop();
    });

    it('no origin is allowed', async () => {
        const server = await getWebServer(['http://allowed.com']);

        const res = await fetch('http://localhost:3000/get', {
            method: 'GET',
        });

        expect(res.status).toBe(200);
        expect(res.headers.get('access-control-allow-origin')).toBeNull();
        // No Access-Control-Allow-Methods header for non-preflight requests
        expect(res.headers.get('access-control-allow-methods')).toBeNull();

        await server.stop();
    });

    it('no allow list in production throws error on server start', async () => {
        await expect(getWebServer([], true)).rejects.toThrowError('[Security feature] In production, "allowedOrigins" must be set on the server configuration with a list of allowed origins for CORS.');
    });
});
