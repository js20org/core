import { describe, expect, it } from 'vitest';
import { useMockApp } from '../mock/app';
import { sMessage } from '../../src/core';

describe('Rate limit', () => {
    it('rate limits when too many attempts', async () => {
        await useMockApp({
            initApp: (app) => {
                app.addEndpoint({
                    method: 'GET',
                    path: '/something',
                    outputSchema: sMessage,
                    isLoggedIn: false,
                    run: async () => {
                        return {
                            message: 'You accessed something!'
                        }
                    }
                });
            },
            rateLimit: {
                windowMs: 10 * 1000,
                max: 2
            }
        }, async () => {
            const res1 = await fetch('http://localhost:3000/something', {
                method: 'GET',
            });

            expect(res1.status).toBe(200);

            const res2 = await fetch('http://localhost:3000/something', {
                method: 'GET',
            });

            expect(res2.status).toBe(200);

            const res3 = await fetch('http://localhost:3000/something', {
                method: 'GET',
            });

            expect(res3.status).toBe(429);
        });
    });
});