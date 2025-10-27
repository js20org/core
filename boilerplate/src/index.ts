import path from 'path';
import dotenv from 'dotenv';

import { App, BetterAuth, Model, MySqlDatabase } from '@js20/core';
import { sInteger, sString } from '@js20/schema';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);

dotenv.config();

interface MyModel {
    someString: string;
    someInteger: number;
}

const sMyModel: MyModel = {
    someString: sString().nonEmpty().type(),
    someInteger: sInteger().type()
};

interface Models {
    myModel: Model<MyModel>;
}

const models: Models = {
    myModel: {
        name: 'MyModel',
        schema: sMyModel,
    }
}

const app = new App<Models>();
const database = new MySqlDatabase({
    isInMemory: true,
});

const auth = new BetterAuth(database);

database.addModels(models);
app.addDatabase(database);
app.setAuthenticator(auth);
app.addCrudEndpoints(models.myModel);

async function run() {
    await app.generate({
        entryPath: __filename,
        outputs: [path.resolve('dist-client/client.js')],
        baseUrl: 'http://localhost:3000',
    });

    await app.start();
}

run();
