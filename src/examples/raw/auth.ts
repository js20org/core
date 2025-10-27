import { App, BetterAuth, MySqlDatabase } from '@js20/core';

const app = new App();
const database = new MySqlDatabase(null as any);

// <include>
const auth = new BetterAuth(database, {
    useEmailPassword: true,
});

app.setAuthenticator(auth);
// </include>
