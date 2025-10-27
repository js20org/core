import { describe, expect, it } from 'vitest';
import { useMockApp } from '../mock/app';
import { assertHttpOk } from '../helpers/http';

describe('End-to-End Tests', () => {
    it('app starts & stop', async () => {
        await useMockApp({}, async (app) => {
            expect(app).toBeDefined();
        });
    });

    it('has health endpoint', async () => {
        await useMockApp({}, async () => {
            await assertHttpOk('/', {
                message: 'Running'
            });
        });
    });
});
