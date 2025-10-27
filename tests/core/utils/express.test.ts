import { describe, it, expect } from 'vitest';
import type { Request } from 'express';
import { getExpressHeaders, getExpressRequestInput } from '../../../src/core/utils/express';

describe('getExpressRequestInput', () => {
    it('should merge query, body, and params', () => {
        const req = {
            query: { a: '1' },
            body: { b: '2' },
            params: { c: '3' }
        } as unknown as Request;

        const result = getExpressRequestInput(req);
        expect(result).toEqual({ a: '1', b: '2', c: '3' });
    });

    it('should handle empty body', () => {
        const req = {
            query: { a: '1' },
            body: {},
            params: { c: '3' }
        } as unknown as Request;

        const result = getExpressRequestInput(req);
        expect(result).toEqual({ a: '1', c: '3' });
    });

    it('should prioritize params over body and body over query', () => {
        const result = getExpressRequestInput({
            query: { key: 'fromQuery' },
            body: { key: 'fromBody' },
            params: { key: 'fromParams' }
        } as unknown as Request);

        expect(result.key).toBe('fromParams');

        const result2 = getExpressRequestInput({
            query: { key: 'fromQuery' },
            body: { key: 'fromBody' },
        } as unknown as Request);

        expect(result2.key).toBe('fromBody');
    });
});

describe('getExpressHeaders', () => {
    it('should return string headers as-is', () => {
        const req = {
            headers: { 'content-type': 'application/json', accept: 'text/html' }
        } as unknown as Request;

        const result = getExpressHeaders(req);
        expect(result).toEqual({
            'content-type': 'application/json',
            accept: 'text/html'
        });
    });

    it('should join array headers with commas', () => {
        const req = {
            headers: { 'set-cookie': ['a=1', 'b=2'] }
        } as unknown as Request;

        const result = getExpressHeaders(req);
        expect(result).toEqual({ 'set-cookie': 'a=1, b=2' });
    });
});
