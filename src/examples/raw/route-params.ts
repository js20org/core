import { App, Schema, MySqlDatabase } from '@js20/core';
import dotenv from 'dotenv';
import { getConnectOptions } from '../shared/connection';
import { models, MyModels, sCar } from '../shared/models';
import { sString } from '@js20/schema';

dotenv.config({ quiet: true });
const connectOptions = getConnectOptions();

const app = new App<MyModels>();
const database = new MySqlDatabase(connectOptions);

database.addModels(models);

//<models>
app.addEndpoint({
    path: '/cars/:id',
    method: 'PUT',
    inputSchema: {
        ...sCar,
        id: sString().type(),
    },
    outputSchema: Schema.withInstance(sCar),
    isLoggedIn: true,
    run: async (system, input) => {
        // Id is passed along in input. Input is now Car & { id: string }
        return system.models.car.updateById(input.id, input);
    }
});
//</models>

app.addDatabase(database);
app.start();
