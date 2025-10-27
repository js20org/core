import { App, MySqlDatabase } from '@js20/core';

const connectOptions = {} as any;

// <include>
import { Model } from '@js20/core';
import { sBoolean, sString } from '@js20/schema';

interface Car {
    isLeased: boolean;
    registrationNumber: string;
}

const sCar: Car = {
    isLeased: sBoolean().type(),
    registrationNumber: sString().matches(/^[A-Z0-9]{1,7}$/).type(),
}

// Models are defined in the Models interface

interface Models {
    // Make sure to type each model with Model<T>
    car: Model<Car>;
}

const models: Models = {
    car: {
        name: 'car',
        schema: sCar,
    }
};

// Make sure to type the App with your Models interface, will be important later!
const app = new App<Models>();
const database = new MySqlDatabase(connectOptions);

database.addModels(models);
// </include>
