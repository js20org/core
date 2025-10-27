import { describe, expect, it } from 'vitest';
import { SequelizeFactory } from '../../../../src/core/database/factories/sequelize-factory';
import { getValidatedSchema, sBoolean, sString } from '@js20/schema';
import { User } from '../../../../src/core/types';
import { getLocalDbSequelize, getSequelizeModel } from '../../../mock/database';
import { Instance, Schema } from '../../../../src/core';

interface TestModel {
    stringValue: string;
    booleanValue: boolean;
}

const schema: TestModel = {
    stringValue: sString().type(),
    booleanValue: sBoolean().type(),
};

interface Options {
    isOwned: boolean;
    bypassOwnership: boolean;
    user: User;
    model: any;
    schemaOverride?: any;
}

function getWithoutMeta(items: any[]): Omit<Instance & TestModel, 'id' | 'createdAt' | 'updatedAt'>[] {
    return items.map(({ id, ownerId, createdAt, updatedAt, ...rest }) => rest);
}

function assertId(id: string) {
    expect(typeof id).toBe('string');
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    expect(uuidRegex.test(id)).toBe(true);
}

function assertMeta(items: (Instance & TestModel)[], expectOwner = true) {
    for (const item of items) {
        assertId(item.id);

        if (expectOwner) {
            expect(item.ownerId).toBeTypeOf('string');
            expect(item.ownerId?.length).toBeGreaterThan(0);
        } else {
            expect(item.ownerId).toBeUndefined();
        }

        expect(item.createdAt).toBeInstanceOf(Date);
        expect(item.createdAt.getTime()).toBeLessThanOrEqual(Date.now());
        expect(item.updatedAt).toBeInstanceOf(Date);
        expect(item.updatedAt.getTime()).toBeLessThanOrEqual(Date.now());
    }
}

async function getTestData(options: Partial<Options> = {}) {
    const sequelize = getLocalDbSequelize();

    const inputSchema = options.schemaOverride || schema;
    const chosenSchema = options.isOwned ? {
        ...inputSchema,
        ownerId: sString().type()
    } : inputSchema;

    const model = getSequelizeModel(sequelize, 'Test', chosenSchema);

    await sequelize.sync({ force: true });
    await model.bulkCreate([
        { stringValue: 'item1', booleanValue: true, ownerId: 'user-1' },
        { stringValue: 'item2', booleanValue: false, ownerId: 'user-2' },
    ]);

    const factory = getTestFactory({ ...options, model });

    return {
        model,
        sequelize,
        factory,
    }
}

function getUser1(): User {
    return {
        id: 'user-1',
        email: 'user1@example.com',
        name: 'User One',
    };
}

function getTestFactory(options?: Partial<Options>) {
    return new SequelizeFactory<TestModel>({
        modelName: 'Test',
        model: options?.model ?? {},
        dataSchema: getValidatedSchema(options?.schemaOverride || schema),
        isOwned: options?.isOwned ?? false,
        user: options?.user ?? null,
        bypassOwnership: options?.bypassOwnership ?? false,
        transaction: undefined as any,
    });
}

describe('validateData', () => {
    it('is ok for valid data', () => {
        const factory = getTestFactory();

        expect(() => {
            factory.validateData({
                stringValue: 'test',
                booleanValue: true,
            });
        }).not.toThrow();
    });

    it('throws for invalid data', () => {
        const factory = getTestFactory();

        expect(() => {
            factory.validateData({
                stringValue: 'test',
                booleanValue: 'not-a-boolean' as any,
            });
        }).toThrow();
    });

    it('throws for missing required fields', () => {
        const factory = getTestFactory();

        expect(() => {
            factory.validateData({
                stringValue: 'test',
            } as any);
        }).toThrow();
    });

    it('throws for unknown fields', () => {
        const factory = getTestFactory();

        expect(() => {
            factory.validateData({
                stringValue: 'test',
                booleanValue: true,
                unknownField: 'test',
            } as any);
        }).toThrow();
    });
});

describe('validatePartialData', () => {
    it('is ok for valid partial data', () => {
        const factory = getTestFactory();

        expect(() => {
            factory.validatePartialData({
                stringValue: 'test',
            });
        }).not.toThrow();
    });

    it('throws for invalid partial data', () => {
        const factory = getTestFactory();

        expect(() => {
            factory.validatePartialData({
                stringValue: 'test',
                booleanValue: 'not-a-boolean' as any,
            });
        }).toThrow();
    });

    it('throws for unknown fields', () => {
        const factory = getTestFactory();

        expect(() => {
            factory.validatePartialData({
                stringValue: 'test',
                booleanValue: true,
                unknownField: 'test',
            } as any);
        }).toThrow();
    });
});

