import { App, Schema } from '@js20/core';
import { MyModels, sCar } from '../shared/models';
import { sInteger, sString } from '@js20/schema';

const app = new App<MyModels>();

// <include>
// app.action is just a helper method to get proper typing
const assertMaxCarsPerUser = app.action({
    outputSchema: {
        count: sInteger().type(),
        message: sString().type(),
    },
    run: async (system) => {
        const maxCarsPerUser = 3;
        const count = await system.models.car.count();
        const isAllowed = count < maxCarsPerUser;

        if (!isAllowed) {
            throw new Error(`You can only create up to ${maxCarsPerUser} cars.`);
        }

        return {
            count,
            message: 'Ok'
        };
    }
});

app.addEndpoint({
    path: '/cars',
    method: 'POST',
    inputSchema: sCar,
    outputSchema: Schema.withInstance(sCar),
    isLoggedIn: true,
    run: async (system, input) => {
        // system.run() ensures system is passed along to the next action
        // as well as ensures input/output validation
        await system.run(assertMaxCarsPerUser);
        return system.models.car.create(input);
    },
});
// </include>
