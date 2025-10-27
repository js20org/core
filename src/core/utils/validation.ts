export function isObject(value: any): boolean {
    if (Array.isArray(value)) {
        return false;
    }

    return typeof value === 'object' && value?.constructor?.name === 'Object';
}

export function isArrayOrObject(value: any): boolean {
    return Array.isArray(value) || isObject(value);
}

export function isNumber(value: any): boolean {
    return typeof value === 'number';
}
