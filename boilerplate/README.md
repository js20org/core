# Boilerplate for @js20/core
https://www.js20.dev/

## Get started:
### Prerequisites
- Node.js v20+

### Running
- npm i
- npm start

## Connect to real DB
- Set up a local or remote MySQL database
- Create a `.env` file in the root directory with the following variables:
```bash
SQL_USER=""
SQL_PASSWORD=""
SQL_DATABASE=""
SQL_HOST=""
SQL_PORT=3306
```
- Change `new MySqlDatabase({ ... })` in `src/index.ts` to:

```ts
function getConnectOptions(): MysqlConnectOptions {
    return {
        host: process.env.SQL_HOST || '',
        port: parseInt(process.env.SQL_PORT || '5432'),
        user: process.env.SQL_USER || '',
        password: process.env.SQL_PASSWORD || '',
        database: process.env.SQL_DATABASE || '',
    };
}

const connectOptions = getConnectOptions();
const database = new MySqlDatabase(connectOptions);
```

## Using API with Better Auth
With REST requests you can sign up and login user:

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

The sign-in response will contain an auth Cookie. Use this cookie in subsequent requests to access protected endpoints.

[Read more](https://www.js20.dev/docs-authentication)

## Endpoints
With a valid cookie you can now make requests like:

```bash
GET localhost:3000/MyModel

POST localhost:3000/MyModel
Body: 
{
    "someString": "test",
    "someInteger": 223
}

PUT localhost:3000/MyModel/{id}
Body: 
{
    "someString": "test",
    "someInteger": 223
}

DELETE localhost:3000/MyModel/{id}
```

## Issues
Submit a ticket here:
https://github.com/js20org/core/issues
