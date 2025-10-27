import { App, sMessage } from '../../src/core';
import { Models, useMockApp } from '../mock/app';
import { describe, expect, it } from 'vitest';
import { assertHttp400Post, assertHttp401, assertHttp500 } from '../helpers/http';
import { getValidatedSchema, sString } from '@js20/schema';

describe('Error handler', () => {
    it('passes along error message', async () => {
        await useMockApp({
            initApp: (app: App<Models>) => {
                app.addEndpoint({
                    method: 'GET',
                    path: '/error',
                    outputSchema: sMessage,
                    isLoggedIn: false,
                    run: async () => {
                        throw new Error('Test error');
                    }
                });
            },
        }, async () => {
            const response = await assertHttp500('/error');
            expect(response.error).toBe('Test error');
        });
    });

    it('default message when no error message provided', async () => {
        await useMockApp({
            initApp: (app: App<Models>) => {
                app.addEndpoint({
                    method: 'GET',
                    path: '/error-no-message',
                    outputSchema: sMessage,
                    isLoggedIn: false,
                    run: async () => {
                        throw new Error();
                    }
                });
            },
        }, async () => {
            const response = await assertHttp500('/error-no-message');
            expect(response.error).toBe('Unknown error');
        });
    });

    it('custom error handler works', async () => {
        await useMockApp({
            handleError: async (e) => {
                return {
                    error: e.message + ' Override',
                    code: 401,
                };
            },
            initApp: (app: App<Models>) => {
                app.addEndpoint({
                    method: 'GET',
                    path: '/error-custom',
                    outputSchema: sMessage,
                    isLoggedIn: false,
                    run: async () => {
                        throw new Error('Custom error');
                    }
                });
            },
        }, async () => {
            const response = await assertHttp401('/error-custom');
            expect(response.error).toBe('Custom error Override');
        });
    });

    it('schema validation errors are handled', async () => {
        await useMockApp({
            initApp: (app: App<Models>) => {
                app.addEndpoint({
                    method: 'POST',
                    path: '/error-schema',
                    outputSchema: sMessage,
                    inputSchema: {
                        someString: sString().type(),
                    },
                    isLoggedIn: false,
                    run: async () => {
                        //Invalid schema
                        getValidatedSchema({
                            message: null,
                        });

                        return {
                            message: 'test',
                        };
                    }
                });
            },
        }, async () => {
            const response = await assertHttp400Post('/error-schema', {
                body: {
                    someString: 'valid',
                }
            });

            expect(response.error).toBe('Invalid schema - The provided schema is invalid.');
            expect(response.additionalInfo.reason).toBe('The schema field was not an object, did you forget to call type()?');
            expect(response.additionalInfo.field).toBe('message');
        });
    });

    it('schema value validation errors are handled', async () => {
        await useMockApp({
            initApp: (app: App<Models>) => {
                app.addEndpoint({
                    method: 'POST',
                    path: '/error-value',
                    outputSchema: sMessage,
                    inputSchema: {
                        someString: sString().type(),
                    },
                    isLoggedIn: false,
                    run: async () => {
                        return {
                            message: 'test',
                        };
                    }
                });
            },
        }, async () => {
            const response = await assertHttp400Post('/error-value', {
                body: {
                    other: 'test'
                }
            });

            expect(response.error).toBe('Invalid value - The provided value does not match the schema.');
            expect(response.additionalInfo.reason).toBe('Value is null or undefined');
            expect(response.additionalInfo.field).toBe('someString');
        });
    });
});
