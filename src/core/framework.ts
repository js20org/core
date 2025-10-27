import fs from 'fs';
import path from 'path';

import { getFrontendCode } from './generate/generate-frontend.js';
import type { AppConfig, Authenticator, Database, Endpoint, InternalConfig, Model, ModelObject, PluginProps, RegexEndpoint, RequestHandlerProps, WebServer, Action, System, GenerateConfig, AppData, CrudOptions, CrudEndpoint, ModelItem } from './types.js';
import { getInternalConfig } from './utils/config.js';
import { HealthPlugin } from './utils/health.js';
import { getWebServer } from './web-server/web-server.js';
import { DefaultGenerateLogger, EmptyGenerateLogger } from './generate/logger.js';
import { getEndpointsFromCrud } from './utils/crud.js';
import { getComputedEndpoints, verifyEndpoint } from './utils/endpoints.js';
import { getComputedModels } from './utils/models.js';
import { globalHandleError } from './utils/error.js';

export class App<M extends ModelObject<M>> {
    private rawConfig?: AppConfig;
    private config: InternalConfig;
    private server: WebServer;
    private databases: Database<Partial<M>>[] = [];
    private authenticator?: Authenticator;
    private healthPlugin: HealthPlugin = new HealthPlugin();
    private protectedFieldNames: string[] = [];

    private crudEndpoints: CrudEndpoint[] = [];
    private regexEndpoints: RegexEndpoint<any>[] = [];
    private endpoints: Endpoint<M, any, any>[] = [];
    private models: ModelItem[] = [];

    private hasInitialized: boolean = false;
    private isLocked: boolean = false;

    constructor(config?: AppConfig) {
        this.rawConfig = config;
        this.config = getInternalConfig(config);
        this.server = getWebServer(this.config);
    }

    private async connectDatabases() {
        for (const db of this.databases) {
            await db.connect();
        }
    }

    private async disconnectDatabases() {
        for (const db of this.databases) {
            await db.disconnect();
        }
    }

    private addProtectedFieldNames(fieldNames: string[]) {
        for (const name of fieldNames) {
            this.protectedFieldNames.push(name);
        }
    }

    private async initialize() {
        const plugins = [
            this.healthPlugin,
            this.authenticator
        ].filter(p => !!p);

        const pluginProps: PluginProps = {
            addEndpoints: this.addEndpoints.bind(this),
            addRegexEndpoint: this.addRegexEndpoint.bind(this),
            addProtectedFieldNames: this.addProtectedFieldNames.bind(this),
        };

        // Plugins might add models
        for (const plugin of plugins) {
            await plugin.initialize(pluginProps);
        }

        // Initialize databases after plugins
        for (const database of this.databases) {
            await database.initialize(pluginProps);
        }

        this.loadModels();
        this.hasInitialized = true;
    }

    private addRegexEndpoint(endpoint: RegexEndpoint<any>) {
        this.regexEndpoints.push(endpoint);
    }

    private async syncDatabases(data: AppData) {
        for (const database of this.databases) {
            await database.sync(data.models);
        }
    }

    private getAppData(): AppData {
        const hasAuthentication = !!this.authenticator;
        const crud = getEndpointsFromCrud(this.crudEndpoints, this.models);
        const allEndpoints = [...this.endpoints, ...crud];

        const computedEndpoints = getComputedEndpoints(
            allEndpoints,
            hasAuthentication
        );

        const computedModels = getComputedModels(
            this.models,
            hasAuthentication,
            this.protectedFieldNames,
        );

        return {
            endpoints: computedEndpoints,
            regexpEndpoints: this.regexEndpoints,
            models: computedModels
        };
    }

    private async initializeWebServer(data: AppData) {
        const requestHandlerProps: RequestHandlerProps = {
            authenticator: this.authenticator,
            databases: this.databases,
            handleError: (e) => globalHandleError(e, this.rawConfig?.handleError),
        };

        await this.server.initialize(requestHandlerProps, data);
    }

    private async loadModels() {
        for (const database of this.databases) {
            const models = database.getModels();
            this.models.push(...models);
        }
    }

    private verifyNotLocked() {
        if (this.isLocked) {
            throw new Error('Cannot modify App after it has been started or code generation has begun.');
        }
    }

    addDatabase(database: Database<any>) {
        this.verifyNotLocked();
        this.databases.push(database);
    }

    addEndpoints(...endpoints: Endpoint<M, any, any>[]) {
        this.verifyNotLocked();

        endpoints.forEach(endpoint => {
            verifyEndpoint(endpoint);
        });

        this.endpoints.push(...endpoints);
    }

    addEndpoint<I = void, O = void>(endpoint: Endpoint<M, I, O>) {
        this.verifyNotLocked();
        this.addEndpoints(endpoint);
    }

    addCrudEndpoints(model: Model<any>, options?: CrudOptions) {
        this.verifyNotLocked();

        const {
            types = ['list', 'get', 'create', 'update', 'delete'],
            actions = {},
        } = options || {};

        this.crudEndpoints.push({ model, types, actions });
    }

    // Used to help with typing of actions
    action<I, O>(action: Action<M, System<M>, I, O>) {
        this.verifyNotLocked();
        return action;
    }

    endpoint<I, O>(endpoint: Endpoint<M, I, O>) {
        this.verifyNotLocked();
        return endpoint;
    }

    setAuthenticator(authenticator: Authenticator) {
        this.verifyNotLocked();
        this.authenticator = authenticator;
    }

    async start() {
        await this.connectDatabases();

        if (!this.hasInitialized) {
            await this.initialize();
        }

        this.isLocked = true;
        const data = this.getAppData();

        await this.syncDatabases(data);
        await this.initializeWebServer(data);

        await this.server.start();
    }

    async stop() {
        await this.disconnectDatabases();
        await this.server.stop();
    }

    async generate(config: GenerateConfig) {
        this.isLocked = true;

        if (!this.hasInitialized) {
            await this.initialize();
        }

        const logger = config.quiet ? new EmptyGenerateLogger() : new DefaultGenerateLogger();
        const app = this.getAppData();
        const code = await getFrontendCode(config, app, logger);

        for (const output of config.outputs) {
            fs.writeFileSync(path.resolve(output), code);
        }

        logger.print(config);
    }
}
