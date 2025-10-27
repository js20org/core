import { sBoolean, sNumber, sString } from '@js20/schema';
import { describe, expect, it } from 'vitest';
import { getPartialSchema } from '../../../src/core/utils/schema';

describe('getPartialSchema', () => {
   it('sets all fields to optional', () => {
        const schema = {
            value: sString().optional().type(),
            name: sBoolean().type(),
            age: sNumber().type(),
        };

        const expected = {
            "age": {
                "areDecimalsAllowed": true,
                "isOptional": false,
                "isSchemaField": true,
                "label": "Number",
                "type": "number",
            },
            "name": {
                "isOptional": false,
                "isSchemaField": true,
                "label": "Boolean",
                "type": "boolean",
            },
            "value": {
                "isContentInteger": false,
                "isEmptyAllowed": true,
                "isOptional": true,
                "isSchemaField": true,
                "label": "String",
                "type": "string",
            },
        };

        const partialSchema = getPartialSchema(schema);

        // Make sure original schema is unchanged
        expect(schema).toEqual(expected);

        // Check that partial schema has all fields set to optional
        expect(partialSchema).toEqual({
            age: {
                ...expected.age,
                isOptional: true,
            },
            name: {
                ...expected.name,
                isOptional: true,
            },
            value: {
                ...expected.value,
                isOptional: true,
            },
        });
   });
});
