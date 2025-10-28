# Code reduction calculation
$$ template:plain
$$ meta:title JS20 - Code reduction calculation
$$ meta:description How we calculate code reduction claims for JS20

Here you can find information about how the claims related to code reductions are calculated. We can not guarantee your code reduction will be exactly as calculated here, but hope you will see a large reduction in your codebase by using JS20.

## Methodology
We will calculate code reduction like this:
1. Define example scenario
1. Write **JS20** code for scenario
1. Use AI to generate **traditional dev** code based on the scenario
1. Compare number of characters (excluding whitespace) between the two codebases

### What we mean with traditional dev
We mean including barebones frameworks to get a web server & db connection up and running, but not any advanced tooling like schema generation or similar.

Included in our traditional dev definition:
* Node
* Express
* MySql2 database connection
* Basic authentication library
* Sequelize for ORM

Not included:
* Schema library
* Any code generation tools

## Example scenario / prompt
Your job is to build a web server backend in Node using Express and MySQL.
Scenario: meeting-room reservations.

Do not include any schema libraries like Zod or similar.
Use BetterAuth email & password. Leave send email out of scope for now.
Don't use any Relationships between SQL models, just use ids & where statements.
Use Sequelize for ORM. Sync & generate tables.

Models:
1. Booking
2. Room
Room should have a room type, with enum values: Small, Medium, Large.

Business rules:
1. No overlapping bookings in the same room
2. Attendees ≤ room capacity
3. Duration ≥ 1 hour
4. Start must be in the future and within 30 days

Authentication:
- Only authenticated users can create bookings
- Users can only delete their own bookings
- Anyone can view rooms and bookings
- Rooms can be created by anyone, let's not worry about admin rights at this stage

Database
- Use MySQL2 for database connection
- Use a common SQL query library for queries

For every endpoint:
- Ensure user logged in
- Use params for ids
- Validate all input data, including ids - use reusable functions wherever needed
- Keep track of createdAt and updatedAt timestamps
- Keep track of ownerId, all queries need to take this into account with where ownerId = userId for secure ACL
- Always validate all output, don't trust DB output
- Try catch with errors like new Error(Message) and a generic 500 response
- Use async/await
- Valid endpoint statuses are 200, 401, 500

Define clear typescript types, e.g. interface Room {}, interface Booking {} etc.

Endpoints:
- POST /rooms
- GET /rooms
- GET /rooms/:id
- PUT /rooms/:id
- DELETE /rooms/:id
- POST /bookings
- GET /bookings
- GET /bookings/:id
- PUT /bookings/:id
- DELETE /bookings/:id

Write a Frontend API client:
- Do not include all business rules in the client, just basic validation
- With functions like async createRoom(data): Promise<Room & ModelInstance> ...
- Each function should contain: input validation, fetch call, output validation, error handling, and auth token passed along
- Don't implement signup, login or token storage, just assume the token is available in localStorage
- Include typescript types for all functions and data, as well as enums

Answer with two files:
1. server.ts with all backend TypeScript code
2. client.ts with all frontend API client TypeScript code

## Traditional dev code
Written by ChatGPT-5 based on the scenario/prompt above.

### Backend code
$$ import ./src/examples/raw/calculations-traditional-backend.ts

### Frontend code
$$ import ./src/examples/raw/calculations-traditional-frontend.ts

## JS20 Code

### Backend code
$$ import ./src/examples/raw/calculations-js20-backend.ts

### Frontend code
Generated automatically.
$$ import ./src/examples/raw/calculations-js20-frontend.ts

## Results

Counting characters:
- Without whitespace
- Without imports

$$ size
