import { describe, expect, it, vitest } from 'vitest';
import { Action, Database, ErrorHandler, ModelFactory, ModelFactoryProps, ModelItem, User } from '../../../src/core/types';
import { getModelFactories, getSystem, getSystemLoggedIn, getSystemPublic, getSystemWithoutRun, handleRequest, runAction } from '../../../src/core/request-handler/request-handler';
import { Message, sMessage } from '../../../src/core';
import { getValidatedSchema, sBoolean, sString } from '@js20/schema';
import { Transaction } from 'sequelize';
import { globalHandleError } from '../../../src/core/utils/error';

class MockDatabase implements Database<any> {
    private modelFactories?: Record<string, ModelFactory<any>>;
    private transaction?: Transaction;

    constructor(modelFactories?: Record<string, ModelFactory<any>>, transaction?: Transaction) {
        this.modelFactories = modelFactories;
        this.transaction = transaction;
    }
    
    connect(): Promise<void> {
        throw new Error('Method not implemented.');
    }
    disconnect(): Promise<void> {
        throw new Error('Method not implemented.');
    }
    sync(): Promise<void> {
        throw new Error('Method not implemented.');
    }
    getModels(): ModelItem[] {
        throw new Error('Method not implemented.');
    }
    addModels(): void {
        throw new Error('Method not implemented.');
    }
    getNewPool() {
        throw new Error('Method not implemented.');
    }
    getModelFactories(props: ModelFactoryProps): Record<string, ModelFactory<any>> {
        return this.modelFactories ?? props as any;
    }
    initialize(): Promise<void> {
        throw new Error('Method not implemented.');
    }
    async getTransaction(): Promise<Transaction> {
        if (!this.transaction) {
            throw new Error('No transaction set in MockDatabase');
        }

        return this.transaction as Transaction;
    }
}

function getTransaction(commit: () => Promise<void>, rollback: () => Promise<void>): Transaction {
    return {
        commit: commit,
        rollback: rollback,
        afterCommit: vitest.fn().mockResolvedValue(undefined),
        LOCK: {} as any,
    };
}

const handleError: ErrorHandler = async (e) => globalHandleError(e);

