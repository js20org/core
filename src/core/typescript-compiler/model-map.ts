import type { TypescriptModelMap, TypescriptInterface, TypescriptType } from './types.js';

const getResolvedType = (
    interfaces: TypescriptInterface[],
    types: TypescriptType[],
    type: TypescriptType
): TypescriptModelMap => {
    const { children } = type;
    const properties: TypescriptModelMap = {};

    for (const child of children) {
        const foundInterface = interfaces.find((i) => i.name === child);
        const foundType = types.find((i) => i.name === child);

        if (foundInterface) {
            for (const property of foundInterface.modelReferences) {
                properties[property.name] = property.type;
            }
        } else if (foundType) {
            const resolvedType = getResolvedType(interfaces, types, foundType);

            for (const key of Object.keys(resolvedType)) {
                properties[key] = resolvedType[key];
            }
        }
    }

    return properties;
};

export const getModelMap = (
    interfaces: TypescriptInterface[],
    types: TypescriptType[],
    modelsName: string
): TypescriptModelMap | null => {
    const foundInterface = interfaces.find((i) => i.name === modelsName);
    const foundType = types.find((t) => t.name === modelsName);

    if (foundInterface) {
        const result: TypescriptModelMap = {};

        for (const item of foundInterface.modelReferences) {
            result[item.name] = item.type;
        }

        return result;
    } else if (foundType) {
        return getResolvedType(interfaces, types, foundType);
    } else {
        return null;
    }
};
