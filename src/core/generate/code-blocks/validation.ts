export const validationCode = `type HttpPrimitive = string | boolean | number | null | undefined;

function isNullOrUndefined(value: any): boolean {
    return value === null || value === undefined;
}

function sString(value: HttpPrimitive): string {
    if (typeof value !== 'string') {
        throw new Error('Invalid value type');
    }
    return value;
}

function sStringOptional(value: HttpPrimitive): string | undefined {
    if (isNullOrUndefined(value)) return undefined;
    return sString(value!);
}

function sBoolean(value: HttpPrimitive): boolean {
    if (typeof value !== 'boolean') {
        throw new Error('Invalid value type');
    }
    return value;
}

function sBooleanOptional(value: HttpPrimitive): boolean | undefined {
    if (isNullOrUndefined(value)) return undefined;
    return sBoolean(value!);
}

function sDate(value: HttpPrimitive): Date {
    if (typeof value !== 'string' && typeof value !== 'number') {
        throw new Error('Invalid date value');
    }
    const date = new Date(value);
    if (isNaN(date.getTime())) {
        throw new Error('Invalid date value');
    }
    return date;
}

function sDateOptional(value: HttpPrimitive): Date | undefined {
    if (isNullOrUndefined(value)) return undefined;
    return sDate(value!);
}

function sNumber(value: HttpPrimitive): number {
    if (typeof value !== 'number' || isNaN(value)) {
        throw new Error('Invalid number value');
    }
    return value;
}

function sNumberOptional(value: HttpPrimitive): number | undefined {
    if (isNullOrUndefined(value)) return undefined;
    return sNumber(value!);
}

function sInteger(value: HttpPrimitive): number {
    const num = sNumber(value);
    if (!Number.isInteger(num)) {
        throw new Error('Invalid integer value');
    }
    return num;
}

function sIntegerOptional(value: HttpPrimitive): number | undefined {
    if (isNullOrUndefined(value)) return undefined;
    return sInteger(value!);
}

function sEnum<T extends string | number>(value: HttpPrimitive, allowed: readonly T[]): T {
    if (!allowed.includes(value as T)) {
        throw new Error('Invalid enum value');
    }
    return value as T;
}

function sEnumOptional<T extends string | number>(value: HttpPrimitive, allowed: readonly T[]): T | undefined {
    if (isNullOrUndefined(value)) return undefined;
    return sEnum(value!, allowed);
}
`;
