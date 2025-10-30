import { describe, expect, it } from 'vitest';
import { App, BetterAuth, MySqlDatabase, Schema, sMessage } from '../../src/core';
import { sString } from '@js20/schema';
import { assertHttp500, assertHttpOk } from '../helpers/http';
import { getNewUser, loginUser, signupUser } from '../mock/user';

describe('Default is owned', () => {
    it('no auth means isOwned is false', async () => {
        const app = new App<{ testModel: any }>({
            isProduction: false,
        });
        // No authenticator

        const database = new MySqlDatabase({
            isInMemory: true
        });

        const sTestModel = {
            name: sString().type()
        };

        database.addModels({
            testModel: {
                name: 'testModel',
                schema: sTestModel
            }
        });

        app.addDatabase(database);
        app.addEndpoint({
            method: 'GET',
            path: '/test',
            outputSchema: Schema.withInstance(sTestModel),
            isLoggedIn: false,
            run: async (system) => {
                // Saving test model is fine because no auth means isOwned = false
                return await system.models.testModel.create({
                    name: 'test'
                });
            }
        });

        await app.start();

        const response = await assertHttpOk('/test');
        expect(response.id).toBeDefined();
        expect(response.createdAt).toBeDefined();
        expect(response.updatedAt).toBeDefined();
        expect(response.name).toBe('test');
        expect(Object.keys(response).length).toBe(4);
        expect(response.ownerId).not.toBeDefined();

        await app.stop();
    });

    it('with auth means isOwned so saving throws error', async () => {
        const app = new App<{ testModel: any }>({
            isProduction: false,
        });
        
        const database = new MySqlDatabase({
            isInMemory: true
        });

        // With auth
        app.setAuthenticator(new BetterAuth(database));

        const sTestModel = {
            name: sString().type()
        };

        database.addModels({
            testModel: {
                name: 'testModel',
                schema: sTestModel
            }
        });

        app.addDatabase(database);
        app.addEndpoint({
            method: 'GET',
            path: '/test',
            outputSchema: Schema.withInstance(sTestModel),
            isLoggedIn: false,
            run: async (system) => {
                // Saving test model throws because with auth means isOwned = true
                return await system.models.testModel.create({
                    name: 'test'
                });
            }
        });

        await app.start();
        await assertHttp500('/test');
        await app.stop();
    });

    it('with auth means isOwned so auth user can save', async () => {
        const app = new App<{ testModel: any }>({
            isProduction: false,
        });
        
        const database = new MySqlDatabase({
            isInMemory: true
        });

        // With auth
        app.setAuthenticator(new BetterAuth(database));

        const sTestModel = {
            name: sString().type()
        };

        database.addModels({
            testModel: {
                name: 'testModel',
                schema: sTestModel
            }
        });

        app.addDatabase(database);
        app.addEndpoint({
            method: 'GET',
            path: '/test',
            outputSchema: Schema.withInstance(sTestModel),
            isLoggedIn: true,
            run: async (system) => {
                // Saving test model is ok because logged in endpoint with user
                return await system.models.testModel.create({
                    name: 'test'
                });
            }
        });

        await app.start();

        const user = getNewUser();
        await signupUser(user);
        const { authCookie, userId } = await loginUser(user);

        const response = await assertHttpOk('/test', {
            headers: {
                Cookie: authCookie
            }
        });

        expect(response.id).toBeDefined();
        expect(response.createdAt).toBeDefined();
        expect(response.updatedAt).toBeDefined();
        expect(response.name).toBe('test');
        expect(response.ownerId).toBe(userId);
        expect(Object.keys(response).length).toBe(5);
        await app.stop();
    });
});