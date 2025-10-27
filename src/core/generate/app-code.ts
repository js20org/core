import { SchemaType, type IEnumData, type INumberData, type IOptionalData, type IOptionalObjectData, type ISchemaData } from '@js20/schema';
import type { Action, AppCode, AppData, ComputedEndpoint } from '../types.js';
import { DefaultTypescriptCompiler } from '../typescript-compiler/compiler.js';
import { DefaultReferenceBuilder } from '../typescript-compiler/reference-builder.js';
import { getResolvedNestedReferences, getSortedReferences } from '../typescript-compiler/references.js';
import type { BuiltInterface, Compilation, ReferenceBuilder } from '../typescript-compiler/types.js';
import { areObjectsEqual } from '../utils/object.js';
import { isObject } from '../utils/validation.js';
import { getOptimizedTypescriptFromSchema, getTypescriptFromEnum } from './ts-from-schema.js';
import { getGeneratedEndpointName } from './endpoint-name.js';
import type { GenerateLogger } from './logger.js';
import { fontDim, fontGreen, fontYellow } from '@js20/node-utils';

interface Props {
    referenceBuilder: ReferenceBuilder;
    compilation: Compilation;
    app: AppData;
}

export function getAppCode(
    logger: GenerateLogger,
    compiler: DefaultTypescriptCompiler,
    app: AppData
): AppCode {
    const referenceBuilder = new DefaultReferenceBuilder(
        ['Instance', 'IdInput', 'Message'],
        [],
        []
    );

    const compilation = compiler.getCompilation();
    const props: Props = { referenceBuilder, compilation, app };

    addAppModels(props);
    addAppEnumReferences(props);

    const resolvedReferences = getResolvedNestedReferences(
        referenceBuilder,
        compilation
    );

    const sortedReferences = getSortedReferences(resolvedReferences);

    const { output: builtEnumsAndInterfaces, builtInterfaces } = compiler.build(
        sortedReferences.enums,
        sortedReferences.interfaces,
    );

    const builtEndpoints = getEndpointsCode(
        logger,
        app,
        compilation,
        builtInterfaces
    );

    return {
        builtEnumsAndInterfaces,
        builtEndpoints,
    };
}

const addAppModels = ({ compilation, referenceBuilder }: Props) => {
    const { modelMap, schemas } = compilation;

    if (!modelMap) {
        return;
    }

    for (const key of Object.keys(modelMap)) {
        const interfaceName = modelMap[key];
        const foundSchema = schemas.find(
            (s) => s.interfaceName === interfaceName
        );

        if (!interfaceName || !foundSchema) {
            continue;
        }

        referenceBuilder.registerInterface(interfaceName);
        referenceBuilder.registerSchema(foundSchema?.name);
    }
};

const addAppEnumReferences = (props: Props) => {
    const endpoints = props.app.endpoints.map((c) => c.endpoint);
    registerActionEnums(props, endpoints as Action<any, any, any, any>[]);
};

const registerActionEnums = (
    props: Props,
    actions: Action<any, any, any, any>[]
) => {
    const { referenceBuilder, compilation } = props;
    for (const action of actions) {
        if (action.inputSchema) {
            registerEnumsRecursive(
                referenceBuilder,
                compilation,
                action.inputSchema
            );
        }

        if (action.outputSchema) {
            registerEnumsRecursive(
                referenceBuilder,
                compilation,
                action.outputSchema
            );
        }
    }
};

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

function getEndpointsCode(
    logger: GenerateLogger,
    app: AppData,
    compilation: Compilation,
    interfaces: BuiltInterface[],
): string {
    const { endpoints } = app;
    const result: string[] = [];

    for (const endpoint of endpoints) {
        const endpointCode = getEndpoint(logger, endpoint, compilation, interfaces);
        result.push(endpointCode);
    }

    return result.join('\n\n');
}

const getEndpoint = (
    logger: GenerateLogger,
    computed: ComputedEndpoint,
    compilation: Compilation,
    interfaces: BuiltInterface[],
) => {
    const { isLoggedIn } = computed.endpoint;
    const { input, output, inputInterface, outputInterface } = getEndpointData(computed, compilation, interfaces);
    const { inputValidation, outputValidation } = getValidation(compilation, computed, inputInterface, outputInterface);

    const chosenName = getGeneratedEndpointName(computed);
    logEndpoint(logger, chosenName, computed, input, output);

    return `
export const ${chosenName} = async (${input}): ${output} => {
    ${inputValidation || ''}
    const output = await makeHttpRequest({
        method: '${computed.endpoint.method}',
        path: '${computed.endpoint.path}',
        shouldPassToken: ${isLoggedIn},
        ${input ? 'input: inputValidated,' : ''}
    });
    ${outputValidation || ''}

    return outputValidated;
};`;
};

function logEndpoint(logger: GenerateLogger, chosenName: string, computed: ComputedEndpoint, input: string, output: string) {
    const inputType = input ? input.split(':')[1].trim() : '';
    const inputLog = inputType ? `input: ${getWithoutParenthesis(inputType)}` : '';
    const outputLog = getWithoutParenthesis(getWithoutPromise(output));
    const functionLog = getMinCharacters(`${fontYellow(chosenName)}(${inputLog}) ${fontDim('->')} ${outputLog}`, 80);
    const endpointLog = `${fontGreen(getMinCharacters(computed.endpoint.method, 8))} ${computed.endpoint.path}`;

    logger.log(`${functionLog} ${endpointLog}`);
}

