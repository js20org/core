import { sBoolean, sNumber, sString } from '@js20/schema';
import { App, sMessage } from '../../src/core';
import { models, Models, useMockApp } from '../mock/app';
import { describe, expect, it } from 'vitest';
import { getNewUser, loginUser, signupUser } from '../mock/user';
import { assertHttpOk, assertHttpOkPost } from '../helpers/http';

function initApp(app: App<Models>) {
    app.addCrudEndpoints(models.modelA);
    app.addCrudEndpoints(models.modelB);
    
    const actionInner = app.action({
        inputSchema: {
            numberValue: sNumber().type(),
            stringValue: sString().type()
        },
        outputSchema: {
            output: sString().type()
        },
        run: async (system, input) => {
            // Valid
            await system.models.modelB.create({
                count: input.numberValue,
                decimalValue: 20,
            });

            return {
                output: input.stringValue + '-' + input.numberValue,
            };
        }
    });
    
    const actionMiddle = app.action({
        inputSchema: {
            isFlag: sBoolean().type(),
        },
        outputSchema: {
            output: sString().type()
        },
        run: async (system, input) => {
            // Valid
            await system.models.modelA.create({
                value: 'middle',
                isFlag: input.isFlag,
            });

            const { output } = await system.run(actionInner, {
                numberValue: 42,
                stringValue: 'frommiddle'
            });

            return {
                output,
            };
        }
    });

    app.addEndpoint({
        method: 'POST',
        path: '/actions',
        outputSchema: sMessage,
        inputSchema: {
            outerValue: sString().type()
        },
        isLoggedIn: true,
        run: async (system, input) => {
            // Valid
            await system.models.modelA.create({
                value: input.outerValue,
                isFlag: false
            });
            
            const { output } = await system.run(actionMiddle, {
                isFlag: true,
            });

            return {
                message: 'result: ' + output,
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

describe('Recursive Actions work', () => {
    it('saves data recursively & returns chained results', async () => {
        await useMockApp({
            initApp,
        }, async () => {
            const { cookie1 } = await setup();

            const result = await assertHttpOkPost('/actions', {
                headers: {
                    Cookie: cookie1
                },
                body: {
                    outerValue: 'outervalue'
                }
            });

            expect(result.message).toBe('result: frommiddle-42');

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

            expect(allModelA.length).toBe(2);
            expect(allModelA[0].value).toBe('outervalue');
            expect(allModelA[0].isFlag).toBe(false);
            expect(allModelA[1].value).toBe('middle');
            expect(allModelA[1].isFlag).toBe(true);

            expect(allModelB.length).toBe(1);
            expect(allModelB[0].count).toBe(42);
            expect(allModelB[0].decimalValue).toBe(20);
        });
    });
});
