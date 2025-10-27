import { describe, expect, it } from 'vitest';
import { getMe, getNewUser, loginUser, logoutUser, signupUser } from '../mock/user';
import { useMockApp } from '../mock/app';
import { sString } from '@js20/schema';
import { assertHttp401, assertHttpOk } from '../helpers/http';

async function runLogin() {
    const user = getNewUser();
    await signupUser(user);
    const response = await loginUser(user);

    expect(response.token).to.be.a('string');
    expect(response.user.email).to.equal(user.email);

    const me = await getMe(response.authCookie);
    expect(me.user.email).to.equal(user.email);

    return {
        user,
        authCookie: response.authCookie
    };
}

describe('Auth E2E Tests', () => {
    it('sign up user works', async () => {
        await useMockApp({}, async () => {
            const newUser = await signupUser(getNewUser());
            expect(newUser.token).to.be.a('string');
            expect(newUser.user.email).to.include('@example.com');
        });
    });

    it('login user works', async () => {
        await useMockApp({}, async () => {
            await runLogin();
        });
    });

    it('logout user works', async () => {
        await useMockApp({}, async () => {
            const { authCookie } = await runLogin();
            await logoutUser(authCookie);

            const url = `http://localhost:3000/api/auth/get-session`;
            const meResponse = await fetch(url, {
                method: 'GET',
                headers: {
                    Cookie: authCookie
                }
            });

            expect(meResponse.status).toBe(200);
            const meContent = await meResponse.json();
            expect(meContent).toBeNull();
        });
    });

    it('pass corrupt auth cookie gives null session', async () => {
        await useMockApp({}, async () => {
            const url = `http://localhost:3000/api/auth/get-session`;
            const meResponse = await fetch(url, {
                method: 'GET',
                headers: {
                    Cookie: 'auth_token=corrupttoken'
                }
            });

            expect(meResponse.status).toBe(200);
            const meContent = await meResponse.json();
            expect(meContent).toBeNull();
        });
    });

    it('logged in endpoint works for logged in user', async () => {
        await useMockApp({ initApp: (app) => {
            app.addEndpoint({
                method: 'GET',
                path: '/me',
                outputSchema: {
                    email: sString().type(),
                },
                isLoggedIn: true,
                run: async(system) => {
                    return {
                        email: system.user.email
                    };
                }
            });
        }}, async () => {
            const { authCookie, user } = await runLogin();

            await assertHttpOk('/me', {
                headers: {
                    Cookie: authCookie
                },
                expectedResponse: {
                    email: user.email
                }
            });
        });
    });

    it('no user present when logged out endpoint called', async () => {
        await useMockApp({ initApp: (app) => {
            app.addEndpoint({
                method: 'GET',
                path: '/test',
                outputSchema: {
                    message: sString().type(),
                },
                isLoggedIn: false,
                run: async(system) => {
                    expect((system as any).user).to.be.undefined;
                    return {
                        message: 'ok'
                    };
                }
            });
        }}, async () => {
            await assertHttpOk('/test', {
                expectedResponse: {
                    message: 'ok'
                }
            });
        });
    });

    it('401 for unauthorized user', async () => {
        await useMockApp({ initApp: (app) => {
            app.addEndpoint({
                method: 'GET',
                path: '/me',
                outputSchema: {
                    email: sString().type(),
                },
                isLoggedIn: true,
                run: async(system) => {
                    return {
                        email: system.user.email
                    };
                }
            });
        }}, async () => {
            await assertHttp401('/me', {
                headers: {
                    Cookie: 'invalid_cookie=invalid_value'
                },
            });
        });
    });

    it('logout means endpoint is not accessible', async () => {
        await useMockApp({ initApp: (app) => {
            app.addEndpoint({
                method: 'GET',
                path: '/me',
                outputSchema: {
                    email: sString().type(),
                },
                isLoggedIn: true,
                run: async(system) => {
                    return {
                        email: system.user.email
                    };
                }
            });
        }}, async () => {
            const { authCookie, user } = await runLogin();
            await assertHttpOk('/me', {
                headers: {
                    Cookie: authCookie
                },
                expectedResponse: {
                    email: user.email
                }
            });
            
            await logoutUser(authCookie);
            await assertHttp401('/me', {
                headers: {
                    Cookie: authCookie
                },
            });
        });
    });
});
