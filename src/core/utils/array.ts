export function areEqualArrays(a: any[], b: any[]): boolean {
    const hasSameLength = a.length === b.length;

    if (!hasSameLength) {
        return false;
    }

    for (let i = 0; i < a.length; i++) {
        const aItem = a[i];
        const bItem = b[i];
        const isEqual = aItem === bItem;

        if (!isEqual) {
            return false;
        }
    }

    return true;
}
