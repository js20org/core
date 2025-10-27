import { App, WebServerType } from '@js20/core';

//<docs>
const app = new App({
    server: {
        type: WebServerType.express,
        port: 65000,
    }
});
//</docs>

app.start();
