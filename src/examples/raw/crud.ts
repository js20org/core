import { App } from '@js20/core';
import { models, MyModels } from '../shared/models';

const app = new App<MyModels>();

// <include>
// Adds CRUD endpoints for the Car model: list, get, create, update, delete
app.addCrudEndpoints(models.car);
// </include>
