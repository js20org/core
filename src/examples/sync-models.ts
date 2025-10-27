import { App, MySqlDatabase } from '@js20/core';
import { getConnectOptions } from './shared/connection';
import { MyModels, models } from './shared/models';
import dotenv from 'dotenv';

dotenv.config({ quiet: true });
const app = new App<MyModels>();
const connectOptions = getConnectOptions();

const databaseReal = new MySqlDatabase(connectOptions, {
    initializeTables: true,
    force: true,
    muteDropTable: true,
});

//<sync>
const database = new MySqlDatabase(connectOptions, {
    initializeTables: true,
});
//</sync>

database.addModels(models);
databaseReal.addModels(models);
app.addDatabase(databaseReal);
app.start();
