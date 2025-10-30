import { App, WebServerType } from '@js20/core';

//<docs>
const app = new App({
    isProduction: false,
    server: {
        type: WebServerType.express,
        port: 65000,
    }
});
//</docs>

app.start();
