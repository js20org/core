import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { BaseSystem, Endpoint, EndpointMethod, WebServer, WebServerConfig, WebServerType } from '../../../src/core/types';
import { ExpressServer } from '../../../src/core/web-server/instances/express-server';
import { getComputedEndpoints } from '../../../src/core/utils/endpoints';
import { sAny } from '@js20/schema';
import { Request, Response } from 'express';
import { globalHandleError } from '../../../src/core/utils/error';

const servers: WebServer[] = [
    new ExpressServer({
        port: 3000,
        type: WebServerType.express,
        allowedOrigins: [],
    })
];

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

describe.each(servers)('%s', async (server) => {
    beforeAll(async () => {
        await server.start();

        const returnsHeaderEndpoint = getEndpoint('GET', '/headers');
        returnsHeaderEndpoint.run = async (system: BaseSystem<any>) => {
            return system.headers;
        };

        const throwsErrorEndpoint = getEndpoint('GET', '/error');
        throwsErrorEndpoint.run = async () => {
            throw new Error('Test error');
        };

        server.initialize({
            databases: [],
            handleError: async (e) => globalHandleError(e),
        }, {
            endpoints: getComputedEndpoints([
                getEndpoint('GET', '/get'),
                getEndpoint('POST', '/post'),
                getEndpoint('PUT', '/put/:type'),
                getEndpoint('DELETE', '/delete'),
                returnsHeaderEndpoint,
                throwsErrorEndpoint,
            ], true),
            regexpEndpoints: [
                {
                    plugin: 'test',
                    path: '/test/*',
                    getHandler: () => async (req: Request, res: Response) => {
                        res.status(200).json({ 
                            path: req.path,
                            method: req.method,
                        });
                    },
                }
            ],
            models: [],
        });
    });

    afterAll(async () => {
        await server.stop();
    });

    it('GET endpoint is registered', async () => {
        const response = await fetch(`http://localhost:3000/get?id=1`);

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ id: '1' });
    });

    it('POST endpoint is registered', async () => {
        const response = await fetch(`http://localhost:3000/post`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: 'test' }),
        });

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ name: 'test' });
    });

    it('PUT endpoint is registered', async () => {
        const response = await fetch(`http://localhost:3000/put/a`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id: 1, name: 'test' }),
        });

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ id: 1, name: 'test', type: 'a' });
    });

    it('DELETE endpoint is registered', async () => {
        const response = await fetch(`http://localhost:3000/delete`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id: 1 }),
        });

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ id: 1 });
    });

    it('headers are parsed correctly', async () => {
        const response = await fetch(`http://localhost:3000/headers`, {
            method: 'GET',
            headers: {
                'X-Custom-Header': 'CustomValue',
            },
        });

        expect(response.status).toBe(200);
        const headers = await response.json();
        expect(headers['x-custom-header']).toBe('CustomValue');
    });

    it('regexp endpoint is registered', async () => {
        const response = await fetch(`http://localhost:3000/test/some/path`, {
            method: 'POST',
        });

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ path: '/test/some/path', method: 'POST' });
    });

    it('handles endpoint errors gracefully', async () => {
        const response = await fetch(`http://localhost:3000/error`, {
            method: 'GET',
        });

        expect(response.status).toBe(500);
        const body = await response.json();
        expect(body).toHaveProperty('error');
        expect(body.error).toBe('Test error');
    });
});
