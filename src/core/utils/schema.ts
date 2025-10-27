import { type IOptionalData } from '@js20/schema';
import { type IdInput, type Instance, sIdInput, sInstance } from '../types-shared.js';

export class Schema {
    static withInstance<T>(schema: T): T & Instance {
        return {
            ...schema,
            ...sInstance,
        };
    }

    static withId<T>(schema: T): T & IdInput {
        return {
            ...schema,
            ...sIdInput,
        };
    }

    static withIdPartial<T>(schema: T): Partial<T> & IdInput {
        return {
            ...getPartialSchema(schema),
            ...sIdInput,
        };
    }

    static partial<T>(schema: T): Partial<T> {
        return getPartialSchema(schema);
    }
}

export function getPartialSchema<T>(schema: T): Partial<T> {
    const partialData: Partial<T> = {};

    for (const key of Object.keys(schema as any)) {
        const value = (schema as any)[key];
        const next: IOptionalData = {
            ...value,
        };

        next.isOptional = true;
        (partialData as any)[key] = next;
    }

    return partialData;
}
