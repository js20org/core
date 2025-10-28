import { IdInput, Instance } from '../../src/core';
import { ModelFactory } from '../../src/core/types';

const instance: Instance = {
    id: '1',
    createdAt: new Date(),
    updatedAt: new Date(),
    ownerId: 'owner1',
};

export class MockModelFactory<T> implements ModelFactory<T> {
    private defaultValue: T;
        
    constructor(defaultValue: T) {
        this.defaultValue = defaultValue;
    }

    async getAll() {
        return [];
    }
    async getById(id: string) {
        return { ...instance, ...this.defaultValue, id };
    }
    async tryGetById(id: string) {
        return { ...instance, ...this.defaultValue, id };
    }
    async create(data: T) {
        return { ...instance, ...data };
    }
    async updateById(id: string, data: Partial<T>) {
        return { ...instance, ...this.defaultValue, ...data, id };
    }
    async update({ id, ...rest}: IdInput & Partial<T>) {
        return this.updateById(id, rest as Partial<T>);
    }
    async deleteById(id: string) {
        return { ...instance, ...this.defaultValue, id };
    }
    async tryDeleteById(id: string) {
        return { ...instance, ...this.defaultValue, id };
    }
    async count() {
        return 0;
    }
}