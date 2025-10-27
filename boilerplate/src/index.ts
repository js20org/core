import { App, BetterAuth, Model, MySqlDatabase } from '@js20/core';
import { sInteger, sString } from '@js20/schema';

import dotenv from 'dotenv';

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

app.start();
