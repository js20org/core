import { App } from '@js20/core';

const app = new App({
    isProduction: false,
});

//<code>
import { sInteger } from '@js20/schema';

interface Input {
    a: number;
    b: number;
}

interface Output {
    sum: number;
}

const sInput: Input = {
    a: sInteger().type(),
    b: sInteger().type(),
};

const sOutput: Output = {
    sum: sInteger().type(),
};

app.addEndpoint({
    method: 'POST',
    path: '/sum',
    inputSchema: sInput,
    outputSchema: sOutput,
    isLoggedIn: false,
    run: (_system, { a, b }) => {
        // a and b are guaranteed to be integers here
        // returning anything else than the output format would error
        return { sum: a + b };
    }
});
//</code>
