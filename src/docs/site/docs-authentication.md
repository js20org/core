# Authentication
$$ meta:title JS20 - Authentication
$$ meta:description Learn how to implement user authentication in JS20.

Add an _Authenticator_ to your app to enable user registration and authentication. Currently we support the following Authenticators:
- BetterAuth

Here's how to add it to your JS20 app:

$$ import src/examples/raw/auth.ts

### What's happening here?
* We use **BetterAuth** as authenticator
* We enable **email & password** login

## Connect frontend authentication
BetterAuth offers frontend SDKs for **React**, **Vue**, **Svelte** and **Solid** to easily connect your frontend app to the authentication system.

[Read more here](https://www.better-auth.com/docs/concepts/client)

## Test auth with manual requests
If you want a quick way to test authentication without setting up a frontend app, you can use a tool like **Postman** to make HTTP requests to your authentication endpoints.

### Sign up a new user
First sign up a new user:

```bash
POST /api/auth/sign-up/email
Headers:
    Content-Type: application/json
    Origin: http://localhost:3000

Body:
{
    "email": "<user email>",
    "name": "<user name>",
    "password": "<user password>",
    "confirmPassword": "<user password>"
}
```

> Note! Make sure to provide a valid Origin header, since BetterAuth strictly requires an Origin header for it to work.

### Login user
Next, login the user:

```bash
POST /api/auth/sign-in/email
Headers:
    Content-Type: application/json
    Origin: http://localhost:3000

Body:

{
    "email": "<user email>",
    "password": "<user password>"
}
```

The sign-in response will contain an auth Cookie. If you are using Postman, the cookie will automatically be passed along with your subsequent requests to the same API. Now you can access protected endpoints.

If you want to pass it along manually, you can make requests like this:

```ts
// Typescript example
const url = `http://localhost:3000/api/auth/sign-in/email`;
const response = await fetch(url, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        email: user.email,
        password: user.password
    })
});

const authCookie = response.headers.get('set-cookie');

await fetch('http://localhost:3000/protected-route', {
    method: 'GET',
    headers: {
        'Content-Type': 'application/json',
        'Cookie': authCookie
    }
});
```

> Note! Make sure to provide a valid Origin header, since BetterAuth strictly requires an Origin header for it to work.

## Configure BetterAuth for production
When you are ready to go live you need to pass along a few more options to BetterAuth.

$$ import ./src/examples/raw/auth-config.ts

Read more here:
[Security & Prod checklist](/docs-security#configure-authenticator)
