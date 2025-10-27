import { describe, expect, it } from 'vitest';
import { models, Models, useMockApp } from '../mock/app';
import { App } from '../../src/core';
import { assertHttp401Post, assertHttp404, assertHttpOk, assertHttpOkDelete, assertHttpOkPost, assertHttpOkPut } from '../helpers/http';
import { getNewUser, loginUser, signupUser } from '../mock/user';

function initApp(app: App<Models>) {
    app.addCrudEndpoints(models.modelA, {
        types: ['create']
    });
    app.addCrudEndpoints(models.modelB);
}

async function getLoggedInUser() {
    const user = getNewUser();
    await signupUser(user);
    const { userId, authCookie } = await loginUser(user);
    return { user, authCookie, userId };
}

describe('Basic factory with login and ownership', () => {
    it('wrong method gives 404', async () => {
        await useMockApp({
            initApp,
        }, async () => {
            await assertHttp404('/modelA');
        });
    });

    it('without cookie gives 401', async () => {
        await useMockApp({
            initApp,
        }, async () => {
            await assertHttp401Post('/modelA', {
                body: {
                    value: 'test',
                    isFlag: true
                }
            });
        });
    });

    it('can create models', async () => {
        await useMockApp({
            initApp,
        }, async () => {
            const { userId, authCookie } = await getLoggedInUser();

            const responseA = await assertHttpOkPost('/modelA', {
                body: {
                    value: 'test',
                    isFlag: true
                },
                headers: {
                    Cookie: authCookie
                }
            });

            const responseB = await assertHttpOkPost('/modelB', {
                body: {
                    count: 5,
                    decimalValue: 0.5,
                },
                headers: {
                    Cookie: authCookie
                }
            });

            expect(responseA.value).toBe('test');
            expect(responseA.isFlag).toBe(true);
            expect(responseA.ownerId).toBe(userId);
            expect(responseA.id).to.have.length.greaterThan(5);

            expect(responseB.count).toBe(5);
            expect(responseB.decimalValue).toBe(0.5);
            expect(responseB.description).toBeUndefined();
            expect(responseB.ownerId).toBe(userId);
            expect(responseB.id).to.have.length.greaterThan(5);
        });
    });

    it('two different users see only their own models', async () => {
        await useMockApp({
            initApp,
        }, async () => {
            const { userId: userAId, authCookie: authCookieA } = await getLoggedInUser();
            const { userId: userBId, authCookie: authCookieB } = await getLoggedInUser();

            // User A creates modelB
            const modelB1 = await assertHttpOkPost('/modelB', {
                body: {
                    count: 10,
                    decimalValue: 1.5,
                },
                headers: {
                    Cookie: authCookieA
                }
            });

            // User B creates modelB
            const modelB2 = await assertHttpOkPost('/modelB', {
                body: {
                    count: 20,
                    decimalValue: 2.5,
                },
                headers: {
                    Cookie: authCookieB
                }
            });

            // User A fetches all modelB
            const allModelBUserA = await assertHttpOk('/modelB', {
                headers: {
                    Cookie: authCookieA
                }
            });
            expect(allModelBUserA.length).toBe(1);
            expect(allModelBUserA[0].id).toBe(modelB1.id);
            expect(allModelBUserA[0].ownerId).toBe(userAId);

            // User B fetches all modelB
            const allModelBUserB = await assertHttpOk('/modelB', {
                headers: {
                    Cookie: authCookieB
                }
            });
            expect(allModelBUserB.length).toBe(1);
            expect(allModelBUserB[0].id).toBe(modelB2.id);
            expect(allModelBUserB[0].ownerId).toBe(userBId);
        });
    });

    it('whole lifecycle of modelB works', async () => {
        await useMockApp({
            initApp,
        }, async () => {
            const { authCookie, userId } = await getLoggedInUser();

            // Get all is empty
            let allModelB = await assertHttpOk('/modelB', {
                headers: {
                    Cookie: authCookie
                }
            });
            expect(allModelB.length).toBe(0);

            // Create modelB
            const createdModelB = await assertHttpOkPost('/modelB', {
                body: {
                    count: 15,
                    decimalValue: 3.5,
                },
                headers: {
                    Cookie: authCookie
                }
            });

            expect(createdModelB.count).toBe(15);
            expect(createdModelB.decimalValue).toBe(3.5);
            expect(createdModelB.ownerId).toBe(userId);

            // Get by id
            const fetchedModelB = await assertHttpOk(`/modelB/${createdModelB.id}`, {
                headers: {
                    Cookie: authCookie
                }
            });
            expect(fetchedModelB.id).toBe(createdModelB.id);
            expect(fetchedModelB.count).toBe(15);
            expect(fetchedModelB.decimalValue).toBe(3.5);

            // Get all has one entry
            allModelB = await assertHttpOk('/modelB', {
                headers: {
                    Cookie: authCookie
                }
            });
            expect(allModelB.length).toBe(1);
            expect(allModelB[0].id).toBe(createdModelB.id);

            // Update by id
            const updatedModelB = await assertHttpOkPut(`/modelB/${createdModelB.id}`, {
                body: {
                    decimalValue: 4.5,
                    description: 'Updated description'
                },
                headers: {
                    Cookie: authCookie
                }
            });
            expect(updatedModelB.id).toBe(createdModelB.id);
            expect(updatedModelB.count).toBe(15); // unchanged due to patch
            expect(updatedModelB.decimalValue).toBe(4.5);
            expect(updatedModelB.description).toBe('Updated description');

            // Delete by id
            const deletedModelB = await assertHttpOkDelete(`/modelB/${createdModelB.id}`, {
                headers: {
                    Cookie: authCookie
                }
            });
            expect(deletedModelB.id).toBe(createdModelB.id);

            // Get all is empty again
            allModelB = await assertHttpOk('/modelB', {
                headers: {
                    Cookie: authCookie
                }
            });
            expect(allModelB.length).toBe(0);
        });
    });
});