describe('handleRequest', () => {
    it('returns 401 when not allowed', async () => {
        const props = {
            // Auth exists
            authenticator: {
                // No user in headers
                getUserFromHeaders: async () => null,
            } as any,
            databases: [],
        } as any;

        const computed = {
            validatedOutputSchema: getValidatedSchema(sMessage),
            endpoint: {
                isLoggedIn: true,
                outputSchema: sMessage,
                run: async () => {
                    return { message: `Hello world` };
                },
            },
        } as any;

        expect(await handleRequest(props, computed, {}, {})).toEqual({
            code: 401,
            error: 'Unauthorized',
        });
    });

    it('returns 500 on action error', async () => {
        const props = {
            databases: [],
            handleError,
        } as any;

        const computed = {
            validatedOutputSchema: getValidatedSchema(sMessage),
            endpoint: {
                isLoggedIn: false,
                outputSchema: sMessage,
                run: async () => {
                    throw new Error();
                },
            },
        } as any;

        const result = await handleRequest(props, computed, {}, undefined);

        expect(result).toEqual({
            code: 500,
            error: 'Unknown error',
        });
    });

    it('returns 200 on success', async () => {
        const props = {
            databases: [],
        } as any;

        const computed = {
            validatedOutputSchema: getValidatedSchema(sMessage),
            endpoint: {
                isLoggedIn: false,
                outputSchema: sMessage,
                run: async () => {
                    return { message: 'Hello, World!' };
                },
            },
        } as any;

        const result = await handleRequest(props, computed, {}, undefined);

        expect(result).toEqual({
            code: 200,
            data: { message: 'Hello, World!' },
        });
    });

    it('commits all transactions on 200 success', async () => {
        const mockCommit1 = vitest.fn().mockResolvedValue(undefined);
        const mockCommit2 = vitest.fn().mockResolvedValue(undefined);

        const mockRollback1 = vitest.fn().mockResolvedValue(undefined);
        const mockRollback2 = vitest.fn().mockResolvedValue(undefined);

        const transaction1 = getTransaction(mockCommit1, mockRollback1);
        const transaction2 = getTransaction(mockCommit2, mockRollback2);

        const props = {
            databases: [
                new MockDatabase({}, transaction1),
                new MockDatabase({}, transaction2),
            ],
        } as any;

        const computed = {
            validatedOutputSchema: getValidatedSchema(sMessage),
            endpoint: {
                isLoggedIn: false,
                outputSchema: sMessage,
                run: async () => {
                    return { message: 'Hello, World!' };
                },
            },
        } as any;

        const result = await handleRequest(props, computed, {}, undefined);

        expect(result).toEqual({
            code: 200,
            data: { message: 'Hello, World!' },
        });

        expect(mockCommit1).toHaveBeenCalledOnce();
        expect(mockCommit2).toHaveBeenCalledOnce();

        expect(mockRollback1).not.toHaveBeenCalled();
        expect(mockRollback2).not.toHaveBeenCalled();
    });

    it('rolls back all transactions on 500 error', async () => {
        const mockCommit1 = vitest.fn().mockResolvedValue(undefined);
        const mockCommit2 = vitest.fn().mockResolvedValue(undefined);

        const mockRollback1 = vitest.fn().mockResolvedValue(undefined);
        const mockRollback2 = vitest.fn().mockResolvedValue(undefined);

        const transaction1 = getTransaction(mockCommit1, mockRollback1);
        const transaction2 = getTransaction(mockCommit2, mockRollback2);

        const props = {
            databases: [
                new MockDatabase({}, transaction1),
                new MockDatabase({}, transaction2),
            ],
            handleError,
        } as any;

        const computed = {
            validatedOutputSchema: getValidatedSchema(sMessage),
            endpoint: {
                isLoggedIn: false,
                outputSchema: sMessage,
                run: async () => {
                    throw new Error('Action failed');
                },
            },
        } as any;

        const result = await handleRequest(props, computed, {}, undefined);

        expect(result).toEqual({
            code: 500,
            error: 'Action failed',
        });

        expect(mockRollback1).toHaveBeenCalledOnce();
        expect(mockRollback2).toHaveBeenCalledOnce();

        expect(mockCommit1).not.toHaveBeenCalled();
        expect(mockCommit2).not.toHaveBeenCalled();
    });
});

describe('getSystem', () => {
    it('works with output schema only', async () => {
        const props = {
            databases: [],
            headers: {},
            defaultIsOwned: true,
            databaseItems: [],
            handleError,
        };

        const computed = {
            endpoint: {
                isLoggedIn: false,
            },
        } as any;

        const mockAction: Action<any, any, any, Message> = {
            outputSchema: sMessage,
            run: async () => {
                return { message: 'Hello, World!' };
            },
        };

        const system = getSystem(props, computed, null);
        const result = await system.run(mockAction, undefined);

        expect(result).toEqual({ message: 'Hello, World!' });
    });

    it('works with input and output schema', async () => {
        const headers = {
            'Authorization': 'Bearer token',
            'Content-Type': 'application/json',
        };
        const props = {
            databases: [],
            headers,
            defaultIsOwned: true,
            databaseItems: [],
            handleError,
        };

        const computed = {
            endpoint: {
                isLoggedIn: true,
            },
        } as any;

        const inputSchema = {
            stringValue: sString().type(),
            booleanValue: sBoolean().type(),
        };

        const user: User = {
            id: '123',
            email: 'test@example.com',
            name: 'Test User',
        };

        const mockAction: Action<any, any, any, Message> = {
            inputSchema,
            outputSchema: sMessage,
            run: async (system, input) => {
                expect((system as any).user).toEqual(user);
                expect(system.headers).toBe(headers);
                return { message: `${input.stringValue}, ${input.booleanValue}` };
            },
        };

        const system = getSystem(props, computed, user);
        const inputData = {
            stringValue: 'Test',
            booleanValue: true,
        };

        const result = await system.run(mockAction, inputData);

        expect(result).toEqual({ message: 'Test, true' });
    });

    it('throws error when output is invalid', async () => {
        const props = {
            databases: [],
            headers: {},
            defaultIsOwned: true,
            databaseItems: [],
            handleError,
        };

        const computed = {
            endpoint: {
                isLoggedIn: false,
            },
        } as any;

        const mockAction: Action<any, any, any, Message> = {
            outputSchema: sMessage,
            run: async () => {
                return { invalidField: 123 } as any;
            },
        };

        const system = getSystem(props, computed, null);
        await expect(system.run(mockAction, undefined)).rejects.toThrowError();
    });

    it('action in action works', async () => {
        const props = {
            databases: [],
            headers: {},
            defaultIsOwned: true,
            databaseItems: [],
            handleError,
        };

        const computed = {
            endpoint: {
                isLoggedIn: false,
            },
        } as any;

        const systemGlobal = getSystem(props, computed, null);
        const innerAction: Action<any, any, any, Message> = {
            outputSchema: sMessage,
            run: async (system) => {
                expect(system).toBe(systemGlobal);
                return { message: 'Inner Action' };
            },
        };

        const outerAction: Action<any, any, any, Message> = {
            outputSchema: sMessage,
            run: async (system) => {
                expect(system).toBe(systemGlobal);
                return system.run(innerAction, undefined);
            },
        };

        const result = await systemGlobal.run(outerAction, undefined);

        expect(result).toEqual({ message: 'Inner Action' });
    });
});

