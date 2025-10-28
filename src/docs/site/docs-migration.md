# Database Migration
$$ meta:title JS20 - Database Migration
$$ meta:description Learn how to migrate your database schema in JS20.

## Initialize tables automatically

$$ import src/examples/sync-models.ts --show-output

## What's happening here?
* By setting **initializeTables: true** JS20 automatically issues create queries for all models
* The table **columns** are derived from models & their schemas
