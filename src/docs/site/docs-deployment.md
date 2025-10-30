# Deployment guide
$$ meta:title JS20 - Deployment guide
$$ meta:description Learn about deployment in JS20 and how to prepare your app for production.

## Build your app
Before deploying your app, make sure to build it for production by setting **isProduction: true** in your main config. We recommend using **esbuild** for a fast and efficient build process.

## Docker image

Since the JS20 framework uses an **express server** on **node@20**, we recommend a simple docker image like so:

```bash
FROM node:20
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

You can deploy your docker image as you normally would, for example on AWS ECS, Google Cloud Run, or any other container service.

## Connecting to SQL database
Under the hood JS20 uses Sequelize and initializes like this:

```ts
new Sequelize(
    connectionOptions.database,
    connectionOptions.user,
    connectionOptions.password,
    {
        host: connectionOptions.host,
        port: connectionOptions.port,
        dialect: 'mysql',
    }
);
```

If you in the **MysqlConnectOptions** set **shouldUseSocket: true**, js20 will use the host as the socket path:

```ts
new Sequelize(
    connectionOptions.database,
    connectionOptions.user,
    connectionOptions.password,
    {
        host: connectionOptions.host,
        port: connectionOptions.port,
        dialect: 'mysql',
        socketPath: connectionOptions.host,
    }
);
```

This allows you to connect to cloud SQL instances that require socket connections, such as Google Cloud SQL.

## SSL connections

We currently don't support SSL connections from the js20 backend to the mysql database, since we assume that you are operating service-to-service from within a private VPC. If you need SSL support, please bump this issue:

[SSL issue](https://github.com/js20org/core/issues/10)

## Environment variables
No environment variables are required by JS20, all options can be passed through the main config. However, make sure to use node production mode:

```bash
NODE_ENV=production node dist/server.js
```
