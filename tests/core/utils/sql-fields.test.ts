import { describe, it, expect, vi } from 'vitest';

vi.mock('sequelize', () => {
    return {
        BOOLEAN: () => 'BOOLEAN',
        DATE: () => 'DATE',
        INTEGER: () => 'INTEGER',
        DOUBLE: () => 'DOUBLE',
        STRING: (len?: number) => {
            if (typeof len === 'number') {
                return `STRING(${len})`;
            } else {
                return 'STRING';
            }
        },
        TEXT: () => 'TEXT',
    };
});

import { SchemaType, sInteger, sString, ValidatedSchema } from '@js20/schema';
import { getConvertedValue, getConvertedValueByObject, getConvertedValueBySchemaField, getSequelizeFieldsFromSchema, getStringType } from '../../../src/core/utils/sql-fields';

describe('getSequelizeFieldsFromSchema', () => {
    it('maps all fields using getConvertedValue', () => {
        const schema = new ValidatedSchema({
            a: sString().maxLength(10).type(),
            b: sInteger().optional().type(),
        });

        const out = getSequelizeFieldsFromSchema(schema);

        expect(out.a).toEqual({ type: 'STRING(10)', allowNull: false });
        expect(out.b).toEqual({ type: 'INTEGER', allowNull: true });
    });
});

describe('getStringType', () => {
    it('returns STRING when no maxLength', () => {
        expect(getStringType(undefined)).toBe('STRING');
    });

    it('returns parametrized STRING when short maxLength', () => {
        expect(getStringType(50)).toBe('STRING(50)');
    });

    it('returns TEXT when maxLength is very large', () => {
        expect(getStringType(20000)).toBe('TEXT');
    });

    it('returns STRING when maxLength is not a number', () => {
        expect(getStringType('x' as any)).toBe('STRING');
    });
});

describe('getConvertedValueBySchemaField', () => {
    it('maps integer number without decimals', () => {
        const v = getConvertedValueBySchemaField({
            type: SchemaType.NUMBER,
            areDecimalsAllowed: false,
            isOptional: true,
            maxLength: undefined,
            isSchemaField: true,
        } as any);
        expect(v).toEqual({ type: 'INTEGER', allowNull: true });
    });

    it('maps float number with decimals', () => {
        const v = getConvertedValueBySchemaField({
            type: SchemaType.NUMBER,
            areDecimalsAllowed: true,
            isOptional: false,
            maxLength: undefined,
            isSchemaField: true,
        } as any);
        expect(v).toEqual({ type: 'DOUBLE', allowNull: false });
    });

    it('maps string using getStringType', () => {
        const v = getConvertedValueBySchemaField({
            type: SchemaType.STRING,
            isOptional: false,
            areDecimalsAllowed: undefined,
            maxLength: 20,
            isSchemaField: true,
        } as any);
        expect(v).toEqual({ type: 'STRING(20)', allowNull: false });
    });

    it('maps string to TEXT when long', () => {
        const v = getConvertedValueBySchemaField({
            type: SchemaType.STRING,
            isOptional: false,
            areDecimalsAllowed: undefined,
            maxLength: 20000,
            isSchemaField: true,
        } as any);
        expect(v).toEqual({ type: 'TEXT', allowNull: false });
    });

    it('maps boolean', () => {
        const v = getConvertedValueBySchemaField({
            type: SchemaType.BOOLEAN,
            isOptional: true,
            areDecimalsAllowed: undefined,
            maxLength: undefined,
            isSchemaField: true,
        } as any);
        expect(v).toEqual({ type: 'BOOLEAN', allowNull: true });
    });

    it('maps date', () => {
        const v = getConvertedValueBySchemaField({
            type: SchemaType.DATE,
            isOptional: false,
            areDecimalsAllowed: undefined,
            maxLength: undefined,
            isSchemaField: true,
        } as any);
        expect(v).toEqual({ type: 'DATE', allowNull: false });
    });

    it('maps enum as string type', () => {
        const v = getConvertedValueBySchemaField({
            type: SchemaType.ENUM,
            isOptional: false,
            areDecimalsAllowed: undefined,
            maxLength: 10,
            isSchemaField: true,
        } as any);
        expect(v).toEqual({ type: 'STRING(10)', allowNull: false });
    });

    it('throws on unknown type', () => {
        expect(() =>
            getConvertedValueBySchemaField({
                type: 'UNKNOWN' as any,
                isOptional: false,
                areDecimalsAllowed: undefined,
                maxLength: undefined,
                isSchemaField: true,
            } as any)
        ).toThrow(/No database mapping exists yet for type/);
    });
});

describe('getConvertedValueByObject', () => {
    it('delegates to schema field mapper when isSchemaField', () => {
        const v = getConvertedValueByObject({
            type: SchemaType.NUMBER,
            isOptional: true,
            areDecimalsAllowed: false,
            isSchemaField: true,
        } as any);
        expect(v).toEqual({ type: 'INTEGER', allowNull: true });
    });

    it('returns raw JSON mapping when not isSchemaField', () => {
        const v = getConvertedValueByObject({
            type: SchemaType.STRING,
            isOptional: false,
            isSchemaField: false,
        } as any);
        expect(v).toEqual({ type: 'TEXT', allowNull: false });
    });
});

describe('getConvertedValue', () => {
    it('throws for invalid non-object input', () => {
        expect(() => getConvertedValue('x' as any)).toThrow(/Invalid database model schema type/);
    });

    it('returns TEXT with allowNull true for OPTIONAL_OBJECT', () => {
        const v = getConvertedValue({
            type: SchemaType.OPTIONAL_OBJECT,
            isOptional: true,
        } as any);
        expect(v).toEqual({ type: 'TEXT', allowNull: true });
    });

    it('returns TEXT with allowNull false for arrays', () => {
        const v = getConvertedValue([] as any);
        expect(v).toEqual({ type: 'TEXT', allowNull: false });
    });

    it('handles normal schema field object', () => {
        const v = getConvertedValue({
            type: SchemaType.STRING,
            isOptional: false,
            maxLength: 5,
            isSchemaField: true,
        } as any);
        expect(v).toEqual({ type: 'STRING(5)', allowNull: false });
    });

    it('handles normal non-schema field object', () => {
        const v = getConvertedValue({
            type: SchemaType.STRING,
            isOptional: false,
            isSchemaField: false,
        } as any);
        expect(v).toEqual({ type: 'TEXT', allowNull: false });
    });
});
