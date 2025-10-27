import { ValidatedSchema } from '@js20/schema';
import { Options as PrettierOptions } from 'prettier';
import { IdInput, Instance, Message } from './types-shared';
import { Transaction, WhereOptions } from 'sequelize';
import { Database as BetterSqlite3Database } from 'better-sqlite3';


// ---------------- Config ----------------

//<config>
/**
 * Configuration for the App
 * @param server Configuration for the web server (Express, etc.)
 * @param handleError A custom error handler to format errors returned to clients
 */
export interface AppConfig {
    server?: WebServerConfig;
    handleError?: ErrorHandler;
}

/**
 * Response returned when an error has been handled
 * Will return as JSON to the client with the provided http code
 * @param error The user-facing error message, defaults to "Unknown error"
 * @param code The HTTP status code to return, defaults to 500
 * @param additionalInfo Any additional info to return to the client
 */
export interface ErrorResponse {
    error: string;
    code: number;
    additionalInfo?: any;
}

/**
 * A function that handles errors thrown in endpoints
 */
export type ErrorHandler = (error: any) => Promise<ErrorResponse>;

/**
 * Configuration for the web server
 * @param type The type of web server to use, defaults to 'express'
 * @param port The port to run the web server on, defaults to 3000 or process.env.PORT
 */
export interface WebServerConfig {
    type?: WebServerType;
    port?: number;
}

/**
 * The type of web server to use under the hood
 */
export enum WebServerType {
    express = 'express',
}
//</config>


// ---------------- Internal Config ----------------

type NoUndefined<T> = {
    [K in keyof T]-?: Exclude<T[K], undefined> extends object
        ? NoUndefined<Exclude<T[K], undefined>>
        : Exclude<T[K], undefined>;
};

export type InternalConfig = NoUndefined<Omit<AppConfig, 'handleError'>>;


// ---------------- Framework ----------------

export interface AppData {
    models: ComputedModel[];
    endpoints: ComputedEndpoint[];
    regexpEndpoints: RegexEndpoint<any>[];
}


// ---------------- Web Server ----------------

export interface WebServer {
    initialize(props: RequestHandlerProps, appData: AppData): Promise<void>;
    start(): Promise<void>;
    stop(): Promise<void>;
}


// ---------------- Plugins ----------------

export interface PluginProps {
    addEndpoints(...endpoints: Endpoint<any, any, any>[]): void;
    addRegexEndpoint(endpoint: RegexEndpoint<any>): void;
    addProtectedFieldNames(fieldNames: string[]): void;
}

export interface Plugin {
    initialize(props: PluginProps): Promise<void>;
}


// ---------------- System ----------------

export interface BaseSystem<M extends ModelObject<M>> {
    bypassAcl: {
        models: ModelFactories<M>;
    };
    headers: Headers;
    models: ModelFactories<M>;
    run<I, O>(action: Action<M, BaseSystem<M>, I, O>, input?: I): Promise<O>;
}

export interface SystemLoggedIn<M extends ModelObject<M>> extends BaseSystem<M> {
    user: User
}

export type System<M extends ModelObject<M>> = BaseSystem<M> | SystemLoggedIn<M>;


// ---------------- Actions ----------------

export interface Action<
    M extends ModelObject<M>,
    S extends System<M>,
    I,
    O
> {
    inputSchema?: I;
    outputSchema: O;
    run: (system: S, input: I) => Promise<O> | O;
}


// ---------------- Endpoints ----------------

export type EndpointMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export interface BaseEndpoint {
    path: string;
    method: EndpointMethod;
    generate?: {
        functionName?: string;
    };
}

export type Endpoint<M extends ModelObject<M>, I, O> = ({
    isLoggedIn: true;
} & BaseEndpoint & Action<M, SystemLoggedIn<M>, I, O>) | ({
    isLoggedIn: false;
} & BaseEndpoint & Action<M, BaseSystem<M>, I, O>);

export interface ComputedEndpoint {
    endpoint: Endpoint<any, any, any>;
    validatedInputSchema?: ValidatedSchema<any>;
    validatedOutputSchema: ValidatedSchema<any>;
}

export interface RegexEndpoint<IHandler> {
    plugin: string;
    path: string;
    getHandler(): IHandler;
}


// ---------------- Request handler ----------------

