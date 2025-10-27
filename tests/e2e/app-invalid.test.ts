import { describe, expect, it } from 'vitest';
import { App, MySqlDatabase, sMessage } from '../../src/core';

describe('Model', () => {
    it('empty name throws error', () => {
        const database = new MySqlDatabase({ isInMemory: true });

        expect(() => database.addModels({
            invalidModel: {
                name: '',
                schema: sMessage,
            }
        })).toThrow(/The provided value does not match the schema/);
    });

    it('missing name throws error', () => {
        const database = new MySqlDatabase({ isInMemory: true });

        expect(() => database.addModels({
            invalidModel: {
                schema: sMessage,
            } as any
        })).toThrow(/The provided value does not match the schema/);
    });

    it('missing schema throws error', () => {
        const database = new MySqlDatabase({ isInMemory: true });

        expect(() => database.addModels({
            invalidModel: {
                name: 'validName'
            } as any
        })).toThrow(/Model 'validName' is missing a schema/);
    });

    it('duplicate model names throw error', async () => {
        const database = new MySqlDatabase({ isInMemory: true });

        database.addModels({
            modelA: {
                name: 'modelA',
                schema: sMessage
            }
        });

        database.addModels({
            other: {
                name: 'modelA',
                schema: sMessage
            }
        });

        const app = new App();
        app.addDatabase(database);

        await expect(() => app.start()).rejects.toThrow(/Model with name "modelA" already registered/);
    });

    it('duplicate model keys throw error', async () => {
        const database = new MySqlDatabase({ isInMemory: true });

        database.addModels({
            modelA: {
                name: 'modelA',
                schema: sMessage
            }
        });

        database.addModels({
            modelA: {
                name: 'modelB',
                schema: sMessage
            }
        });

        const app = new App();
        app.addDatabase(database);

        await expect(app.start()).rejects.toThrow(/Model with key "modelA" already registered/);
    });

    it('valid models do not throw error', async () => {
        const database = new MySqlDatabase({ isInMemory: true });

        database.addModels({
            modelA: {
                name: 'modelA',
                schema: sMessage
            }
        });

        database.addModels({
            modelB: {
                name: 'modelB',
                schema: sMessage
            }
        });

        const app = new App();
        app.addDatabase(database);

        await expect(app.start()).resolves.not.toThrow();
        await app.stop();
    });

    it('throws for forbidden fields in model schema', async () => {
        const database = new MySqlDatabase({ isInMemory: true });

        database.addModels({
            invalidModel: {
                name: 'invalidModel',
                schema: {
                    id: sMessage,
                },
            }
        });

        const app = new App();
        app.addDatabase(database);

        await expect(app.start()).rejects.toThrow(/Field 'id' is a protected field used by the system and can not be used by model/);
    });
});

describe('Endpoints', () => {
    it('path requires starting slash', async () => {
        const app = new App();

        app.addEndpoint({
            method: 'GET',
            path: 'invalid-path',
            outputSchema: sMessage,
            isLoggedIn: false,
            run: async () => ({message: 'ok' })
        });

        await expect(app.start()).rejects.toThrow(/Endpoint path must start with a slash: invalid-path/);
    });

    it('path can not have trailing slash', async () => {
        const app = new App();

        app.addEndpoint({
            method: 'GET',
            path: '/invalid-path/',
            outputSchema: sMessage,
            isLoggedIn: false,
            run: async () => ({message: 'ok' })
        });

        await expect(app.start()).rejects.toThrow(/Endpoint path must not end with a trailing slash: \/invalid-path\//);
    });

    it('validates endpoint', async () => {
        const app = new App();

        expect(() => app.addEndpoint({
            method: 'INVALID' as any,
            path: '/invalid-path',
            outputSchema: sMessage,
            isLoggedIn: false,
            run: async () => ({message: 'ok' })
        })).toThrow(/Endpoint method must be one of:/);
    });

    it('duplicate endpoint paths and methods throw error', async () => {
        const app = new App();

        app.addEndpoint({
            method: 'GET',
            path: '/test',
            outputSchema: sMessage,
            isLoggedIn: false,
            run: async () => ({message: 'ok' })
        });

        app.addEndpoint({
            method: 'GET',
            path: '/test',
            outputSchema: sMessage,
            isLoggedIn: false,
            run: async () => ({message: 'ok' })
        });

        await expect(app.start()).rejects.toThrow(/Route already registered/);
    });
});