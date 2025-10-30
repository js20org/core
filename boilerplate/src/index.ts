import path from 'path';
import dotenv from 'dotenv';

import { App, BetterAuth, Model, MySqlDatabase } from '@js20/core';
import { sNumber, sString } from '@js20/schema';

dotenv.config();

interface Example {
    someString: string;
    someNumber: number;
}

const sExample: Example = {
    someString: sString().nonEmpty().type(),
    someNumber: sNumber().type()
};

interface Models {
    example: Model<Example>;
}

const models: Models = {
    example: {
        name: 'Example',
        schema: sExample,
    }
}

const app = new App<Models>({
    // Dev mode for now
    isProduction: false,
});

const database = new MySqlDatabase({
    isInMemory: true,
});

const auth = new BetterAuth(database);

database.addModels(models);
app.addDatabase(database);
app.setAuthenticator(auth);
app.addCrudEndpoints(models.example);

async function run() {
    await app.generate({
        entryPath: path.resolve('src/index.ts'),
        outputs: [path.resolve('dist-client/client.ts')],
        baseUrl: 'http://localhost:3000',
    });

    await app.start();
}

run();
