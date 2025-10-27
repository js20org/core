import { Sequelize } from 'sequelize';
import { getAttributesWithUuidId, getSequelizeFieldsFromSchema } from '../../src/core/utils/sql-fields';
import { getValidatedSchema } from '@js20/schema';

export function getLocalDbSequelize() {
    return new Sequelize({
        dialect: 'sqlite',
        storage: ':memory:',
        logging: false,
    });
}

export function getSequelizeModel(sequelize: Sequelize, modelName: string, schema: any) {
    const validated = getValidatedSchema(schema);
    const attributes = getSequelizeFieldsFromSchema(validated);
    const attributesWithStringId = getAttributesWithUuidId(attributes);

    return sequelize.define(modelName, attributesWithStringId, {
        timestamps: true,
    });
}