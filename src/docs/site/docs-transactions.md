# Transactions
$$ meta:title JS20 - Transactions
$$ meta:description Learn how database transactions work in JS20 framework.

The whole **run()** function in an Endpoint action is using a **single DB transaction** (one transaction per database you register). When you call any model methods inside an Endpoint, or call other actions recursively, they all run within the same transaction. If *anything* fails - *everything* is rolled back - and the API returns a 500 error.

```ts
app.addEndpoint({
    method: 'GET',
    path: '/failure-example',
    outputSchema: sMessage,
    isLoggedIn: true,
    run: async (system) => {
        // Transaction is started here automatically

        // We create some entry
        await system.models.myModel.create(...);

        // We update another entry
        await system.models.otherModel.update(...);

        // This inner action throws an error
        // -> Transaction is rolled back, nothing is saved to DB
        // -> Action throws error and returns 500 to client
        await system.run(someActionThatThrowsError);

        return {
            message: 'We never reach here',
        };
    }
});

app.addEndpoint({
    method: 'GET',
    path: '/success-example',
    outputSchema: sMessage,
    isLoggedIn: true,
    run: async (system) => {
        // Transaction is started here automatically

        // We create some entry
        await system.models.myModel.create(...);

        // We update another entry
        await system.models.otherModel.update(...);

        // This inner action works fine
        await system.run(someActionThatWorksFine);

        return {
            message: 'All went well!',
        };

        // -> Transaction is commited here, all changes are saved to DB
        // -> User gets 200 Ok
    }
});
```

### What's happening here?
* All endpoint actions are wrapped in DB transactions automatically.
* Calling **create()**, **update()** & **delete()** will use the transaction.
* Calling other actions with **system.run()** will use the same transaction.
* If any error is thrown, the transaction is **rolled back**.
* If everything works fine, the transaction is **committed**.
* Only at the end of the endpoint action will anything actually be saved to the DB.