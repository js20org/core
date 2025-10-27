import { App, Schema, MySqlDatabase } from '@js20/core';
import dotenv from 'dotenv';
import { getConnectOptions } from '../shared/connection';
import { models, MyModels, sCar } from '../shared/models';

dotenv.config({ quiet: true });
const connectOptions = getConnectOptions();

const app = new App<MyModels>();
const database = new MySqlDatabase(connectOptions);

database.addModels(models);

//<withInstance>
app.addEndpoint({
    path: '/cars',
    method: 'POST',
    inputSchema: sCar,
    outputSchema: Schema.withInstance(sCar),
    isLoggedIn: true,
    run: async (system, input) => {
        return system.models.car.create(input);
    }
});
//</withInstance>

app.addDatabase(database);
app.start();
