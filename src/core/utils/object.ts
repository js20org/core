export function areObjectsEqual(
    a: any,
    b: any,
    allowSimilarity: boolean = false
): boolean {
    const isSameLength = Object.keys(a).length === Object.keys(b).length;

    if (!isSameLength) {
        return false;
    }

    const sortedA = sortObject(a);
    const sortedB = sortObject(b);

    for (const key of Object.keys(sortedA)) {
        const hasBKey = Object.keys(sortedB).includes(key);

        if (!hasBKey) {
            return false;
        }

        const aValue = getSafeValue(sortedA[key], allowSimilarity);
        const bValue = getSafeValue(sortedB[key], allowSimilarity);
        const isEqual = aValue === bValue;

        if (!isEqual) {
            return false;
        }
    }

    return true;
}

function getSafeValue<T>(value: T, allowSimilarity: boolean): T | null {
    if (!allowSimilarity) {
        return value;
    }

    const isUndefined = value === undefined;

    if (isUndefined) {
        return null;
    }

    const isEmpty = value === '';

    if (isEmpty) {
        return null;
    }

    return value;
}

function sortObject<T extends Record<string, any>>(object: T): T {
    const keys = Object.keys(object);
    keys.sort((a, b) => a.localeCompare(b));

    const result = keys.reduce((previous: any, current) => {
        previous[current] = object[current];
        return previous;
    }, {});

    return result as T;
}
