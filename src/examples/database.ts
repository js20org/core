import { type MysqlConnectOptions, MySqlDatabase, App } from '@js20/core';
import dotenv from 'dotenv';

const app = new App({
    isProduction: false,
});

//<database>
dotenv.config({ quiet: true });

const connectOptions: MysqlConnectOptions = {
    host: process.env.SQL_HOST || '',
    port: parseInt(process.env.SQL_PORT || '5432'),
    user: process.env.SQL_USER || '',
    password: process.env.SQL_PASSWORD || '',
    database: process.env.SQL_DATABASE || '',
};

// Use any databases we support, or make your own!
const database = new MySqlDatabase(connectOptions);

// Register database with the app
app.addDatabase(database);

//</database>

app.start();
