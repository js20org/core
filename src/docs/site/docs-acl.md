# Use models & ACL
$$ meta:title JS20 - User Guide
$$ meta:description JS20

> **Access Control Logic (ACL)** — the rules and reasoning that determine who is allowed to access which resources and under what conditions.

## Model ownership
When registering a model, you can specify if the model is owned by a user:
```ts
const models: Models = {
    car: {
        name: 'car',
        schema: sCar,
        // Model is owned by a user
        isOwned: true,
    }
};
```

This will automatically add an **ownerId** field to the model table, and enforce ACL rules so only the owner of a car can read or modify it.

> If you have added an authenticator to the app, the **isOwned** property will default to **true** for all models.

## Automatic ACL
In JS20 ACL is automatically built in. This means - if your model is marked as **isOwned: true**, the framework will always append **where ownerId === user.id** to any queries. To modify an owned item, the endpoint must be marked as **isLoggedIn: true** as well.

## Using models

You can now create endpoints that write & read models. These endpoints automatically enforce ACL rules based on whether the user is logged in.

$$ import src/examples/raw/using-models.ts

### What's happening here?
- All our registered models exist in **system.models**
- We can call **system.models.car.create(car: Car)** to create a new car
- We pass along the input as-is, since **inputSchema** has already validated it
- Automatic **ACL** is applied, userId is automatically set as **ownerId**

#### What's done under the hood
We can safely forward the provided user input. JS20 will take care of everything. Under the hood, it does:

```ts
/*
Before running action:
1. Make sure user is logged in (because isLoggedIn: true)
2. Validate all input by the inputSchema
*/
run: async (system, input) => {
    /*
    When calling car.create():
    3. Safely sanitize the input so no illegal chars
    4. Create a new database item with the current user as owner
    5. Fetch the newly created item
    6. Validate & sanitize data by the outputSchema and ensure user has the right to access it
    7. Return the newly created item
    */
    return system.models.car.create(input);
}
```

## Get, Update & Delete
We can also call other read/write operations:

```
system.models.car.getById(id);
system.models.car.updateById(id, data);
system.models.car.deleteById(id);
```
