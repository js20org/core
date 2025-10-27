import { describe, it, expect } from 'vitest';
import { getOrderedItemByReferences } from '../../../src/core/utils/reference-sort';

describe('getOrderedItemByReferences', () => {
    const assertRefsAfter = (ordered: string[], references: Record<string, string[]>) => {
        const index: Record<string, number> = {};
        for (let i = 0; i < ordered.length; i += 1) {
            index[ordered[i]] = i;
        }
        for (const key of Object.keys(references)) {
            for (const ref of references[key] || []) {
                const i = index[key];
                const j = index[ref];
                if (i === undefined || j === undefined) {
                    continue;
                }
                expect(i).toBeLessThan(j);
            }
        }
    };

    it('orders a simple chain so that references come after the item', () => {
        const items = ['a'];
        const references: Record<string, string[]> = {
            a: ['b'],
            b: ['c'],
        };
        const ordered = getOrderedItemByReferences(items, references);
        expect(ordered).toEqual(['a', 'b', 'c']);
        assertRefsAfter(ordered, references);
    });

    it('handles branching graphs and keeps all references after their parents', () => {
        const items = ['a'];
        const references: Record<string, string[]> = {
            a: ['b', 'c'],
            b: ['d'],
            c: ['d'],
        };
        const ordered = getOrderedItemByReferences(items, references);
        expect(new Set(ordered)).toEqual(new Set(['a', 'b', 'c', 'd']));
        assertRefsAfter(ordered, references);
    });

    it('includes referenced nodes that were not in the initial items', () => {
        const items = ['root'];
        const references: Record<string, string[]> = {
            root: ['child'],
        };
        const ordered = getOrderedItemByReferences(items, references);
        expect(ordered).toEqual(['root', 'child']);
        assertRefsAfter(ordered, references);
    });

    it('reverses input order when there are no references', () => {
        const items = ['x', 'y', 'z'];
        const references: Record<string, string[]> = {};
        const ordered = getOrderedItemByReferences(items, references);
        expect(ordered).toEqual(['z', 'y', 'x']);
    });

    it('deduplicates visits when items contain duplicates', () => {
        const items = ['a', 'a', 'b', 'a'];
        const references: Record<string, string[]> = {
            a: ['b'],
        };
        const ordered = getOrderedItemByReferences(items, references);
        expect(ordered).toEqual(['a', 'b']);
        assertRefsAfter(ordered, references);
    });

    it('throws if visit count exceeds 500', () => {
        const items = ['n0'];
        const references: Record<string, string[]> = {};
        for (let i = 0; i < 500; i += 1) {
            const current = `n${i}`;
            const next = `n${i + 1}`;
            if (!references[current]) {
                references[current] = [];
            }
            references[current].push(next);
        }
        expect(() => {
            getOrderedItemByReferences(items, references);
        }).toThrow('Exceeded 500 iterations. Possible circular dependencies in the references.');
    });
});
