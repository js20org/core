import { describe, expect, it, vi } from 'vitest';
import { getCrudEndpoint, getEndpointsFromCrud } from '../../../src/core/utils/crud';
import { sBoolean, sString } from '@js20/schema';
import { Model, Schema, sIdInput } from '../../../src/core';
import { CrudEndpoint, ModelFactories, ModelItem } from '../../../src/core/types';
import { MockModelFactory } from '../../mock/model-factory';

interface Test {
    value: string;
    bool: boolean;
}

const sTest: Test = {
    value: sString().type(),
    bool: sBoolean().type(),
};

const model: Model<Test> = {
    name: 'Test',
    schema: sTest,
};

const modelKey = 'test';
const defaultValue: Test = { value: 'test', bool: true };

describe('getEndpointsFromCrud', () => {
    it('throws on unknown model key', () => {
        const crudEndpoints: CrudEndpoint[] = [
            {
                model,
                types: ['list'],
            },
        ];

        const models: ModelItem[] = [
            {
                ...model,
                name: 'wrongName',
                modelKey,
            }
        ];

        expect(() => getEndpointsFromCrud(
            crudEndpoints,
            models
        )).toThrowError('Model with name "Test" not found');
    });

    it('returns endpoints', () => {
        const crudEndpoints: CrudEndpoint[] = [
            {
                model,
                types: ['list', 'get'],
            },
        ];

        const models: ModelItem[] = [
            {
                ...model,
                modelKey,
            }
        ];

        const endpoints = getEndpointsFromCrud(
            crudEndpoints,
            models
        );

        expect(endpoints.length).toBe(2);
        expect(endpoints[0].path).toBe('/test');
        expect(endpoints[1].path).toBe('/test/:id');
    });
});

