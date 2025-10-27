import { getValidatedSchema, validateBySchema, ValidatedSchema } from '@js20/schema';
import { ComputedEndpoint, System, Headers, User, RequestHandlerProps, Action, ModelFactoryProps, ModelFactories, Database, BaseSystem, SystemLoggedIn, ModelFactory, ErrorResponse } from '../types';
import { isAllowedInEndpoint } from '../utils/endpoints';
import { Transaction } from 'sequelize';

export type Response = {
    code: number;
    data?: any;
} | ErrorResponse;

interface SystemProps extends RequestHandlerProps {
    headers: Headers;
    databaseItems: DatabaseItem[];
}

export interface DatabaseItem {
    database: Database<any>;
    transaction: Transaction;
}

export async function handleRequest(
    props: RequestHandlerProps,
    computed: ComputedEndpoint,
    headers: Headers,
    input: any
): Promise<Response> {
    const { validatedOutputSchema, validatedInputSchema, endpoint } = computed;
    const { user, isAllowed } = await isAllowedInEndpoint(props.authenticator, headers, computed);
    const { handleError } = props;
    
    if (!isAllowed) {
        return {
            code: 401,
            error: 'Unauthorized',
        };
    }

    const databaseItems = await getDatabaseItems(props.databases);

    const systemProps: SystemProps = {
        ...props,
        headers,
        databaseItems,
    };

    const system = getSystem(systemProps, computed, user);
    const { isValid, data, error } = await runAction(endpoint, system, input, validatedInputSchema, validatedOutputSchema);

    if (isValid) {
        await commit(databaseItems);

        return {
            code: 200,
            data,
        };
    } else {
        await rollback(databaseItems);
        return await handleError(error);
    }
}

async function commit(databaseItems: DatabaseItem[]): Promise<void> {
    for (const { transaction } of databaseItems) {
        await transaction.commit();
    }
}

async function rollback(databaseItems: DatabaseItem[]): Promise<void> {
    for (const { transaction } of databaseItems) {
        await transaction.rollback();
    }
}

async function getDatabaseItems(databases: Database<any>[]): Promise<DatabaseItem[]> {
    const result: DatabaseItem[] = [];

    for (const database of databases) {
        const transaction = await database.getTransaction();

        result.push({
            database,
            transaction,
        });
    }

    return result;
}

function getValidatedInput(schema: ValidatedSchema<any>, data: any): any {
    validateBySchema(schema, data);
    return data;
}

export function getSystem(props: SystemProps, computed: ComputedEndpoint, user: User | null): System<any> {
    const system = getSystemWithoutRun(props, computed, user) as System<any>;

    system.run = async (action, input) => {
        const validatedInputSchema = action.inputSchema ? getValidatedSchema(action.inputSchema) : undefined;
        const validatedOutputSchema = getValidatedSchema(action.outputSchema);
        const { isValid, data, error } = await runAction(action, system, input, validatedInputSchema, validatedOutputSchema);

        if (isValid) {
            return data;
        } else {
            throw error;
        }
    };

    return system;
}

export function getSystemWithoutRun(props: SystemProps, computed: ComputedEndpoint, user: User | null): Omit<System<any>, 'run'> {
    if ('isLoggedIn' in computed.endpoint && computed.endpoint.isLoggedIn) {
        if (!user) {
            throw new Error('No user object for logged in endpoint');
        }

        return getSystemLoggedIn(props, user);
    } else {
        return getSystemPublic(props);
    }
}

export async function runAction(
    action: Action<any, any, any, any>,
    system: System<any>,
    input: any,
    validatedInputSchema: ValidatedSchema<any> | undefined,
    validatedOutputSchema: ValidatedSchema<any>
) {
    try {
        const validatedInput = validatedInputSchema ? getValidatedInput(validatedInputSchema, input) : undefined;
        const output = await action.run(system as any, validatedInput);

        validateBySchema(validatedOutputSchema, output);

        return {
            isValid: true,
            data: output,
        };
    } catch (error: any) {
        return {
            isValid: false,
            error,
        };
    }
}

export function getSystemPublic({ databaseItems, headers }: SystemProps): Omit<BaseSystem<any>, 'run'> {
    const models = getModelFactories({
        user: null,
        bypassOwnership: false,
    }, databaseItems);

    const bypassModels = getModelFactories({
        user: null,
        bypassOwnership: true,
    }, databaseItems);

    return {
        bypassAcl: {
            models: bypassModels,
        },
        headers,
        models,
    }
}

export function getSystemLoggedIn({ databaseItems, headers }: SystemProps, user: User): Omit<SystemLoggedIn<any>, 'run'> {
    const models = getModelFactories({
        user,
        bypassOwnership: false,
    }, databaseItems);

    const bypassModels = getModelFactories({
        user,
        bypassOwnership: true,
    }, databaseItems);

    return {
        bypassAcl: {
            models: bypassModels,
        },
        headers,
        models,
        user,
    };
}

export function getModelFactories(props: Omit<ModelFactoryProps, 'transaction'>, databaseItems: DatabaseItem[]): ModelFactories<any> {
    const factories: ModelFactories<any> = {};

    for (const item of databaseItems) {
        const next = item.database.getModelFactories({
            ...props,
            transaction: item.transaction,
        });

        for (const key of Object.keys(next)) {
            if (factories[key]) {
                throw new Error(`Model factory already exists: ${key}`);
            }

            factories[key] = next[key];
        }
    }

    return factories;
}
