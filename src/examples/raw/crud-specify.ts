import { App } from '@js20/core';
import { models, MyModels } from '../shared/models';

const app = new App<MyModels>();

// <include>
// You can also specify which endpoints to add
app.addCrudEndpoints(models.car, {
    types: ['get', 'create']
});
// </include>
