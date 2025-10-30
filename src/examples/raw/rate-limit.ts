import { App } from '@js20/core';

// <include>
const app = new App({
    server: {
        rateLimit: {
            windowMs: 10 * 60 * 1000, // 10 minutes
            max: 100 // limit each IP to 100 requests per windowMs
        }
    }
});
// </include>