function getWithoutParenthesis(value: string): string {
    if (value.startsWith('(') && value.endsWith(')')) {
        return value.slice(1, -1);
    }

    return value;
}

function getWithoutPromise(value: string): string {
    if (value.startsWith('Promise<') && value.endsWith('>')) {
        return value.slice(8, -1);
    }

    return value;
}

function getMinCharacters(value: string, min: number, character = ' '): string {
    if (value.length >= min) {
        return value;
    }

    return value + character.repeat(min - value.length);
}

const getEndpointData = (
    endpoint: ComputedEndpoint,
    compilation: Compilation,
    interfaces: BuiltInterface[]
) => {
    const { inputInterface, outputInterface } = getInterfaces(
        endpoint,
        compilation,
        interfaces
    );

    const input = inputInterface ? `input: ${inputInterface}` : '';
    const output = outputInterface
        ? `Promise<${outputInterface}>`
        : 'Promise<void>';

    return {
        input,
        output,
        inputInterface,
        outputInterface,
    };
};

const getInterfaces = (
    computed: ComputedEndpoint,
    compilation: Compilation,
    interfaces: BuiltInterface[]
) => {
    const { outputSchema } = computed.endpoint;
    const inputSchema = getInputSchemaWithoutParams(computed);

    const inputInterface = inputSchema
        ? getOptimizedTypescriptFromSchema(
              compilation,
              interfaces,
              inputSchema
          )
        : null;

    const outputInterface = outputSchema
        ? getOptimizedTypescriptFromSchema(
              compilation,
              interfaces,
              outputSchema
          )
        : null;

    return {
        inputInterface,
        outputInterface,
    };
};

const getInputSchemaWithoutParams = (computed: ComputedEndpoint) => {
    const { inputSchema } = computed.endpoint;

    if (!inputSchema) {
        return null;
    }

    const hasKeys = Object.keys(inputSchema).length > 0;
    return hasKeys ? inputSchema : null;
};

// This is temporary code and should be replaced with frontend schema
// + validation from a frontend library
function getValidation(compilation: Compilation, computed: ComputedEndpoint, inputInterface: string | null, outputInterface: string | null) {
    const { inputSchema, outputSchema } = computed.endpoint;

    const hasInput = inputSchema && Object.keys(inputSchema).length > 0;
    const hasOutput = outputSchema && Object.keys(outputSchema).length > 0;

    return {
        inputValidation: hasInput ? getValidationBySchema(compilation, inputSchema, 'input', inputInterface) : null,
        outputValidation: hasOutput ? getValidationBySchema(compilation, outputSchema, 'output', outputInterface) : null,
    }
}

function getValidationBySchema(compilation: Compilation, schema: any, parameter: string, paramInterface: string | null): string {
    const safeInterface = paramInterface || 'any';

    if (Array.isArray(schema)) {
        return `const ${parameter}Validated: ${safeInterface} = ${parameter}.map((item: any) => ({
    ${getValidationBySchemaInternal(compilation, schema[0], 'item').join(',\n    ')}
}))`;
    } else {
        return `const ${parameter}Validated: ${safeInterface} = {
    ${getValidationBySchemaInternal(compilation, schema, parameter).join(',\n    ')}
}`;
    }
}

function getValidationBySchemaInternal(compilation: Compilation, schema: any, parameter: string): string[] {
    if (!isObject(schema)) {
        throw new Error('Schema must be an object');
    }

    const lines: string[] = [];

    for (const key of Object.keys(schema)) {
        const field = schema[key];

        const { type } = field as ISchemaData;
        const { isOptional = false } = field as IOptionalData;
        const { areDecimalsAllowed } = field as INumberData;

        switch (type) {
            case SchemaType.STRING:
                lines.push(`${key}: ${isOptional ? `sStringOptional(${parameter}['${key}'])` : `sString(${parameter}['${key}'])`}`);
                break;
            case SchemaType.BOOLEAN:
                lines.push(`${key}: ${isOptional ? `sBooleanOptional(${parameter}['${key}'])` : `sBoolean(${parameter}['${key}'])`}`);
                break;
            case SchemaType.DATE:
                lines.push(`${key}: ${isOptional ? `sDateOptional(${parameter}['${key}'])` : `sDate(${parameter}['${key}'])`}`);
                break;
            case SchemaType.NUMBER:
                if (areDecimalsAllowed) {
                    lines.push(`${key}: ${isOptional ? `sNumberOptional(${parameter}['${key}'])` : `sNumber(${parameter}['${key}'])`}`);
                } else {
                    lines.push(`${key}: ${isOptional ? `sIntegerOptional(${parameter}['${key}'])` : `sInteger(${parameter}['${key}'])`}`);
                }
                break;
            case SchemaType.ENUM:
                const enumType = getTypescriptFromEnum(field as IEnumData, compilation);
                lines.push(`${key}: ${isOptional ? `sEnumOptional<${enumType}>(${parameter}['${key}'], Object.values(${enumType}))` : `sEnum<${enumType}>(${parameter}['${key}'], Object.values(${enumType}))`}`);
                break;
            default:
                throw new Error(`Unknown schema type: "${type}"`);
        }
    }

    return lines;
}