import { describe, it, expect } from 'vitest';
import { areEqualArrays } from '@js20/core/utils/array';

describe('areEqualArrays', () => {
    it('should return true for equal arrays', () => {
        expect(areEqualArrays([1, 2, 3], [1, 2, 3])).toBe(true);
    });

    it('should return false for arrays with different lengths', () => {
        expect(areEqualArrays([1, 2], [1, 2, 3])).toBe(false);
    });

    it('should return false for arrays with different elements', () => {
        expect(areEqualArrays([1, 2, 3], [1, 2, 4])).toBe(false);
    });

    it('should return true for two empty arrays', () => {
        expect(areEqualArrays([], [])).toBe(true);
    });

    it('should return false when order is different', () => {
        expect(areEqualArrays([1, 2, 3], [3, 2, 1])).toBe(false);
    });

    it('strings work as well', () => {
        expect(areEqualArrays(['a', 'b', 'c'], ['a', 'b', 'c'])).toBe(true);
        expect(areEqualArrays(['a', 'b', 'c'], ['a', 'b', 'd'])).toBe(false);
    });

    it('should handle mixed types', () => {
        expect(areEqualArrays([1, '2', true], [1, '2', true])).toBe(true);
        expect(areEqualArrays([1, '2', true], [1, '2', false])).toBe(false);
        expect(areEqualArrays([1], ['1'])).toBe(false);
    });
});
