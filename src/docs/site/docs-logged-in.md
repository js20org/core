# Logged-in endpoints
$$ meta:title JS20 - Logged-in Endpoints
$$ meta:description Learn how to create endpoints that require user authentication in JS20.

Create an endpoint that is only available to logged-in users.

$$ import src/examples/raw/logged-in-endpoint.ts

## What's happening here?
* **isLoggedIn: true** makes the endpoint require authentication
* **system.user** contains information about the logged-in user
