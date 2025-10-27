import type { CrudActions, CrudEndpoint, CrudEndpointType, Endpoint, Model, ModelFactories, ModelFactory, ModelItem, ModelObject } from '../types.js';
import { Schema } from './schema.js';
import { getUriCasing } from './string.js';
import { sIdInput } from '../types-shared.js';

export function getEndpointsFromCrud(
    crudEndpoints: CrudEndpoint[],
    models: ModelItem[]
) {
    const result: Endpoint<any, any, any>[] = [];

    for (const { model, types, actions } of crudEndpoints) {
        const modelKey = models.find(m => m.name === model.name)?.modelKey;

        if (!modelKey) {
            throw new Error(`Model with name "${model.name}" not found in any registered database. Make sure to register the model before adding CRUD endpoints for it.`);
        }

        for (const type of types) {
            const endpoint = getCrudEndpoint(type, model, modelKey, actions);
            result.push(endpoint);
        }
    }

    return result;
}

export function getCrudEndpoint<I, M extends ModelObject<M>>(
    type: CrudEndpointType,
    model: Model<I>,
    modelKey: string,
    actions?: CrudActions<I, M>
): Endpoint<any, any, any> {
    const path = getUriCasing(model.name);
    const defineEndpoint = <I, O>(endpoint: Endpoint<M, I, O>): Endpoint<M, I, O> => endpoint;

    switch (type) {
        case 'list':
            return defineEndpoint({
                method: 'GET',
                path: `/${path}`,
                outputSchema: [Schema.withInstance(model.schema)],
                isLoggedIn: true,
                run: async (system) => {
                    const factory = getModelFactory<I, M>(system.models, modelKey);
                    return factory.getAll();
                }
            });
        case 'get':
            return defineEndpoint({
                method: 'GET',
                path: `/${path}/:id`,
                inputSchema: sIdInput,
                outputSchema: Schema.withInstance(model.schema),
                isLoggedIn: true,
                run: async (system, input) => {
                    const factory = getModelFactory<I, M>(system.models, modelKey);
                    return factory.getById(input.id);
                }
            });
        case 'create':
            return defineEndpoint({
                method: 'POST',
                path: `/${path}`,
                inputSchema: model.schema,
                outputSchema: Schema.withInstance(model.schema),
                isLoggedIn: true,
                run: async (system, input) => {
                    if (actions?.createBefore) {
                        await system.run(actions.createBefore, input);
                    }

                    const factory = getModelFactory<I, M>(system.models, modelKey);
                    const instance = await factory.create(input);

                    if (actions?.createAfter) {
                        await system.run(actions.createAfter, instance);
                    }

                    return instance;
                }
            });
        case 'update':
            return defineEndpoint({
                method: 'PUT',
                path: `/${path}/:id`,
                inputSchema: Schema.withIdPartial(model.schema),
                outputSchema: Schema.withInstance(model.schema),
                isLoggedIn: true,
                run: async (system, input) => {
                    if (actions?.updateBefore) {
                        await system.run(actions.updateBefore, input);
                    }

                    const factory = getModelFactory<I, M>(system.models, modelKey);
                    const { id, ...rest} = input;
                    const instance = await factory.updateById(id, rest as I);

                    if (actions?.updateAfter) {
                        await system.run(actions.updateAfter, instance);
                    }

                    return instance;
                }
            });
        case 'delete':
            return defineEndpoint({
                method: 'DELETE',
                path: `/${path}/:id`,
                inputSchema: sIdInput,
                outputSchema: Schema.withInstance(model.schema),
                isLoggedIn: true,
                run: async (system, input) => {
                    if (actions?.deleteBefore) {
                        await system.run(actions.deleteBefore, input);
                    }

                    const factory = getModelFactory<I, M>(system.models, modelKey);
                    const instance = await factory.deleteById(input.id);

                    if (actions?.deleteAfter) {
                        await system.run(actions.deleteAfter, instance);
                    }

                    return instance;
                }
            });
        default:
            throw new Error(`Unsupported CRUD endpoint type: ${type}`);
    }
}

function getModelFactory<T, M extends ModelObject<M>>(models: ModelFactories<M>, modelKey: string): ModelFactory<T> {
    const modelFactory = models[modelKey as keyof ModelFactories<M>] as ModelFactory<T> | undefined;

    if (!modelFactory) {
        throw new Error(`Model with key "${modelKey}" not found. Have you registered the model in your database?`);
    }

    return modelFactory;
}