describe('validateId', () => {
    it('is ok for valid id', () => {
        const factory = getTestFactory();

        expect(() => {
            factory.validateId('valid-id');
        }).not.toThrow();
    });

    it('throws for invalid id', () => {
        const factory = getTestFactory();

        expect(() => {
            factory.validateId('');
        }).toThrow();
    });
});

describe('validateItems', () => {
    it('is ok for valid items', () => {
        const factory = getTestFactory();

        expect(() => {
            factory.validateItems([
                {
                    id: '1',
                    stringValue: 'test1',
                    booleanValue: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    id: '2',
                    stringValue: 'test2',
                    booleanValue: false,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ]);
        }).not.toThrow();
    });

    it('throws for invalid items', () => {
        const factory = getTestFactory();

        expect(() => {
            factory.validateItems([
                {
                    id: '1',
                    stringValue: 'test1',
                    booleanValue: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    id: '2',
                    stringValue: 'test2',
                    booleanValue: 'not-a-boolean' as any,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ]);
        }).toThrow();
    });
});

describe('validateItem', () => {
    it('is ok for valid item', () => {
        const factory = getTestFactory();

        expect(() => {
            factory.validateItem({
                id: '1',
                stringValue: 'test1',
                booleanValue: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
        }).not.toThrow();
    });

    it('throws for invalid item', () => {
        const factory = getTestFactory();

        expect(() => {
            factory.validateItem({
                id: '1',
                stringValue: 'test1',
                booleanValue: 'not-a-boolean' as any,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
        }).toThrow();
    });
});

describe('validateNoForbiddenFields', () => {
    it('is ok when no forbidden fields are present', () => {
        const factory = getTestFactory();

        expect(() => {
            factory.validateNoForbiddenFields({
                stringValue: 'test',
                booleanValue: true,
            });
        }).not.toThrow();
    });

    it('throws when forbidden fields are present', () => {
        const factory = getTestFactory();
        const fields = ['id', 'ownerId', 'createdAt', 'updatedAt'];

        for (const field of fields) {
            expect(() => {
                factory.validateNoForbiddenFields({
                    stringValue: 'test',
                    booleanValue: true,
                    [field]: 'not-allowed',
                });
            }).toThrowError(`Field '${field}' is not allowed to be set manually in model 'Test'.`);
        }
    });
});

describe('getOwnershipWhereClause', () => {
    it('returns empty for unowned model', () => {
        const factory = getTestFactory({ isOwned: false });
        const where = factory.getOwnershipWhereClause();

        expect(where).toEqual({});
    });

    it('returns empty for bypassed ownership', () => {
        const factory = getTestFactory({ isOwned: true, bypassOwnership: true });
        const where = factory.getOwnershipWhereClause({
            id: 'item-1'
        });

        expect(where).toEqual({
            id: 'item-1'
        });
    });

    it('returns ownerId for owned model with user', () => {
        const user = getUser1();
        const factory = getTestFactory({ isOwned: true, user });
        const where = factory.getOwnershipWhereClause({
            myValue: 42
        });

        expect(where).toEqual({ myValue: 42, ownerId: user.id });
    });

    it('returns ownerId for owned model with user no extra query', () => {
        const user = getUser1();
        const factory = getTestFactory({ isOwned: true, user });
        const where = factory.getOwnershipWhereClause();

        expect(where).toEqual({ ownerId: user.id });
    });

    it('throws error for owned model without user', () => {
        const factory = getTestFactory({ isOwned: true });

        expect(() => {
            factory.getOwnershipWhereClause();
        }).toThrowError("No user provided for owned model 'Test'.");
    });
});

describe('getOwnedData', () => {
    it('returns original data for unowned model', () => {
        const factory = getTestFactory({ isOwned: false });
        const data: TestModel = {
            stringValue: 'test',
            booleanValue: true,
        };
        const ownedData = factory.getOwnedData(data);

        expect(ownedData).toEqual(data);
    });

    it('returns original data for bypassed ownership', () => {
        const factory = getTestFactory({ isOwned: true, bypassOwnership: true });
        const data: TestModel = {
            stringValue: 'test',
            booleanValue: true,
        };
        const ownedData = factory.getOwnedData(data);

        expect(ownedData).toEqual(data);
    });

    it('throws error for owned model without user', () => {
        const factory = getTestFactory({ isOwned: true });
        const data: TestModel = {
            stringValue: 'test',
            booleanValue: true,
        };

        expect(() => {
            factory.getOwnedData(data);
        }).toThrowError("No user provided for owned model 'Test'.");
    });

    it('adds ownerId to data for owned model with user', () => {
        const user = getUser1();
        const factory = getTestFactory({ isOwned: true, user });
        const data: TestModel = {
            stringValue: 'test',
            booleanValue: true,
        };
        const ownedData = factory.getOwnedData(data);

        expect(ownedData).toEqual({
            ...data,
            ownerId: user.id,
        });
    });
});

describe('getPlain', () => {
    it('returns plain object from Sequelize instance', () => {
        const factory = getTestFactory();
        const sequelize = getLocalDbSequelize();
        const model = getSequelizeModel(sequelize, 'Test', {
            ...schema,
            ownerId: sString().type()
        });

        const instance = model.build({
            ownerId: 'user-1',
            createdAt: new Date(),
            updatedAt: new Date(),
            stringValue: 'test',
            booleanValue: true,
        });

        const plain = factory.getPlain(instance);

        expect(getWithoutMeta([plain])).toEqual([{
            stringValue: 'test',
            booleanValue: true,
        }]);

        assertMeta([plain]);
    });
});

describe('getAll', () => {
    it('retrieves all items from the database', async () => {
        const { factory } = await getTestData();

        const items = await factory.getAll();
        const noMeta = getWithoutMeta(items);

        assertMeta(items, false);

        expect(noMeta).toHaveLength(2);
        expect(noMeta).toEqual([
            {
                stringValue: 'item1',
                booleanValue: true,
            },
            {
                stringValue: 'item2',
                booleanValue: false,
            },
        ]);
    });

    it('retrieves items with where clause', async () => {
        const { factory } = await getTestData();

        const items = await factory.getAll({ booleanValue: true });
        const noMeta = getWithoutMeta(items);

        assertMeta(items, false);

        expect(noMeta).toHaveLength(1);
        expect(noMeta).toEqual([
            {
                stringValue: 'item1',
                booleanValue: true,
            },
        ]);
    });

    it('throws error for forbidden fields in where clause', async () => {
        const { factory } = await getTestData();

        await expect(factory.getAll({ id: 'some-id' } as any)).rejects.toThrowError(
            "Field 'id' is not allowed to be set manually in model 'Test'."
        );

        await expect(factory.getAll({ ownerId: 'some-id' } as any)).rejects.toThrowError(
            "Field 'ownerId' is not allowed to be set manually in model 'Test'."
        );
    });

    it('adds ownerId to where clause for owned models', async () => {
        const user = getUser1();
        const { factory } = await getTestData({ isOwned: true, user });

        const items = await factory.getAll();
        const noMeta = getWithoutMeta(items);

        assertMeta(items);

        expect(noMeta).toHaveLength(1);
        expect(noMeta).toEqual([
            {
                stringValue: 'item1',
                booleanValue: true,
            },
        ]);
        expect(items[0].ownerId).toBe(user.id);
    });

    it('adds no owner id for bypassed ownership', async () => {
        const { factory } = await getTestData({ isOwned: true, bypassOwnership: true });

        const items = await factory.getAll();
        const noMeta = getWithoutMeta(items);

        assertMeta(items);

        expect(noMeta).toHaveLength(2);
        expect(noMeta).toEqual([
            {
                stringValue: 'item1',
                booleanValue: true,
            },
            {
                stringValue: 'item2',
                booleanValue: false,
            },
        ]);

        expect(items[0].ownerId).toBe('user-1');
        expect(items[1].ownerId).toBe('user-2');
    });

    it('can not override ownerId in where clause for owned models', async () => {
        const user = getUser1();
        const { factory } = await getTestData({ isOwned: true, user });

        await expect(factory.getAll({ ownerId: 'other-user' } as any)).rejects.toThrowError(
            "Field 'ownerId' is not allowed to be set manually in model 'Test'."
        );
    });
});

describe('tryGetById', () => {
    it('retrieves item by id', async () => {
        const { factory } = await getTestData();

        const allItems = await factory.getAll();
        const targetItem = allItems[0];

        const item = await factory.tryGetById(targetItem.id);

        expect(item).not.toBeNull();
        expect(item).toEqual(targetItem);
    });

    it('returns null for non-existing id', async () => {
        const { factory } = await getTestData();

        const item = await factory.tryGetById('non-existing-id');

        expect(item).toBeNull();
    });

    it('throws error for invalid id', async () => {
        const { factory } = await getTestData();

        await expect(factory.tryGetById('')).rejects.toThrowError();
    });

    it('throws error for forbidden fields in where clause', async () => {
        const { factory } = await getTestData();

        await expect(factory.tryGetById('some-id', { id: 'other-id' } as any)).rejects.toThrowError(
            "Field 'id' is not allowed to be set manually in model 'Test'."
        );

        await expect(factory.tryGetById('some-id', { ownerId: 'other-id' } as any)).rejects.toThrowError(
            "Field 'ownerId' is not allowed to be set manually in model 'Test'."
        );
    });

    it('validates data of retrieved item', async () => {
        const { factory, model } = await getTestData();

        // Insert invalid data directly via model to bypass factory validation
        const created = await model.create({
            ownerId: 'user-1',
            stringValue: 'invalid-item',
            booleanValue: 'not-a-boolean' as any,
        });

        await expect(factory.tryGetById(created.get().id)).rejects.toThrowError(
            /The provided value does not match the schema/
        );
    });

    it('applies where clause for owned models', async () => {
        const user = getUser1();
        const { factory } = await getTestData({ isOwned: true, user });

        const allItems = await factory.getAll();
        const targetItem = allItems[0];

        const item = await factory.tryGetById(targetItem.id);

        expect(item).not.toBeNull();
        expect(item).toEqual(targetItem);
        expect(item?.ownerId).toBe(user.id);
    });

    it('returns null for owned models with wrong owner', async () => {
        const user = getUser1();
        const { factory, model } = await getTestData({ isOwned: true, user });

        const bypassFactory = getTestFactory({ isOwned: true, bypassOwnership: true, model });
        const allItems = await bypassFactory.getAll();
        const targetItem = allItems.find(item => item.ownerId !== user.id)!;

        const item = await factory.tryGetById(targetItem.id);

        expect(item).toBeNull();
    });
});

describe('getById', () => {
    it('retrieves item by id', async () => {
        const { factory } = await getTestData();

        const allItems = await factory.getAll();
        const targetItem = allItems[0];

        const item = await factory.getById(targetItem.id);

        expect(item).toEqual(targetItem);
    });

    it('throws error for non-existing id', async () => {
        const { factory } = await getTestData();

        await expect(factory.getById('non-existing-id')).rejects.toThrowError(
            "Item with id 'non-existing-id' not found in model 'Test'."
        );
    });
});

describe('create', () => {
    it('creates new item in the database', async () => {
        const { factory } = await getTestData();

        const data: TestModel = {
            stringValue: 'new-item',
            booleanValue: true,
        };

        const createdItem = await factory.create(data);

        expect(getWithoutMeta([createdItem])).toEqual([data]);
        expect(createdItem.ownerId).toBeUndefined();
        assertMeta([createdItem], false);

        const fetchedItem = await factory.getById(createdItem.id);
        expect(fetchedItem).toEqual(createdItem);
    });

    it('throws error for forbidden fields in data', async () => {
        const { factory } = await getTestData();

        const dataWithId: any = {
            id: 'some-id',
            stringValue: 'new-item',
            booleanValue: true,
        };

        await expect(factory.create(dataWithId)).rejects.toThrowError(
            "Field 'id' is not allowed to be set manually in model 'Test'."
        );

        const dataWithOwnerId: any = {
            ownerId: 'some-owner',
            stringValue: 'new-item',
            booleanValue: true,
        };

        await expect(factory.create(dataWithOwnerId)).rejects.toThrowError(
            "Field 'ownerId' is not allowed to be set manually in model 'Test'."
        );
    });

    it('throws error for invalid data', async () => {
        const { factory } = await getTestData();

        const invalidData: any = {
            stringValue: 'new-item',
            booleanValue: 'not-a-boolean',
        };

        await expect(factory.create(invalidData)).rejects.toThrowError(
            /The provided value does not match the schema/
        );
    });

    it('adds ownerId for owned models', async () => {
        const user = getUser1();
        const { factory } = await getTestData({ isOwned: true, user });

        const data: TestModel = {
            stringValue: 'new-item',
            booleanValue: true,
        };

        const createdItem = await factory.create(data);

        expect(getWithoutMeta([createdItem])).toEqual([data]);
        expect(createdItem.ownerId).toBe(user.id);
        assertMeta([createdItem]);

        const fetchedItem = await factory.getById(createdItem.id);
        expect(fetchedItem).toEqual(createdItem);
    });
});

describe('updateById', () => {
    it('updates existing item in the database', async () => {
        const { factory } = await getTestData();
        
        const createdItem = await factory.create({
            stringValue: 'from-start',
            booleanValue: false,
        });

        const updateData: Partial<TestModel> = {
            stringValue: 'updated-value',
            booleanValue: true,
        };

        const updatedItem = await factory.updateById(createdItem.id, updateData);

        expect(getWithoutMeta([updatedItem])).toEqual([{
            stringValue: 'updated-value',
            booleanValue: true,
        }]);
        expect(updatedItem.ownerId).toBeUndefined();
        assertMeta([updatedItem], false);

        const fetchedItem = await factory.getById(updatedItem.id);
        expect(fetchedItem).toEqual(updatedItem);
    });

    it('partial updates existing item in the database', async () => {
        const { factory } = await getTestData({
            schemaOverride: Schema.partial(schema),
        });
        
        const createdItem = await factory.create({
            stringValue: 'from-start',
            booleanValue: false,
        });

        const updateData: Partial<TestModel> = {
            booleanValue: true,
        };

        const updatedItem = await factory.updateById(createdItem.id, updateData);

        expect(getWithoutMeta([updatedItem])).toEqual([{
            stringValue: 'from-start',
            booleanValue: true,
        }]);
        expect(updatedItem.ownerId).toBeUndefined();
        assertMeta([updatedItem], false);

        const fetchedItem = await factory.getById(updatedItem.id);
        expect(fetchedItem).toEqual(updatedItem);
    });
    
    it('throws error for forbidden fields in data', async () => {
        const { factory } = await getTestData();
        
        const createdItem = await factory.create({
            stringValue: 'from-start',
            booleanValue: false,
        });

        const updateDataWithId: any = {
            id: 'some-id',
            stringValue: 'updated-value',
        };

        await expect(factory.updateById(createdItem.id, updateDataWithId)).rejects.toThrowError(
            "Field 'id' is not allowed to be set manually in model 'Test'."
        );

        const updateDataWithOwnerId: any = {
            ownerId: 'some-owner',
            stringValue: 'updated-value',
        };

        await expect(factory.updateById(createdItem.id, updateDataWithOwnerId)).rejects.toThrowError(
            "Field 'ownerId' is not allowed to be set manually in model 'Test'."
        );
    });

    it('throws error for invalid data', async () => {
        const { factory } = await getTestData();
        
        const createdItem = await factory.create({
            stringValue: 'from-start',
            booleanValue: false,
        });

        const invalidUpdateData: any = {
            booleanValue: 'not-a-boolean',
        };

        await expect(factory.updateById(createdItem.id, invalidUpdateData)).rejects.toThrowError(
            /The provided value does not match the schema/
        );
    });

    it('throws for id that does not exist', async () => {
        const { factory } = await getTestData();

        const updateData: Partial<TestModel> = {
            stringValue: 'updated-value',
            booleanValue: true,
        };

        await expect(factory.updateById('non-existing-id', updateData)).rejects.toThrowError(
            "Item with id 'non-existing-id' not found in model 'Test'."
        );
    });

    it('adds ownerId for owned models', async () => {
        const user = getUser1();
        const { factory } = await getTestData({ isOwned: true, user });
        
        const createdItem = await factory.create({
            stringValue: 'from-start',
            booleanValue: false,
        });

        const updateData: Partial<TestModel> = {
            stringValue: 'updated-value',
            booleanValue: true,
        };

        const updatedItem = await factory.updateById(createdItem.id, updateData);

        expect(getWithoutMeta([updatedItem])).toEqual([{
            stringValue: 'updated-value',
            booleanValue: true,
        }]);
        expect(updatedItem.ownerId).toBe(user.id);
        assertMeta([updatedItem]);

        const fetchedItem = await factory.getById(updatedItem.id);
        expect(fetchedItem).toEqual(updatedItem);
    });

    it('throws error when updating item owned by another user', async () => {
        const otherUser: User = {
            id: 'user-2',
            email: 'user2@example.com',
            name: 'User Two',
        };

        const { factory, model } = await getTestData({ isOwned: true, user: otherUser });
        const createdItem = await factory.create({
            stringValue: 'from-start',
            booleanValue: false,
        });

        const userFactory = getTestFactory({ isOwned: true, user: getUser1(), model });
        const updateData: Partial<TestModel> = {
            stringValue: 'updated-value',
            booleanValue: true,
        };

        await expect(userFactory.updateById(createdItem.id, updateData)).rejects.toThrowError(
            `Item with id '${createdItem.id}' not found in model 'Test'.`
        );
    });

    it('validates item retrieved from database after update', async () => {
        const { factory, model } = await getTestData();

        const createdItem = await factory.create({
            stringValue: 'from-start',
            booleanValue: false,
        });

        // Manually corrupt booleanValue
        await model.update({ booleanValue: 'not-a-boolean' as any }, {
            where: { id: createdItem.id }
        });

        const updateData: Partial<TestModel> = {
            stringValue: 'updated-value',
        };

        await expect(factory.updateById(createdItem.id, updateData)).rejects.toThrowError(
            /The provided value does not match the schema/
        );
    });

    it('validates id before update', async () => {
        const { factory } = await getTestData();

        const updateData: Partial<TestModel> = {
            stringValue: 'updated-value',
        };

        await expect(factory.updateById('', updateData)).rejects.toThrowError();
    });
});

describe('tryDeleteById', () => {
    it('deletes existing item in the database', async () => {
        const { factory } = await getTestData();
        
        const createdItem = await factory.create({
            stringValue: 'from-start',
            booleanValue: false,
        });

        await factory.tryDeleteById(createdItem.id);

        const fetchedItem = await factory.tryGetById(createdItem.id);
        expect(fetchedItem).toBeNull();
    });

    it('returns false for non-existing id', async () => {
        const { factory } = await getTestData();
        const result = await factory.tryDeleteById('non-existing-id');

        expect(result).toBe(null);
    });

    it('validates id before deletion', async () => {
        const { factory } = await getTestData();

        await expect(factory.tryDeleteById('')).rejects.toThrowError();
    });

    it('validates item retrieved from database before deletion', async () => {
        const { factory, model } = await getTestData();

        const createdItem = await factory.create({
            stringValue: 'from-start',
            booleanValue: false,
        });

        // Manually corrupt booleanValue
        await model.update({ booleanValue: 'not-a-boolean' as any }, {
            where: { id: createdItem.id }
        });

        await expect(factory.tryDeleteById(createdItem.id)).rejects.toThrowError(
            /The provided value does not match the schema/
        );
    });
});

describe('deleteById', () => {
    it('deletes existing item in the database', async () => {
        const { factory } = await getTestData();
        
        const createdItem = await factory.create({
            stringValue: 'from-start',
            booleanValue: false,
        });

        await factory.deleteById(createdItem.id);

        const fetchedItem = await factory.tryGetById(createdItem.id);
        expect(fetchedItem).toBeNull();
    });

    it('throws error for non-existing id', async () => {
        const { factory } = await getTestData();

        await expect(factory.deleteById('non-existing-id')).rejects.toThrowError(
            /Can't delete instance with id/
        );
    });
});

describe('count', () => {
    it('returns total count of items in the database', async () => {
        const { factory } = await getTestData();
        const count = await factory.count();

        expect(count).toBe(2);
    });

    it('returns count with where clause', async () => {
        const { factory } = await getTestData();
        const count = await factory.count({ booleanValue: true });

        expect(count).toBe(1);
    });

    it('throws error for forbidden fields in where clause', async () => {
        const { factory } = await getTestData();

        await expect(factory.count({ id: 'some-id' } as any)).rejects.toThrowError();
    });

    it('adds ownerId to where clause for owned models', async () => {
        const user = getUser1();
        const { factory } = await getTestData({ isOwned: true, user });

        const count = await factory.count();

        expect(count).toBe(1);
    });

    it('adds no owner id for bypassed ownership', async () => {
        const { factory } = await getTestData({ isOwned: true, bypassOwnership: true });
        const count = await factory.count();

        expect(count).toBe(2);
    });
});