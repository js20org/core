# Patch & partial schemas
$$ meta:title JS20 - User Guide
$$ meta:description JS20

The **updateById()** function inside **system.models.[your_model].updateById()** supports partial schemas and patch updates.

To create the appropriate schemas, use either:
* **Schema.partial(schema)**
* **Schema.withIdPartial(schema)**

The first one turns all fields optional, and the second one does the same and then adds a required id field in the end. For your endpoint use **withIdPartial**:

```ts
{
    method: 'PUT',
    path: `/my-model/:id`,
    inputSchema: Schema.withIdPartial(schema),
    outputSchema: Schema.withInstance(schema),
    isLoggedIn: true,
    run: async (system, { id, ...rest}) => {
        return await system.models.myModel.updateById(id, rest);
    }
}
```

### What's happening here?
* Use **Schema.withIdPartial(schema)** to turn all properties to optional (and add the required id field)
* Separate **id** and **rest** of the properties in the run function
* Call **updateById(id, rest)** with the id and the partial properties to update
* This ensures id is required but no other properties
* Patches the model with only the provided properties, and returns the whole new model instance
