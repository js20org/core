# Helper schemas
$$ meta:title JS20 - Helper Schemas
$$ meta:description Learn about helper schemas in JS20 for combining and extending schemas.

Schemas are just objects, so you can join them together like this:

```ts
const sCar: Car = {
    registrationNumber: sString().type(),
};

const sOwner: Owner = {
    name: sString().type(),
    age: sNumber().min(0).type(),
};

const combined: Car & Owner = {
    ...sCar,
    ...sOwner,
};

/*
Combined becomes:
{
    registrationNumber: sString().type(),
    name: sString().type(),
    age: sNumber().min(0).type(),
}
*/
```

## Instance schemas
Often you want to return a database instance from your endpoint, which contains the fields **id**, **createdAt**, **updatedAt** and **ownerId** as well as your custom properties. You can do it by using the helper function **Schema.withInstance()**, which appends these fields to your existing schema:

$$ import src/examples/raw/helper-schemas.ts#withInstance

These two are the same:

```ts
const sCarWithInstance = Schema.withInstance(sCar);
```

And this:

```ts
const sCarWithInstance = {
    ...sCar,
    id: sString().type(),
    createdAt: sDate().type(),
    updatedAt: sDate().type(),
    ownerId: sString().type(),
};
```

## Id schemas

**Schema.withId()** adds an ID property to your schema.

```ts
const sCarWithId = Schema.withId(sCar);
```

Which is the same as:

```ts
const sCarWithId = {
    ...sCar,
    id: sString().type(),
};
```
