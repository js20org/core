import { IEnumData, IOptionalData, IOptionalObjectData, ISchemaData, SchemaType } from '@js20/schema';
import { BuiltInterface, BuiltInterfaceProperty, Compilation } from './types';
import { areEqualArrays } from '../utils/array';
import { areObjectsEqual } from '../utils/object';
import { isObject } from '../utils/validation';

const isInterfaceIncluded = (
    schema: BuiltInterfaceProperty[],
    built: BuiltInterface
) => {
    const hasBuiltProperties = built.properties.length > 0;

    if (!hasBuiltProperties) {
        return false;
    }

    const subset = schema.filter((s) =>
        built.properties.some((p) => p.name === s.name)
    );

    const builtTypes = built.properties.map((p) => p.type);
    const schemaTypes = subset.map((s) => s.type);

    return areEqualArrays(builtTypes, schemaTypes);
};

const getLargestInluded = (included: BuiltInterface[]) => {
    let largest: BuiltInterface | null = null;
    let largestLength = null;

    for (const built of included) {
        const isLarger =
            largestLength === null || built.properties.length > largestLength;

        if (isLarger) {
            largest = built;
            largestLength = built.properties.length;
        }
    }

    return largest;
};

const getIncludedSchema = (
    schema: BuiltInterfaceProperty[],
    interfaces: BuiltInterface[]
) => {
    const included = interfaces.filter((s) => isInterfaceIncluded(schema, s));
    return getLargestInluded(included);
};

const getResolvedActionSchema = (
    properties: BuiltInterfaceProperty[],
    interfaces: BuiltInterface[]
) => {
    const interfaceNames: string[] = [];
    let rest = [...properties];

    while (true) {
        const item = getIncludedSchema(rest, interfaces);

        if (!item) {
            break;
        }

        const { name, properties } = item;

        interfaceNames.push(name);
        rest = rest.filter((r) => !properties.some((p) => r.name === p.name));
    }

    return {
        interfaceNames,
        rest,
    };
};

const getTypescriptFromSchema = (schema: BuiltInterfaceProperty[]) => {
    let result = '{\n';

    for (const item of schema) {
        result += `    ${item.name}: ${item.type};\n`;
    }

    return result + '\n}';
};

const getOptimizedInterface = (
    properties: BuiltInterfaceProperty[],
    interfaces: BuiltInterface[]
) => {
    const { interfaceNames, rest } = getResolvedActionSchema(
        properties,
        interfaces
    );

    const hasRest = rest.length > 0;
    const builtRest = hasRest ? getTypescriptFromSchema(rest) : null;
    const result = [...interfaceNames, builtRest]
        .filter((i) => !!i)
        .join(' & ');

    return `(${result})`;
};

const getByField = (
    compilation: Compilation,
    interfaces: BuiltInterface[],
    dataField: ISchemaData
) => {
    const isString = dataField.type === SchemaType.STRING;
    const isBoolean = dataField.type === SchemaType.BOOLEAN;
    const isNumber = dataField.type === SchemaType.NUMBER;
    const isOptionalObject = dataField.type === SchemaType.OPTIONAL_OBJECT;
    const isDate = dataField.type === SchemaType.DATE;
    const isEnum = dataField.type === SchemaType.ENUM;
    const isAny = dataField.type === SchemaType.ANY;

    if (isAny) {
        return 'any';
    } else if (isString) {
        return 'string';
    } else if (isBoolean) {
        return 'boolean';
    } else if (isNumber) {
        return 'number';
    } else if (isDate) {
        return 'Date';
    } else if (isOptionalObject) {
        const { nextSchema } = dataField as IOptionalObjectData<any>;
        return getOptimizedTypescriptFromSchema(
            compilation,
            interfaces,
            nextSchema
        );
    } else if (isEnum) {
        const { enumType } = dataField as IEnumData;
        const { enums } = compilation;

        const foundEnum = enums.find((e: any) =>
            areObjectsEqual(e.content, enumType)
        );

        return foundEnum?.name || 'unknown';
    } else {
        throw new Error(`Unknown schema type: "${dataField.type}"`);
    }
};

const getByArray = (
    compilation: Compilation,
    interfaces: BuiltInterface[],
    schema: any[]
) => {
    const itemSchema = schema[0];
    const type = getOptimizedTypescriptFromSchema(
        compilation,
        interfaces,
        itemSchema
    );

    return `${type}[]`;
};

const getByObject = (
    compilation: Compilation,
    interfaces: BuiltInterface[],
    schema: any
) => {
    const properties: BuiltInterfaceProperty[] = [];

    for (const key of Object.keys(schema)) {
        const dataField = schema[key];

        const { isOptional = false } = dataField as unknown as IOptionalData;
        const isOptionalObject = dataField.type === SchemaType.OPTIONAL_OBJECT;

        const shouldHaveQuestionMark = isOptional || isOptionalObject;
        const chosenKey = shouldHaveQuestionMark ? `${key}?` : key;

        const type = getOptimizedTypescriptFromSchema(
            compilation,
            interfaces,
            dataField
        );

        properties.push({
            name: chosenKey,
            type,
        });
    }

    return getOptimizedInterface(properties, interfaces);
};

export const getOptimizedTypescriptFromSchema = (
    compilation: Compilation,
    interfaces: BuiltInterface[],
    schema: any
): string => {
    const isSchemaField = (schema as ISchemaData).isSchemaField;
    const isSchemaArray = Array.isArray(schema);
    const isSchemaObject = isObject(schema);

    if (isSchemaField) {
        return getByField(compilation, interfaces, schema);
    } else if (isSchemaArray) {
        return getByArray(compilation, interfaces, schema);
    } else if (isSchemaObject) {
        return getByObject(compilation, interfaces, schema);
    } else {
        throw new Error('Should not end up here.');
    }
};
