import { Model, Sequelize, type WhereOptions, Transaction } from 'sequelize';
import { getValidatedSchema, sString, validateBySchema, ValidatedSchema } from '@js20/schema';
import type { ModelFactory, User } from '../../types.js';
import { type Instance, sIdInput, sInstance } from '../../types-shared.js';
import { Schema } from '../../utils/schema.js';

type SequelizeModel = ReturnType<Sequelize['define']>;

interface Props {
    modelName: string;
    model: SequelizeModel;
    dataSchema: ValidatedSchema<any>;
    isOwned: boolean;
    user: User | null;
    bypassOwnership: boolean;
    transaction: Transaction;
}

const idSchema = getValidatedSchema(sIdInput);

export class SequelizeFactory<T> implements ModelFactory<T> {
    private modelName: string;
    private model: SequelizeModel;
    private partialDataSchema: ValidatedSchema<Partial<T>>;
    private dataSchema: ValidatedSchema<T>;
    private instanceSchema: ValidatedSchema<T & Instance>;
    private isOwned: boolean;
    private bypassOwnership: boolean;
    private user: User | null;
    private transaction: Transaction;

    constructor({ modelName, model, dataSchema, isOwned, user, bypassOwnership, transaction }: Props) {
        this.modelName = modelName;
        this.model = model;
        this.dataSchema = dataSchema;
        this.partialDataSchema = getPartialDataSchema(dataSchema);
        this.instanceSchema = getInstanceSchema(dataSchema, isOwned);
        this.isOwned = isOwned;
        this.user = user;
        this.bypassOwnership = bypassOwnership;
        this.transaction = transaction;
    }

    validateData(data: T) {
        validateBySchema(this.dataSchema, data);
    }

    validatePartialData(data: Partial<T>) {
        validateBySchema(this.partialDataSchema, data);
    }

    validateId(id: string) {
        validateBySchema(idSchema, { id });
    }

    validateItems(items: (T & Instance)[]) {
        for (const item of items) {
            this.validateItem(item);
        }
    }

    validateItem(item: T & Instance) {
        validateBySchema(this.instanceSchema, item);
    }

    validateNoForbiddenFields(data?: any) {
        if (!data) {
            return;
        }

        const forbiddenFields = Object.keys(sInstance);
        const dataFields = Object.keys(data);

        for (const field of forbiddenFields) {
            if (dataFields.includes(field)) {
                throw new Error(`Field '${field}' is not allowed to be set manually in model '${this.modelName}'.`);
            }
        }
    }

    getOwnershipWhereClause(where: WhereOptions<any> = {}): WhereOptions<any> {
        if (!this.isOwned || this.bypassOwnership) {
            return where;
        }

        if (!this.user) {
            throw new Error(`No user provided for owned model '${this.modelName}'.`);
        }

        return {
            ...where,
            ownerId: this.user.id,
        };
    }

    getOwnedData(data: T) {
        if (!this.isOwned || this.bypassOwnership) {
            return data;
        }

        if (!this.user) {
            throw new Error(`No user provided for owned model '${this.modelName}'.`);
        }

        return {
            ...data,
            ownerId: this.user.id,
        };
    }

    getPlain(instance: Model<any, any>): T & Instance {
        return instance.get({ plain: true });
    }

    async getAll(where?: WhereOptions<T>): Promise<(T & Instance)[]> {
        this.validateNoForbiddenFields(where);

        const rows = await this.model.findAll({ where: this.getOwnershipWhereClause(where) });
        const converted = rows.map(this.getPlain);

        this.validateItems(converted);
        return converted;
    }

    async tryGetById(id: string, where: WhereOptions<T> = {}): Promise<(T & Instance) | null> {
        this.validateId(id);
        this.validateNoForbiddenFields(where);

        const row = await this.model.findOne({
            where: this.getOwnershipWhereClause({
                ...where,
                id,
            }),
        });

        if (!row) {
            return null;
        }

        const converted = this.getPlain(row);
        this.validateItem(converted);
        return converted;
    }

    async getById(id: string, where?: WhereOptions<T>): Promise<T & Instance> {
        const item = await this.tryGetById(id, where);

        if (!item) {
            throw new Error(`Item with id '${id}' not found in model '${this.modelName}'.`);
        }

        return item;
    }

    async create(data: T): Promise<T & Instance> {
        this.validateNoForbiddenFields(data);
        this.validateData(data);

        const ownedData = this.getOwnedData(data);
        const row = await this.model.create(ownedData as any, {
            transaction: this.transaction,
        });

        const converted = this.getPlain(row);

        this.validateItem(converted);
        return converted;
    }

    async updateById(id: string, data: Partial<T>): Promise<T & Instance> {
        const existing = await this.getById(id);

        this.validateNoForbiddenFields(data);
        this.validatePartialData(data);

        const updated = { ...existing, ...data };
        const updatedCount = await this.model.update(updated as any, {
            transaction: this.transaction,
            where: this.getOwnershipWhereClause({
                id: existing.id
            }),
        });

        const affectedRows = updatedCount[0];

        if (affectedRows === 0) {
            throw new Error(`Item with id '${existing.id}' not found in model '${this.modelName}'.`);
        }

        const newInstance = await this.getById(existing.id);
        this.validateItem(newInstance);
        return newInstance;
    }

    async tryDeleteById(id: string): Promise<(T & Instance) | null> {
        const existing = await this.tryGetById(id);

        if (!existing) {
            return null;
        }

        const deletedRows = await this.model.destroy({
            transaction: this.transaction,
            where: this.getOwnershipWhereClause({
                id: existing.id
            }),
        });

        if (deletedRows === 0) {
            return null;
        }

        return existing;
    }

    async deleteById(id: string): Promise<T & Instance> {
        const deleted = await this.tryDeleteById(id);

        if (!deleted) {
            throw new Error(`Can't delete instance with id '${id}', not found for '${this.modelName}'.`);
        }

        return deleted;
    }

    async count(where?: WhereOptions<T>): Promise<number> {
        this.validateNoForbiddenFields(where);
        return this.model.count({ where: this.getOwnershipWhereClause(where) });
    }
}

function getInstanceSchema<T>(
    validated: ValidatedSchema<T>,
    isOwned: boolean
): ValidatedSchema<T & Instance> {
    const ownedData = isOwned ? { ownerId: sString().type() } : {};
    const schema = validated.getSchema();
    const combined = { ...schema, ...sInstance, ...ownedData };

    return getValidatedSchema(combined);
}

function getPartialDataSchema<T>(schema: ValidatedSchema<T>): ValidatedSchema<Partial<T>> {
    const innerSchema = schema.getSchema();
    const partial = Schema.partial(innerSchema);
    return getValidatedSchema(partial);
}
