import { App, BetterAuth } from '@js20/core';

const database: any = null;

// <include>
const authenticator = new BetterAuth(database, {
    secret: 'myproductionsecret',
    baseURL: 'https://myapp.com',
    useEmailPassword: true,
    cookie: {
        domain: 'example.com',
        path: '/',
    }
})
// </include>
