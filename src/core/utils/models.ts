import { getValidatedSchema } from '@js20/schema';
import type { ComputedModel, ModelItem } from '../types.js';

export function getComputedModels(
    allModels: ModelItem[],
    hasAuthentication: boolean,
    protectedFieldNames: string[],
): ComputedModel[] {
    return allModels.map(model => {
        const defaultIsOwned = hasAuthentication;
        const isOwned = model.isOwned ?? defaultIsOwned;
        const validatedSchema = getValidatedSchema(model.schema);
        const otherModels = allModels.filter(m => m !== model);

        verifyName(model);
        verifyNoInvalidIsOwned(model, hasAuthentication);
        verifyNoProtectedFieldNames(model, protectedFieldNames);
        verifyUniquenessByKey(model, otherModels);
        verifyUniquenessByName(model, otherModels);

        return {
            model,
            validatedSchema,
            isOwned,
        };
    })
}

export function verifyName(model: ModelItem) {
    const { name } = model;
    const isValidName = name && typeof name === 'string';

    if (!isValidName) {
        throw new Error(`Model must have a valid name: ${name}`);
    }

    const isValidNameByRegex = /^[A-Za-z][A-Za-z0-9_]*$/.test(name);

    if (!isValidNameByRegex) {
        throw new Error(`Model name must start with a letter and contain only letters, numbers, and underscores: ${name}`);
    }
}

export function verifyNoProtectedFieldNames(model: ModelItem, protectedFieldNames: string[]) {
    const protectedNamesLower = Array.from(protectedFieldNames).map(n => n.toLowerCase());

    for (const fieldName of Object.keys(model.schema)) {
        const isProtected = protectedNamesLower.includes(fieldName.toLowerCase());

        if (isProtected) {
            throw new Error(`Field '${fieldName}' is a protected field used by the system and can not be used by model with key "${model.modelKey}".`);
        }
    }
}

export function verifyNoInvalidIsOwned(model: ModelItem, hasAuthentication: boolean) {
    if (!hasAuthentication && model.isOwned) {
        throw new Error(`You need to set up authentication to use 'isOwned' on model with key "${model.modelKey}".`);
    }
}

export function verifyUniquenessByKey(next: ModelItem, otherModels: ModelItem[]) {
    const otherLowerKeys = otherModels.map(m => m.modelKey.toLowerCase());
    const nextKeyLower = next.modelKey.toLowerCase();

    if (otherLowerKeys.includes(nextKeyLower)) {
        throw new Error(`Model with key "${next.modelKey}" already registered`);
    }
}

export function verifyUniquenessByName(next: ModelItem, otherModels: ModelItem[]) {
    const otherLowerNames = otherModels.map(m => m.name.toLowerCase());
    const nextNameLower = next.name.toLowerCase();

    if (otherLowerNames.includes(nextNameLower)) {
        throw new Error(`Model with name "${next.name}" already registered`);
    }
}
