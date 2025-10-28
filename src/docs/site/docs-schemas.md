# Schemas
$$ meta:title JS20 - Schemas
$$ meta:description Learn about schemas in JS20 for data validation and structure.

Schemas are used to verify your data structures at runtime.

$$ import src/examples/raw/schemas.ts

## What's happening here?
* A schema is an interface but for runtime. You can also add additional rules like **min()**, **max()**, **matches()** etc.
* By having the schema **extend the interface** we get type safety and autocompletion in our IDE
* All schema field has to end with **type()** to cast it into the expected type
* Use **optional()** for optional fields
* We recommend to use **s<YourInterfaceName>** as naming