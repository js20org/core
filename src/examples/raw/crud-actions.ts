import { App } from '@js20/core';
import { models, MyModels } from '../shared/models';
import { sInteger, sString } from '@js20/schema';

const app = new App<MyModels>();

// <include>
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

app.addCrudEndpoints(models.car, {
    actions: {
        // Run assertMaxCarsPerUser action before creating a car
        createBefore: assertMaxCarsPerUser,
    }
});
// </include>
