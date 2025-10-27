import { describe, expect, it } from 'vitest';
import { App, sMessage } from '../../src/core';
import { models, Models, useMockApp } from '../mock/app';
import { getNewUser, loginUser, signupUser } from '../mock/user';
import { assertHttp400, assertHttp500, assertHttpOk } from '../helpers/http';

function initApp(app: App<Models>) {
    app.addCrudEndpoints(models.modelA);
    app.addCrudEndpoints(models.modelB);

    const successAction = app.action({
        outputSchema: sMessage,
        run: async (system) => {
            // Valid
            await system.models.modelA.create({
                value: 'test',
                isFlag: true
            });

            return {
                message: 'Action success',
            }
        }
    });

    const failureAction = app.action({
        outputSchema: sMessage,
        run: async (system) => {
            // Invalid (too low count)
            await system.models.modelB.create({
                count: -5,
                decimalValue: 20,
            });

            return {
                message: 'Action failure',
            }
        }
    });

    app.addEndpoint({
        method: 'GET',
        path: '/success',
        outputSchema: sMessage,
        isLoggedIn: true,
        run: async (system) => {
            // Valid
            await system.models.modelA.create({
                value: 'test',
                isFlag: true
            });

            // Valid
            await system.models.modelA.create({
                value: 'test2',
                isFlag: false
            });

            // Valid
            await system.models.modelB.create({
                count: 10,
                decimalValue: 50.5,
                description: 'A valid description'
            });

            // Deep is valid
            await system.run(successAction);

            // Valid
            await system.models.modelB.create({
                count: 11,
                decimalValue: 92,
            });

            return {
                message: 'Transaction success',
            };
        }
    });

    app.addEndpoint({
        method: 'GET',
        path: '/rollback',
        outputSchema: sMessage,
        isLoggedIn: true,
        run: async (system) => {
            // Valid
            await system.models.modelA.create({
                value: 'test',
                isFlag: true
            });

            // Valid
            await system.models.modelA.create({
                value: 'test2',
                isFlag: false
            });

            // Valid
            await system.models.modelB.create({
                count: 10,
                decimalValue: 50.5,
                description: 'A valid description'
            });

            // Invalid (too low count)
            await system.models.modelB.create({
                count: -1,
                decimalValue: 112,
            });

            return {
                message: 'Transaction rollback',
            };
        }
    });

    app.addEndpoint({
        method: 'GET',
        path: '/rollback-deep',
        outputSchema: sMessage,
        isLoggedIn: true,
        run: async (system) => {
            // Valid
            await system.models.modelA.create({
                value: 'test',
                isFlag: true
            });

            // Valid
            await system.models.modelB.create({
                count: 15,
                decimalValue: 60,
            });
            
            // Invalid deep
            await system.run(failureAction);

            // Valid
            await system.models.modelA.create({
                value: 'test',
                isFlag: true
            });

            return {
                message: 'Transaction rollback',
            };
        }
    });
}

async function setup() {
    const user1 = getNewUser();
    await signupUser(user1);

    const { authCookie: cookie1 } = await loginUser(user1);
    
    return {
        cookie1
    };
}

describe('Transaction & rollback works', () => {
    it('should commit success transactions', async () => {
        await useMockApp({
            initApp,
        }, async () => {
            const { cookie1 } = await setup();

            await assertHttpOk('/success', {
                headers: {
                    Cookie: cookie1
                }
            });

            const allModelA = await assertHttpOk('/modela', {
                headers: {
                    Cookie: cookie1
                }
            });

            const allModelB = await assertHttpOk('/modelb', {
                headers: {
                    Cookie: cookie1
                }
            });

            expect(allModelA.length).toBe(3);
            expect(allModelB.length).toBe(2);
        });
    });

    it('should rollback failed transactions', async () => {
        await useMockApp({
            initApp,
        }, async () => {
            const { cookie1 } = await setup();

            await assertHttp400('/rollback', {
                headers: {
                    Cookie: cookie1
                }
            });

            // Add error handler
            // Add transaction rollback
       
            const allModelA = await assertHttpOk('/modela', {
                headers: {
                    Cookie: cookie1
                }
            });

            const allModelB = await assertHttpOk('/modelb', {
                headers: {
                    Cookie: cookie1
                }
            });

            // Both models should have zero entries due to rollback
            expect(allModelA.length).toBe(0);
            expect(allModelB.length).toBe(0);
        });
    });

    it('should rollback failed deep transactions', async () => {
        await useMockApp({
            initApp,
        }, async () => {
            const { cookie1 } = await setup();

            await assertHttp400('/rollback-deep', {
                headers: {
                    Cookie: cookie1
                }
            });

            const allModelA = await assertHttpOk('/modela', {
                headers: {
                    Cookie: cookie1
                }
            });

            const allModelB = await assertHttpOk('/modelb', {
                headers: {
                    Cookie: cookie1
                }
            });

            // Both models should have zero entries due to rollback
            expect(allModelA.length).toBe(0);
            expect(allModelB.length).toBe(0);
        });
    });
});