export interface RequestHandlerProps {
    authenticator?: Authenticator;
    databases: Database<any>[];
    handleError: ErrorHandler;
}

export interface RequestHandler {
    handleRequest(endpoint: Endpoint<any, any, any>, data: any): Promise<any>;
}


// ---------------- Database ----------------

export interface ModelFactoryProps {
    user: User | null;
    bypassOwnership: boolean;
    transaction: Transaction;
}

export interface Database<Pool> extends Plugin {
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    sync(thisDbModels: ComputedModel[]): Promise<void>;
    getModels(): ModelItem[];
    addModels(models: ModelObject<any>): void;
    getNewPool(): Pool | BetterSqlite3Database; 
    getModelFactories(props: ModelFactoryProps): Record<string, ModelFactory<any>>;
    getTransaction(): Promise<Transaction>;
}


// ---------------- Authentication ----------------

export interface AuthConfig {
    useEmailPassword?: boolean;
}

export interface User {
    id: string;
    email: string;
    name: string;
}

export type Headers = Record<string, string>;

export interface Authenticator extends Plugin {
    getUserFromHeaders(headers: Headers): Promise<User | null>;
}


// ---------------- Models ----------------

export interface Model<T> {
    name: string;
    schema: T;
    isOwned?: boolean;
    preserveName?: boolean;
}

export interface ComputedModel {
    model: ModelItem;
    validatedSchema: ValidatedSchema<any>;
    isOwned: boolean;
}

export interface ModelFactory<T> {
    getAll(where?: WhereOptions<T>): Promise<(T & Instance)[]>;
    getById(id: string, where?: WhereOptions<T>): Promise<(T & Instance)>;
    tryGetById(id: string, where?: WhereOptions<T>): Promise<(T & Instance) | null>;
    create(data: T): Promise<T & Instance>;
    updateById(id: string, data: Partial<T>): Promise<T & Instance>;
    deleteById(id: string): Promise<T & Instance>;
    tryDeleteById(id: string): Promise<T & Instance | null>;
    count(where?: WhereOptions<T>): Promise<number>;
}

export type ModelObject<Models> = { [K in keyof Models]: Model<any> };

export type ModelFactories<T extends ModelObject<T>> = {
    [K in keyof T]: ModelFactory<T[K]['schema']>;
};

export interface ModelItem extends Model<any> {
    modelKey: string;
}


// ---------------- CRUD Endpoints ----------------

export type CrudEndpointType = 'list' | 'get' | 'create' | 'update' | 'delete';


// ---------------- Generate ----------------
// <generate>
/**
 * Configuration for code generation
 * @param entryPath An entry path to your TS types, so the framework can rebuild them for frontend
 * @param outputs Where to save the generated files, can be multiple files
 * @param appName The name of your app, will be added as a comment in the top of the generated files
 * @param version The version of your app, will be added as a comment in the top of the generated files
 * @param comment Any extra comment to add in the top of the generated files
 * @param modelsName The name of your Models interface, by default assumes "Models"
 * @param baseUrl The base URL of your app, used to generate the client SDK
 * @param prettierOptions Options to pass to Prettier
 */
export interface GenerateConfig {
    entryPath: string;
    outputs: string[];
    appName?: string;
    version?: string;
    comment?: string;
    modelsName?: string;
    baseUrl: string;
    prettierOptions?: PrettierOptions;
    quiet?: boolean;
}
// </generate>

export interface AppCode {
    builtEnumsAndInterfaces: string;
    builtEndpoints: string;
}


// ---------------- CRUD ----------------

export interface CrudActions<I, M extends ModelObject<M>> {
    createBefore?: Action<M, System<M>, I, Message>;
    createAfter?: Action<M, System<M>, I & Instance, Message>;
    updateBefore?: Action<M, System<M>, Partial<I> & IdInput, Message>;
    updateAfter?: Action<M, System<M>, I & Instance, Message>;
    deleteBefore?: Action<M, System<M>, IdInput, Message>;
    deleteAfter?: Action<M, System<M>, I & Instance, Message>;
}

export interface CrudEndpoint {
    model: Model<any>;
    types: CrudEndpointType[];
    actions?: CrudActions<any, any>;
}

export interface CrudOptions {
    types?: CrudEndpointType[];
    actions?: CrudActions<any, any>;
}
