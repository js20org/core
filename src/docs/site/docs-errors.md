# Error handling
$$ meta:title JS20 - Errors
$$ meta:description Learn how JS20 handles errors and how to implement custom error handling.

JS20 applies automatic error handling inside the run functions of the endpoints. At any time you can throw an error and the user-facing response will have status code 500 with your error message, or a generic "Unknown error" message.

* If you throw error like **new Error(message: string)** then the message is passed to the client
* If you do not want to expose the error message, just throw a generic **new Error()** without a message
* If any validation fails for any schema (or the schema itself is invalid), then a validation error is thrown automatically with user-facing details about what you did wrong

```ts
app.addEndpoint({
    method: 'GET',
    path: '/error-example',
    outputSchema: sMessage,
    isLoggedIn: true,
    run: async (system) => {
        throw new Error("This error message will be user-facing");
    }
});
```

## Custom error handler
You can apply a custom error handler to catch any errors in the app and decide what to do with them:

```ts
async function handleError(error: any): ErrorResponse {
    await saveToMyErrorLoggingService(error);

    return {
        error: "A custom error message",
        code: 408
    };
}

const app = new App({
    handleError,
});
```

### What's happening here?
* We provide an async **handleError** function to catch all errors
* We log the error to an external service
* We return a custom error response with a message and HTTP status code 408
