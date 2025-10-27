import { App, MySqlDatabase, Schema } from '@js20/core';
import dotenv from 'dotenv';
import { getConnectOptions } from '../shared/connection';
import { models, MyModels, sCar } from '../shared/models';

dotenv.config({ quiet: true });
const connectOptions = getConnectOptions();

const app = new App<MyModels>();
const database = new MySqlDatabase(connectOptions);

database.addModels(models);

//<models>
app.addEndpoint({
    path: '/cars',
    method: 'POST',
    inputSchema: sCar,
    outputSchema: Schema.withInstance(sCar),
    //Only logged in users can create cars
    isLoggedIn: true,
    run: async (system, input) => {
        // ownerId automatically set to user.id
        return system.models.car.create(input);
    }
});
//</models>

app.addDatabase(database);
app.start();
