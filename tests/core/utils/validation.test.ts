import { describe, expect, it } from 'vitest';
import { isArrayOrObject, isNumber, isObject } from '../../../src/core/utils/validation';

class Foobar {}

describe('isObject', () => {
    it('Works as it should', () => {
        expect(isObject(0)).toBe(false);
        expect(isObject(5)).toBe(false);
        expect(isObject(1e2)).toBe(false);
        expect(isObject(1.5)).toBe(false);
        expect(isObject('a')).toBe(false);
        expect(isObject('')).toBe(false);
        expect(isObject(false)).toBe(false);
        expect(isObject(() => {})).toBe(false);
        expect(isObject([])).toBe(false);
        expect(isObject([5])).toBe(false);
        expect(isObject({})).toBe(true);
        expect(isObject({ a: 5, d: { e: 3 } })).toBe(true);
        expect(isObject(new Foobar())).toBe(false);
        expect(isObject(null)).toBe(false);
        expect(isObject(undefined)).toBe(false);
        expect(isObject(NaN)).toBe(false);
    });
});

describe('isNumber', () => {
    it('Works as it should', () => {
        expect(isNumber(0)).toBe(true);
        expect(isNumber(5)).toBe(true);
        expect(isNumber(1e2)).toBe(true);
        expect(isNumber(1.5)).toBe(true);
        expect(isNumber('a')).toBe(false);
        expect(isNumber('')).toBe(false);
        expect(isNumber(false)).toBe(false);
        expect(isNumber(() => {})).toBe(false);
        expect(isNumber([])).toBe(false);
        expect(isNumber([5])).toBe(false);
        expect(isNumber({})).toBe(false);
        expect(isNumber({ a: 5, d: { e: 3 } })).toBe(false);
        expect(isNumber(new Foobar())).toBe(false);
        expect(isNumber(null)).toBe(false);
        expect(isNumber(undefined)).toBe(false);
        expect(isNumber(NaN)).toBe(true);
    });
});

describe('isArrayOrObject', () => {
    it('Works as it should', () => {
        expect(isArrayOrObject(0)).toBe(false);
        expect(isArrayOrObject([])).toBe(true);
        expect(isArrayOrObject({})).toBe(true);
    });
});
