export function getNonSpaceCharCount(value: string): number {
    return value.replace(/\s/g, '').length;
}
