import { App, BetterAuth, MySqlDatabase } from '@js20/core';

const app = new App({
    isProduction: false,
});
const database = new MySqlDatabase(null as any);

// <include>
const auth = new BetterAuth(database, {
    useEmailPassword: true,
    secret: 'mysupersecretkey'
});

app.setAuthenticator(auth);
// </include>
