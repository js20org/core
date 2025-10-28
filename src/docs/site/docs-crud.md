# CRUD
$$ meta:title JS20 - CRUD
$$ meta:description Learn how to create CRUD endpoints for your models in JS20.

The fastest way to create endpoints for a model is to use the CRUD helper function. One line of code can give you all 5 REST endpoints for a model.

$$ import src/examples/raw/crud.ts

Would generate the following endpoints:

```
- GET /car - list all cars
- GET /car/:id - get a single car by id
- POST /car - create a new car
- PUT /car/:id - update a car by id
- DELETE /car/:id - delete a car by id
```

You can also manually specify which endpoints to add:

$$ import src/examples/raw/crud-specify.ts

## Business logic
You can add business logic that is used in the CRUD endpoints, by specifying actions to run before or after certain operations:

$$ import src/examples/raw/crud-actions.ts