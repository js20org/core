import { sString } from '@js20/schema';
import { App } from '@js20/core';

const app = new App();

// <include>
app.addEndpoint({
    method: 'GET',
    path: '/example',
    outputSchema: {
        message: sString().type(),
    },
    // Require the user to be logged in
    isLoggedIn: true,
    run: (system) => {
        // Only users that are logged in can reach this point
        // All others will receive a 401 Unauthorized response
        return {
            message: `You are logged in as "${system.user.name}" with email "${system.user.email}".`
        }
    }
});
// </include>