describe('getSystemWithoutRun', () => {
    it('throws error when endpoint requires login but no user provided', () => {
        const props = {
            databases: [],
            headers: {},
            defaultIsOwned: true,
            databaseItems: [],
            handleError,
        };

        const computed = {
            endpoint: {
                isLoggedIn: true,
            },
        } as any;

        expect(() => getSystemWithoutRun(props, computed, null)).toThrowError('No user object for logged in endpoint');
    });

    it('returns logged in system when user is provided', () => {
        const props = {
            databases: [],
            headers: {},
            defaultIsOwned: true,
            databaseItems: [],
            handleError,
        };

        const computed = {
            endpoint: {
                isLoggedIn: true,
            },
        } as any;

        const user: User = {
            id: '123',
            email: 'test@example.com',
            name: 'Test User',
        };

        const system = getSystemWithoutRun(props, computed, user);
        expect((system as any).user).toEqual(user);
    });

    it('returns public system when endpoint does not require login', () => {
        const props = {
            databases: [],
            headers: {},
            defaultIsOwned: true,
            databaseItems: [],
            handleError,
        };

        const computed = {
            endpoint: {
                isLoggedIn: false,
            },
        } as any;

        const user: User = {
            id: '123',
            email: 'test@example.com',
            name: 'Test User',
        };

        const system = getSystemWithoutRun(props, computed, user);
        expect((system as any).user).toBeUndefined();
    });
});

describe('runAction', () => {
    it('works with no input', async () => {
        const globalSystem = {
            test: 'value',
        } as any;

        const mockAction: Action<any, any, any, Message> = {
            outputSchema: sMessage,
            run: async (system) => {
                expect(system).toBe(globalSystem);
                return { message: 'Hello, World!' };
            },
        };

        const validatedOutputSchema = getValidatedSchema(sMessage);
        const result = await runAction(
            mockAction,
            globalSystem,
            undefined,
            undefined,
            validatedOutputSchema
        );

        expect(result).toEqual({
            isValid: true,
            data: { message: 'Hello, World!' },
        });
    });

    it('works with input', async () => {
        const inputSchema = {
            stringValue: sString().type(),
            booleanValue: sBoolean().type(),
        };

        const validatedInputSchema = getValidatedSchema(inputSchema);
        const validatedOutputSchema = getValidatedSchema(sMessage);

        const mockAction: Action<any, any, any, Message> = {
            inputSchema,
            outputSchema: sMessage,
            run: async (_system, input) => {
                return { message: `${input.stringValue}, ${input.booleanValue}` };
            },
        };

        const inputData = {
            stringValue: 'Test',
            booleanValue: true,
        };

        const result = await runAction(
            mockAction,
            {} as any,
            inputData,
            validatedInputSchema,
            validatedOutputSchema
        );

        expect(result).toEqual({
            isValid: true,
            data: { message: 'Test, true' },
        });
    });

    it('validates output', async () => {
        const mockAction: Action<any, any, any, Message> = {
            outputSchema: sMessage,
            run: async () => {
                return { invalidField: 123 } as any;
            },
        };

        const validatedOutputSchema = getValidatedSchema(sMessage);
        const result = await runAction(
            mockAction,
            {} as any,
            undefined,
            undefined,
            validatedOutputSchema
        );

        expect(result.isValid).toBe(false);
        expect(result.error).toBeDefined();
    });

    it('validates input', async () => {
        const inputSchema = {
            stringValue: sString().type(),
        };

        const validatedInputSchema = getValidatedSchema(inputSchema);
        const validatedOutputSchema = getValidatedSchema(sMessage);

        const mockAction: Action<any, any, any, Message> = {
            inputSchema,
            outputSchema: sMessage,
            run: async (_system, input) => {
                return { message: input.stringValue };
            },
        };

        const invalidInputData = {
            stringValue: 123,
        };

        const result = await runAction(
            mockAction,
            {} as any,
            invalidInputData,
            validatedInputSchema,
            validatedOutputSchema
        );

        expect(result.isValid).toBe(false);
        expect(result.error).toBeDefined();
    });
});

