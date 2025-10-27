# Chained actions
$$ meta:title JS20 - User Guide
$$ meta:description JS20

Actions are reusable code blocks that can be used within endpoints for repeating business logic. An action takes an input, validates it by the inputSchema, runs the action, then validates the output by the outputSchema & finally returns the output.

$$ import src/examples/raw/actions.ts

## What's happening here?
* We have an action called "assertMaxCarsPerUser" that prevents more than 3 cars per user
* If the action doesn't **throw**, we proceed to create the car
* **app.action()** - This is just a helper method to get types correct (so system.models include your models)
* Make sure you initialized your app like **new App<Models>()**!
* No input is used by this action, hence **inputSchema** is **undefined** and there is no **input** parameter in the run function
* Use **system.run()** to start an action. This ensures that the system object & validation works