describe('getCrudEndpoint', () => {
    it('Wrong model key throws', async () => {
        const factory = new MockModelFactory<Test>(defaultValue);
        const models: ModelFactories<any> = {
            [modelKey]: factory,
        };

        const list = getCrudEndpoint(
            'list',
            model,
            'wrongKey',
        );

        await expect(() => list.run({ models } as any, {})).rejects.toThrowError('Model with key "wrongKey" not found');
    });

    it('List works', async () => {
        const factory = new MockModelFactory<Test>(defaultValue);
        const models: ModelFactories<any> = {
            [modelKey]: factory,
        };

        const spy = vi.spyOn(factory, 'getAll');
        const list = getCrudEndpoint(
            'list',
            model,
            modelKey,
        );

        expect(list.method).toBe('GET');
        expect(list.path).toBe('/test');
        expect(list.inputSchema).toBeUndefined();
        expect(list.outputSchema).toEqual([Schema.withInstance(sTest)]);

        await list.run({ models } as any, {});
        expect(spy).toHaveBeenCalledOnce();
    });

    it('Get works', async () => {
        const factory = new MockModelFactory<Test>(defaultValue);
        const models: ModelFactories<any> = {
            [modelKey]: factory,
        };

        const spy = vi.spyOn(factory, 'getById');
        const get = getCrudEndpoint(
            'get',
            model,
            modelKey,
        );

        expect(get.method).toBe('GET');
        expect(get.path).toBe('/test/:id');
        expect(get.inputSchema).toEqual(sIdInput);
        expect(get.outputSchema).toEqual(Schema.withInstance(sTest));

        await get.run({ models } as any, { params: { id: '1' } });
        expect(spy).toHaveBeenCalledOnce();
    });

    it('Create works', async () => {
        const factory = new MockModelFactory<Test>(defaultValue);
        const models: ModelFactories<any> = {
            [modelKey]: factory,
        };

        const spy = vi.spyOn(factory, 'create');
        const create = getCrudEndpoint(
            'create',
            model,
            modelKey,
        );

        expect(create.method).toBe('POST');
        expect(create.path).toBe('/test');
        expect(create.inputSchema).toEqual(sTest);
        expect(create.outputSchema).toEqual(Schema.withInstance(sTest));

        await create.run({ models } as any, defaultValue);
        expect(spy).toHaveBeenCalledOnce();
    });

    it('Update works', async () => {
        const factory = new MockModelFactory<Test>(defaultValue);
        const models: ModelFactories<any> = {
            [modelKey]: factory,
        };

        const spy = vi.spyOn(factory, 'updateById');
        const update = getCrudEndpoint(
            'update',
            model,
            modelKey,
        );

        expect(update.method).toBe('PUT');
        expect(update.path).toBe('/test/:id');
        expect(update.inputSchema).toEqual(Schema.withIdPartial(sTest));
        expect(update.outputSchema).toEqual(Schema.withInstance(sTest));

        await update.run({ models } as any, { id: '1', ...defaultValue });
        expect(spy).toHaveBeenCalledOnce();
    });

    it('Delete works', async () => {
        const factory = new MockModelFactory<Test>(defaultValue);
        const models: ModelFactories<any> = {
            [modelKey]: factory,
        };

        const spy = vi.spyOn(factory, 'deleteById');
        const del = getCrudEndpoint(
            'delete',
            model,
            modelKey,
        );

        expect(del.method).toBe('DELETE');
        expect(del.path).toBe('/test/:id');
        expect(del.inputSchema).toEqual(sIdInput);
        expect(del.outputSchema).toEqual(Schema.withInstance(sTest));

        await del.run({ models } as any, { params: { id: '1' } });
        expect(spy).toHaveBeenCalledOnce();
    });

    it('Create with actions works', async () => {
        const factory = new MockModelFactory<Test>(defaultValue);
        const models: ModelFactories<any> = {
            [modelKey]: factory,
        };

        const createBefore = 'createBefore';
        const createAfter = 'createAfter';
        const runOrder: string[] = [];

        const system: any = {
            models,
            run: async (action: string) => {
                runOrder.push(action);
            },
        };

        const spy = vi.spyOn(factory, 'create').mockImplementation(async () => {
            runOrder.push('create');
            return {} as any;
        });

        const create = getCrudEndpoint(
            'create',
            model,
            modelKey,
            {
                createBefore: createBefore as any,
                createAfter: createAfter as any,
            }
        );

        await create.run(system, defaultValue);
        expect(spy).toHaveBeenCalledOnce();
        expect(runOrder).toEqual([createBefore, 'create', createAfter]);
    });

    it('Update with actions works', async () => {
        const factory = new MockModelFactory<Test>(defaultValue);
        const models: ModelFactories<any> = {
            [modelKey]: factory,
        };

        const updateBefore = 'updateBefore';
        const updateAfter = 'updateAfter';
        const runOrder: string[] = [];

        const system: any = {
            models,
            run: async (action: string) => {
                runOrder.push(action);
            },
        };

        const spy = vi.spyOn(factory, 'updateById').mockImplementation(async () => {
            runOrder.push('update');
            return {} as any;
        });

        const update = getCrudEndpoint(
            'update',
            model,
            modelKey,
            {
                updateBefore: updateBefore as any,
                updateAfter: updateAfter as any,
            }
        );

        await update.run(system, { id: '1', ...defaultValue });
        expect(spy).toHaveBeenCalledOnce();
        expect(runOrder).toEqual([updateBefore, 'update', updateAfter]);
    });

    it('Delete with actions works', async () => {
        const factory = new MockModelFactory<Test>(defaultValue);
        const models: ModelFactories<any> = {
            [modelKey]: factory,
        };

        const deleteBefore = 'deleteBefore';
        const deleteAfter = 'deleteAfter';
        const runOrder: string[] = [];

        const system: any = {
            models,
            run: async (action: string) => {
                runOrder.push(action);
            },
        };

        const spy = vi.spyOn(factory, 'deleteById').mockImplementation(async () => {
            runOrder.push('delete');
            return {} as any;
        });

        const del = getCrudEndpoint(
            'delete',
            model,
            modelKey,
            {
                deleteBefore: deleteBefore as any,
                deleteAfter: deleteAfter as any,
            }
        );

        await del.run(system, { params: { id: '1' } });
        expect(spy).toHaveBeenCalledOnce();
        expect(runOrder).toEqual([deleteBefore, 'delete', deleteAfter]);
    });
});