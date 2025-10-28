# Endpoints
$$ meta:title JS20 - Endpoints
$$ meta:description Learn how to create API endpoints in JS20.

Here's how to define an endpoint.

$$ import src/examples/raw/adding-endpoint.ts

## What's happening here?

* We create our **Input** type that accepts two numbers: a & b
* We create our **Output** type that returns a single number: sum
* We create **Schemas** that validate input & output in runtime
* Then we **register our endpoint** POST /sum that returns sum = a + b
* We don't have to validate user input, since it automatically validates against the schema
* **isLoggedIn: false** means this endpoint is public and doesn't require authentication
