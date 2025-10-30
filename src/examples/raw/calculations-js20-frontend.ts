import { App } from '@js20/core';
import path from 'path';

const app = new App({
    isProduction: false,
});

async function run() {
// <include>
await app.generate({
    entryPath: path.resolve('./src/types.ts'),
    outputs: ['./dist/client.ts'],
    baseUrl: 'https://www.example.com',
});
// </include>
}