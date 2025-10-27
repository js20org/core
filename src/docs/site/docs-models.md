# Register models
$$ meta:title JS20 - User Guide
$$ meta:description JS20

Here's how to register models.

$$ import src/examples/raw/models.ts

## What's happening here?
* We define the **Models** interface. We recommend to name it like this (will be used in frontend generation)
* Make sure to type each model with **Model<T>**
* Point to the right **Schema**, make sure the schema extends the model interface
* **Register** the models in the database where you want them stored
* If the Models interface becomes too big, break it up like **type Models = SomeModels & SomeOtherModels;**
