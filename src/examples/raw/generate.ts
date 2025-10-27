import { MySqlDatabase, App } from '@js20/core';
import dotenv from 'dotenv';
import { getConnectOptions } from '../shared/connection';
import { models, MyModels } from '../shared/advanced';
import path from 'path';

dotenv.config({ quiet: true });
const connectOptions = getConnectOptions();

const app = new App<MyModels>();
const database = new MySqlDatabase(connectOptions);

async function run() {
    database.addModels(models);
    app.addDatabase(database);
    app.addCrudEndpoints(models.car);
    app.addCrudEndpoints(models.fee);

    //<models>
    await app.generate({
        // An entry path to your TS types, so JS20 can rebuild them for frontend
        entryPath: path.resolve('./src/examples/shared/advanced.ts'),
        outputs: ['./dist/frontend.ts'],
        baseUrl: 'http://localhost:3000',
    });
    //</models>

    app.start();
}

run();
