import { describe, it, expect } from 'vitest'
import { areObjectsEqual } from '../../../src/core/utils/object'

describe('areObjectsEqual', () => {
    it('returns true for empty objects', () => {
        expect(areObjectsEqual({}, {})).toBe(true)
    })

    it('ignores key order', () => {
        const a = { a: 1, b: 2, c: 3 }
        const b = { c: 3, b: 2, a: 1 }
        expect(areObjectsEqual(a, b)).toBe(true)
    })

    it('returns false when lengths differ', () => {
        const a = { a: 1, b: 2 }
        const b = { a: 1 }
        expect(areObjectsEqual(a, b)).toBe(false)
    })

    it('returns false when a key is different but lengths match', () => {
        const a = { a: 1 }
        const b = { b: 1 }
        expect(areObjectsEqual(a, b)).toBe(false)
    })

    it('returns false when values differ', () => {
        const a = { a: 1, b: 2 }
        const b = { a: 1, b: 3 }
        expect(areObjectsEqual(a, b)).toBe(false)
    })

    it('treats undefined and empty string as different when allowSimilarity is false', () => {
        const a = { a: undefined }
        const b = { a: '' }
        expect(areObjectsEqual(a, b, false)).toBe(false)
    })

    it('treats undefined and empty string as equal when allowSimilarity is true', () => {
        const a = { a: undefined }
        const b = { a: '' }
        expect(areObjectsEqual(a, b, true)).toBe(true)
    })

    it('treats undefined and null as equal when allowSimilarity is true', () => {
        const a = { a: undefined }
        const b = { a: null }
        expect(areObjectsEqual(a, b, true)).toBe(true)
    })

    it('treats empty string and null as equal when allowSimilarity is true', () => {
        const a = { a: '' }
        const b = { a: null }
        expect(areObjectsEqual(a, b, true)).toBe(true)
    })

    it('compares strictly for other values even when allowSimilarity is true', () => {
        const a = { a: 1, b: '2' }
        const b = { a: 1, b: 2 as any }
        expect(areObjectsEqual(a, b, true)).toBe(false)
    })

    it('is a shallow comparison (nested objects must be the same reference)', () => {
        const x = { z: 1 }
        const y = { z: 1 }
        const a = { n: x }
        const b = { n: y }
        expect(areObjectsEqual(a, b)).toBe(false)
        const c = { n: x }
        expect(areObjectsEqual(a, c)).toBe(true)
    })
})
