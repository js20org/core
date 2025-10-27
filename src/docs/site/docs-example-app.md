# Example app
$$ meta:title JS20 - User Guide
$$ meta:description JS20

Let's build a small app called **BookMate** — a simple backend where users can track the books they read and leave reviews.

With just a few lines of code, JS20 will handle **auth**, **validation**, **ACL**, **CRUD**, and even generate a type-safe **frontend SDK** automatically.

## 📋 Requirements
Requirements for our example app BookMate.

- Users can **log in** and manage their personal book list.  
- Each book stores its **title**, **author**, **finished status**, **optional average rating**, and **category**.
- Category is one of: **Fiction**, **Non-Fiction**, **Science**, **History** or **Fantasy**.
- Users can **write short reviews** with a comment and star rating.
- Limit each user to **20 books**.
- Validate that ratings are **between 1–5**.
- Automatically recalculate each user’s **average book rating** after reviews.

## Code
Here's the complete code for our app:

$$ import src/examples/raw/example-app.ts#app

We can also call generate() to automatically create the frontend SDK:

$$ import src/examples/raw/example-app.ts#generate

![Logs from the generate command](/public/images/example-app-generate.png)
![Outputted Read-Only file containing frontend SDK](/public/images/example-app-generate-output.png)
