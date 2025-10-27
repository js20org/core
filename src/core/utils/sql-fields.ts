import { BOOLEAN, DATE, INTEGER, DOUBLE, STRING, TEXT, DataTypes } from 'sequelize';
import { type INumberData, type IOptionalData, type ISchemaData, type IStringData, SchemaType, ValidatedSchema } from '@js20/schema';

import { isArrayOrObject, isNumber } from './validation.js';

export function getAttributesWithUuidId(attributes: any) {
    return {
        ...attributes,
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false
        },
    };
}

export function getAttributesWithOwnerId(
    attributes: any,
    hasOwner: boolean,
    isInternal: boolean
) {
    if (hasOwner && !isInternal) {
        return {
            ...attributes,
            ownerId: {
                type: DataTypes.UUID,
                allowNull: false,
            },
        };
    } else {
        return attributes;
    }
}

export function getSequelizeFieldsFromSchema(schema: ValidatedSchema<any>) {
    const result: any = {};
    const innerSchema = schema.getSchema();

    for (const key of Object.keys(innerSchema)) {
        const field = innerSchema[key];
        result[key] = getConvertedValue(field);
    }

    return result;
};

export function getStringType(maxLength: any) {
    const hasMaxLength = maxLength && isNumber(maxLength);
    const isText = hasMaxLength && maxLength > 10000;

    if (isText) {
        return TEXT();
    } else if (hasMaxLength) {
        return STRING(maxLength);
    } else {
        return STRING();
    }
};

export function getConvertedValueBySchemaField(
    data: ISchemaData & IStringData & IOptionalData & INumberData
) {
    const { type, isOptional, areDecimalsAllowed, maxLength } = data;

    const isInteger = type === SchemaType.NUMBER && !areDecimalsAllowed;
    const isFloat = type === SchemaType.NUMBER && areDecimalsAllowed;

    const allowNull = !!isOptional;

    if (isInteger) {
        return {
            type: INTEGER(),
            allowNull,
        };
    }

    if (isFloat) {
        return {
            type: DOUBLE(),
            allowNull,
        };
    }

    switch (type) {
        case SchemaType.ENUM:
        case SchemaType.STRING:
            return {
                type: getStringType(maxLength),
                allowNull,
            };
        case SchemaType.BOOLEAN:
            return {
                type: BOOLEAN(),
                allowNull,
            };
        case SchemaType.DATE:
            return {
                type: DATE(),
                allowNull,
            };
        default:
            throw new Error(`No database mapping exists yet for type: ${type}`);
    }
};

export function getConvertedValueByObject(
    data: ISchemaData & IStringData & IOptionalData & INumberData
) {
    const { isSchemaField } = data;

    if (isSchemaField) {
        return getConvertedValueBySchemaField(data);
    } else {
        //Raw JSON object
        return {
            type: TEXT(),
            allowNull: false,
        };
    }
};

export function getConvertedValue(data: ISchemaData & IStringData & IOptionalData & INumberData) {
    const isCorrectType = isArrayOrObject(data);

    if (!isCorrectType) {
        throw new Error(
            'Invalid database model schema type. Expected an object.'
        );
    }

    const isOptionalObject = data.type === SchemaType.OPTIONAL_OBJECT;
    const isDataArray = Array.isArray(data);
    const shouldUseRawJson = isOptionalObject || isDataArray;

    if (shouldUseRawJson) {
        //Raw JSON array
        return {
            type: TEXT(),
            allowNull: isOptionalObject,
        };
    } else {
        return getConvertedValueByObject(data);
    }
};