describe('getSystemPublic', () => {
    it('does not include user in the system object', () => {
        const props = {
            databases: [],
            headers: {},
            defaultIsOwned: true,
            databaseItems: [],
            handleError,
        };

        const system = getSystemPublic(props);
        expect((system as any).user).toBeUndefined();
    });

    it('includes headers in the system object', () => {
        const headers = {
            'Authorization': 'Bearer token',
            'Content-Type': 'application/json',
        };

        const system = getSystemPublic({ databases: [], headers, databaseItems: [], handleError });
        expect(system.headers).toEqual(headers);
    });

    it('models is populated & has no bypass', () => {
        const databases = [
            // Return props
            new MockDatabase(),
        ];

        const databaseItems = databases.map(db => ({
            database: db,
            transaction: null as any,
        }));

        const system = getSystemPublic({ databases, headers: {}, databaseItems, handleError });
        const expected: ModelFactoryProps = {
            user: null,
            bypassOwnership: false,
            transaction: null as any,
        };

        expect(system.models).toEqual(expected);
    });

    it('bypass models is populated & has bypass', () => {
        const databases = [
            // Return props
            new MockDatabase(),
        ];

        const databaseItems = databases.map(db => ({
            database: db,
            transaction: null as any,
        }));

        const system = getSystemPublic({ databases, headers: {}, databaseItems, handleError });
        const expected: ModelFactoryProps = {
            user: null,
            bypassOwnership: true,
            transaction: null as any,
        };

        expect(system.bypassAcl.models).toEqual(expected);
    });
});

describe('getSystemLoggedIn', () => {
    it('includes user in the system object', () => {
        const props = {
            databases: [],
            headers: {},
            databaseItems: [],
            handleError,
        };

        const user: User = {
            id: '123',
            email: 'test@example.com',
            name: 'Test User',
        };

        const system = getSystemLoggedIn(props, user);
        expect(system.user).toEqual(user);
    });
});

describe('getModelFactories', () => {
    it('works when no duplicate model names exist', () => {
        const props = {} as ModelFactoryProps;
        const databases = [
            new MockDatabase({
                User: {} as unknown as ModelFactory<any>,
                Post: {} as unknown as ModelFactory<any>,
            }),
            new MockDatabase({
                Device: {} as unknown as ModelFactory<any>,
            }),
        ];

        const databaseItems = databases.map(db => ({
            database: db,
            transaction: null as any,
        }));

        const factories = getModelFactories(props, databaseItems);

        expect(Object.keys(factories)).toEqual(['User', 'Post', 'Device']);
    });

    it('throws an error when duplicate model names exist', () => {
        const props = {} as ModelFactoryProps;
        const databases = [
            new MockDatabase({
                User: {} as unknown as ModelFactory<any>,
            }),
            new MockDatabase({
                User: {} as unknown as ModelFactory<any>,
            }),
        ];

        const databaseItems = databases.map(db => ({
            database: db,
            transaction: null as any,
        }));

        expect(() => getModelFactories(props, databaseItems)).toThrowError('Model factory already exists: User');
    });
});
