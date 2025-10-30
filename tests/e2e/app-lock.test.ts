import { describe, expect, it } from 'vitest';
import { App } from '../../src/core';

describe('App Lock', () => {
    it('addDatabase should throw an error if the app is locked', async () => {
        const app = new App({
            isProduction: false,
        });
        await app.start();

        expect(() => {
            app.addDatabase({} as any);
        }).toThrowError(/Cannot modify App after it has been started/);

        await app.stop();
    });

    it('addEndpoints should throw an error if the app is locked', async () => {
        const app = new App({
            isProduction: false,
        });
        await app.start();

        expect(() => {
            app.addEndpoints({} as any);
        }).toThrowError(/Cannot modify App after it has been started/);

        await app.stop();
    });

    it('addEndpoint should throw an error if the app is locked', async () => {
        const app = new App({
            isProduction: false,
        });
        await app.start();

        expect(() => {
            app.addEndpoint({} as any);
        }).toThrowError(/Cannot modify App after it has been started/);

        await app.stop();
    });

    it('setAuthenticator should throw an error if the app is locked', async () => {
        const app = new App({
            isProduction: false,
        });
        await app.start();

        expect(() => {
            app.setAuthenticator({} as any);
        }).toThrowError(/Cannot modify App after it has been started/);

        await app.stop();
    });

    it('addCrudEndpoints should throw an error if the app is locked', async () => {
        const app = new App({
            isProduction: false,
        });
        await app.start();

        expect(() => {
            app.addCrudEndpoints({} as any);
        }).toThrowError(/Cannot modify App after it has been started/);

        await app.stop();
    });
});