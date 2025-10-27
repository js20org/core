import { describe, expect, it } from 'vitest';
import { getNewUser, loginUser, signupUser } from '../mock/user';
import { Models, models, sModelA, useMockApp } from '../mock/app';
import { App, Schema } from '../../src/core';
import { assertHttp400Put, assertHttp500Put, assertHttpOk, assertHttpOkPost } from '../helpers/http';

function initApp(app: App<Models>) {
    app.addCrudEndpoints(models.modelA, {
        types: ['create', 'update']
    });

    app.addEndpoint({
        method: 'GET',
        path: '/modela',
        outputSchema: [Schema.withInstance(sModelA)],
        isLoggedIn: true,
        run: async (system) => {
            return system.models.modelA.getAll();
        }
    });

    app.addEndpoint({
        method: 'GET',
        path: '/bypass/modela',
        outputSchema: [Schema.withInstance(sModelA)],
        isLoggedIn: true,
        run: async (system) => {
            return system.bypassAcl.models.modelA.getAll();
        }
    });

    app.addEndpoint({
        method: 'PUT',
        path: '/corrupt-change-owner/:id',
        inputSchema: Schema.withIdPartial(sModelA),
        outputSchema: Schema.withInstance(sModelA),
        isLoggedIn: true,
        run: async (system, data) => {
            return system.models.modelA.updateById(data.id, {
                ...data,
                ownerId: 'some-other-user-id'
            } as any);
        }
    });
}

async function setup() {
    const user1 = getNewUser();
    const user2 = getNewUser();

    await signupUser(user1);
    await signupUser(user2);

    const { authCookie: cookie1 } = await loginUser(user1);
    const { authCookie: cookie2 } = await loginUser(user2);
    
    await assertHttpOkPost('/modela', {
        body: {
            value: 'User1 Data 1',
            isFlag: true
        },
        headers: {
            Cookie: cookie1
        }
    });

    await assertHttpOkPost('/modela', {
        body: {
            value: 'User1 Data 2',
            isFlag: false
        },
        headers: {
            Cookie: cookie1
        }
    });

    await assertHttpOkPost('/modela', {
        body: {
            value: 'User2 Data 1',
            isFlag: true
        },
        headers: {
            Cookie: cookie2
        }
    });

    return { cookie1, cookie2 };
}

describe('Bypass ACL', () => {
    it('no bypass means you see your own', async () => {
        await useMockApp({
            initApp,
        }, async () => {
            const { cookie1, cookie2 } = await setup();

            // Get all with ACL
            const response1 = await assertHttpOk('/modela', {
                headers: {
                    Cookie: cookie1
                }
            });

            // User 1 sees their own items
            expect(response1.length).toBe(2);
            expect(response1[0].value).toBe('User1 Data 1');
            expect(response1[1].value).toBe('User1 Data 2');

            // User 2 should not see User 1's items
            const response2 = await assertHttpOk('/modela', {
                headers: {
                    Cookie: cookie2
                }
            });

            expect(response2.length).toBe(1);
            expect(response2[0].value).toBe('User2 Data 1');
        });
    });

    it('with bypass you see all items', async () => {
        await useMockApp({
            initApp,
        }, async () => {
            const { cookie1, cookie2 } = await setup();

            // Get all with bypass ACL
            const response1 = await assertHttpOk('/bypass/modela', {
                headers: {
                    Cookie: cookie1
                }
            });

            // User 1 sees all items
            expect(response1.length).toBe(3);
            expect(response1[0].value).toBe('User1 Data 1');
            expect(response1[1].value).toBe('User1 Data 2');
            expect(response1[2].value).toBe('User2 Data 1');

            const response2 = await assertHttpOk('/bypass/modela', {
                headers: {
                    Cookie: cookie2
                }
            });

            // User 2 also sees all items
            expect(response2.length).toBe(3);
            expect(response2[0].value).toBe('User1 Data 1');
            expect(response2[1].value).toBe('User1 Data 2');
            expect(response2[2].value).toBe('User2 Data 1');
        });
    });
});

describe('No change owner', () => {
    it('posting with ownerId gives 500', async () => {
        await useMockApp({
            initApp,
        }, async () => {
            const { cookie1 } = await setup();

            // get all with ACL
            const response = await assertHttpOk('/modela', {
                headers: {
                    Cookie: cookie1
                }
            });

            const item = response[0];
            expect(item.value).toBe('User1 Data 1');

            // Try to update with different ownerId
            // Hits schema error
            await assertHttp400Put('/modela/' + item.id, {
                body: {
                    ownerId: 'some-other-user-id',
                    value: 'Hacked Value'
                },
                headers: {
                    Cookie: cookie1
                }
            }); 
        });
    });

    it('changing owner inside run gives 500', async () => {
        await useMockApp({
            initApp,
        }, async () => {
            const { cookie1 } = await setup();

            // get all with ACL
            const response = await assertHttpOk('/modela', {
                headers: {
                    Cookie: cookie1
                }
            });

            const item = response[0];
            expect(item.value).toBe('User1 Data 1');

            // Try to update which changes ownerId inside run
            await assertHttp500Put('/corrupt-change-owner/' + item.id, {
                body: {
                    value: 'Hacked Value'
                },
                headers: {
                    Cookie: cookie1
                }
            }); 
        });
    });
});
