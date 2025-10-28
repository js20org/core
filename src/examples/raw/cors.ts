import { App } from '@js20/core';

// <include>
const app = new App({
    server: {
        allowedOrigins: ['https://example.com', 'https://anotherdomain.com']
    }
});
// </include>
