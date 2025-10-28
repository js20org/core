$$ meta:title JS20 - Documentation
$$ meta:description Documentation for JS20 - Build TypeScript backends and SDKs with up to 90% less code. Faster, cheaper & easier to maintain. Ready for the AI era, less code = less tokens & reduced costs.

**JS20** - read as "JavaScript 2.0" - is a standard for writing backend applications in TypeScript that automatically generates the frontend SDK. The goal of JS20 is to do anything that is repetitive for you: Auth, ACL, Validation, Sanitation, ORM / queries, and more - so you can focus on only the business logic.

$$ codeQuote

## Quick start
✨ Generate a new JS20 project with the command below. This will set up a simple project structure, with an example app & all required dependencies.

```
npx @js20/core
```

## Features
- ⚡ **Core Building Blocks**: Define your app with building blocks - **schemas**, **models**, **endpoints** and **actions**.
- 🧬 **Database lifecycle**: Automatic migrations, queries, and inserts.
- 🔒 **Auth & ACL**: Built-in authentication and access control.
- 🪄 **Frontend Generator**: Automatically generates a fully type-safe frontend SDK using the same types as backend.
- 🧩 **Flexible & Modular**: Plug in any database, web server, or auth provider—no lock-in, fully customizable architecture.  
- 🛡️ **Secure by default**: Automatic validation and sanitation of user input, CORS & security best practices.
- 🧠 **AI-Ready**: Optimized for AI-assisted development—write less code, cut token costs, and reduce bugs.

## Run "Hello world" server

$$ import src/examples/hello-world.ts --show-output

## What's happening here?
* **new App()** - Creates a new app, which we can later add a database, endpoints, and more to
* **start()** - Starts a new app using express under the hood
* By default the app only has a single health endpoint at **GET /**

## Beta version

**Note:** JS20 is currently in beta. We are working on the final pieces to make it fully production-ready. Please try it out and give us feedback, but we don't recommend using it in production yet.

- [Project Status](https://github.com/orgs/js20org/projects/3/views/1)
