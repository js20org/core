import { describe, expect, it } from 'vitest';
import { getPascalCasing, getUriCasing } from '../../../src/core/utils/string';

describe('getUriCasing', () => {
    it('Works as it should', () => {
        expect(getUriCasing('Abc def 123')).toEqual('abc-def-123');
        expect(getUriCasing('Abc def / 123')).toEqual('abc-def-/-123');
    });
});

describe('getPascalCasing', () => {
    it('Works as it should', () => {
        expect(getPascalCasing('')).toEqual('');
        expect(getPascalCasing('Abc')).toEqual('Abc');
        expect(getPascalCasing('abc')).toEqual('Abc');
        expect(getPascalCasing('ABC')).toEqual('ABC');
        expect(getPascalCasing('ABC DEF')).toEqual('ABCDEF');
        expect(getPascalCasing('ABC DEF G')).toEqual('ABCDEFG');
        expect(getPascalCasing('O abc def g')).toEqual('OAbcDefG');
    });
});
