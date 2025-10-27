import { IEnumData, IOptionalObjectData, ISchemaData, SchemaType } from '@js20/schema';
import {
    TypescriptInterface,
    ReferenceBuilder,
    GenerateResolvedItem,
    ResolvedReferences,
    TypescriptReference,
    TypescriptSchema,
    Compilation,
} from './types';

import { areObjectsEqual } from '../utils/object';
import { getOrderedItemByReferences } from '../utils/reference-sort';
import { isObject } from '../utils/validation';

const registerEnumsRecursiveByObject = (
    referenceBuilder: ReferenceBuilder,
    compilation: Compilation,
    schema: any
) => {
    for (const value of Object.values(schema)) {
        registerEnumsRecursive(referenceBuilder, compilation, value);
    }
};

const registerEnumsRecursiveByArray = (
    referenceBuilder: ReferenceBuilder,
    compilation: Compilation,
    schema: any
) => {
    for (const item of schema) {
        registerEnumsRecursive(referenceBuilder, compilation, item);
    }
};

const registerEnumsRecursiveByField = (
    referenceBuilder: ReferenceBuilder,
    compilation: Compilation,
    schema: any
) => {
    const isOptionalObject = schema.type === SchemaType.OPTIONAL_OBJECT;
    const isEnum = schema.type === SchemaType.ENUM;

    if (isOptionalObject) {
        const optionalData = schema as IOptionalObjectData<any>;

        return registerEnumsRecursive(
            referenceBuilder,
            compilation,
            optionalData.nextSchema
        );
    } else if (isEnum) {
        const enumData = schema as IEnumData;
        const { enums } = compilation;

        const foundEnum = enums.find((e) =>
            areObjectsEqual(e.content, enumData.enumType)
        );

        if (foundEnum) {
            referenceBuilder.registerEnum(foundEnum.name);
        }
    }
};

const registerEnumsRecursive = (
    referenceBuilder: ReferenceBuilder,
    compilation: Compilation,
    schema: any
) => {
    const isSchemaField = (schema as ISchemaData)?.isSchemaField;
    const isSchemaObject = isObject(schema);
    const isSchemaArray = Array.isArray(schema);

    if (isSchemaField) {
        registerEnumsRecursiveByField(referenceBuilder, compilation, schema);
    } else if (isSchemaObject) {
        registerEnumsRecursiveByObject(referenceBuilder, compilation, schema);
    } else if (isSchemaArray) {
        registerEnumsRecursiveByArray(referenceBuilder, compilation, schema);
    }
};

const addIfNotExists = (result: GenerateResolvedItem[], item: GenerateResolvedItem) => {
    const hasItem = result.find((i) => i.name === item.name);

    if (!hasItem) {
        result.push(item);
    }
};

const addResolvedInterfaces = (
    result: GenerateResolvedItem[],
    allInterfaces: TypescriptInterface[],
    interfaces: TypescriptReference[]
) => {
    for (const interfaceReference of interfaces) {
        const foundInterface = allInterfaces.find(
            (i) => i.name === interfaceReference.type
        );

        if (!foundInterface) {
            continue;
        }

        addIfNotExists(result, {
            name: interfaceReference.type,
            references: foundInterface.interfaceReferences,
        });

        addResolvedInterfaces(
            result,
            allInterfaces,
            foundInterface.interfaceReferences
        );
    }
};

const getResolvedInterfaces = (
    interfaces: string[],
    allInterfaces: TypescriptInterface[]
) => {
    const result: GenerateResolvedItem[] = [];
    const references: TypescriptReference[] = interfaces.map((i) => ({
        name: '',
        type: i,
    }));

    addResolvedInterfaces(result, allInterfaces, references);

    return result;
};

const getSchemaReferences = (
    interfaceReference: TypescriptReference[],
    allSchemas: TypescriptSchema[]
): TypescriptReference[] => {
    const result: TypescriptReference[] = [];

    for (const reference of interfaceReference) {
        const schema = allSchemas.find(
            (s) => s.interfaceName === reference.type
        );

        if (!schema) {
            continue;
        }

        result.push({
            name: reference.name,
            type: schema.name,
        });
    }

    return result;
};

const addResolvedSchemas = (
    result: GenerateResolvedItem[],
    allSchemas: TypescriptSchema[],
    allInterfaces: TypescriptInterface[],
    schemas: TypescriptReference[]
) => {
    for (const schemaReference of schemas) {
        const foundSchema = allSchemas.find(
            (s) => s.name === schemaReference.type
        );

        if (!foundSchema) {
            continue;
        }

        const foundInterface = allInterfaces.find(
            (i) => i.name === foundSchema.interfaceName
        );

        if (!foundInterface) {
            continue;
        }

        const { interfaceReferences } = foundInterface;

        const schemaReferences = getSchemaReferences(
            interfaceReferences,
            allSchemas
        );

        addIfNotExists(result, {
            name: foundSchema.name,
            references: schemaReferences,
        });

        addResolvedSchemas(result, allSchemas, allInterfaces, schemaReferences);
    }
};

const getResolvedSchemas = (
    schemas: string[],
    allSchemas: TypescriptSchema[],
    allInterfaces: TypescriptInterface[]
) => {
    const result: GenerateResolvedItem[] = [];
    const references: TypescriptReference[] = schemas.map((i) => ({
        name: '',
        type: i,
    }));

    addResolvedSchemas(result, allSchemas, allInterfaces, references);

    return result;
};

export const getResolvedNestedReferences = (
    referenceBuilder: ReferenceBuilder,
    compilation: Compilation
): ResolvedReferences => {
    const { schemas, interfaces, enums } = referenceBuilder.getReferences();
    const { interfaces: allInterfaces, schemas: allSchemas } = compilation;

    const resolvedInterfaces = getResolvedInterfaces(interfaces, allInterfaces);

    const resolvedSchemas = getResolvedSchemas(
        schemas,
        allSchemas,
        allInterfaces
    );

    const resolvedEnums: GenerateResolvedItem[] = enums.map((e) => ({
        name: e,
        references: [],
    }));

    return {
        interfaces: resolvedInterfaces,
        schemas: resolvedSchemas,
        enums: resolvedEnums,
    };
};

const getSortedResolved = (resolved: GenerateResolvedItem[]) => {
    const references: Record<string, string[]> = {};

    for (const item of resolved) {
        references[item.name] = item.references.map((r) => r.type);
    }

    const items = resolved.map((r) => r.name);
    const ordered = getOrderedItemByReferences(items, references);
    ordered.reverse();

    return ordered
        .map((o) => resolved.find((s) => s.name === o))
        .filter((o) => !!o);
};

export const getSortedReferences = (
    references: ResolvedReferences
): ResolvedReferences => {
    return {
        ...references,
        interfaces: getSortedResolved(references.interfaces),
        schemas: getSortedResolved(references.schemas),
    };
};
