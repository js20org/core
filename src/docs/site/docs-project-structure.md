# Project Structure
$$ meta:title JS20 - User Guide
$$ meta:description JS20

We recommend using **TypeScript ESM builds** with the following project structure:

```
src
├── app.ts              # Main app setup
├── models.ts           # Data models
├── endpoints           # Endpoints grouped by feature
│   ├── car.ts          
│   ├── manufacturer.ts
│   └── ...ts
├── logic               # Reusable business logic actions
│   ├── payments.ts     
│   ├── ownership.ts    
│   └── ...ts
├── types.ts            # Main types, including Models interface
└── schemas.ts          # Data schemas
package.json
tsconfig.json
...other files
```

