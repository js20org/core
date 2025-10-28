# Generate frontend

$$ meta:title JS20 - Generate frontend
$$ meta:description Learn how to generate frontend SDK code in JS20.

By running generate() you can create the full SDK based on your backend code. This will create helper functions like:

```ts
// [Auto-generated]
export const createCar = async (input: Car): Promise<Car & Instance> => {
    // Validate input
    // Run http request: POST [baseUrl]/car
    // Validate output
    // Handle errors
    // Return output
};
```

You generate the frontend code by calling the **async generate()** function.

$$ import src/examples/raw/generate.ts

Which produces output like this, as well as the saved file that you can use in your frontend project:
![Logs from the generate command](/public/images/generate.png)

## What's happening here?
* You provide an **entryPath** to your TS types, so JS20 can rebuild them for frontend
* You provide an **outputs** array, which is where the generated files will be saved
* You provide a **baseUrl** which is the URL of your backend server
* JS20 will read your backend code, and generate the full SDK for you
* [Full GenerateConfig docs](/docs-api-reference#generateconfig)