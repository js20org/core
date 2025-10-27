import { describe, it, expect } from 'vitest';
import {
    verifyName,
    verifyNoProtectedFieldNames,
    verifyNoInvalidIsOwned,
    verifyUniquenessByKey,
    verifyUniquenessByName,
    getComputedModels
} from '../../../src/core/utils/models';
import { sString, ValidatedSchema } from '@js20/schema';
import type { ModelItem } from '../../../src/core/types';

function getModelItem(name: string, key: string): ModelItem {
    return {
        schema: {
            value: sString().type(),
        },
        name,
        modelKey: key,
        isOwned: false,
    };
}

describe('getComputedModels', () => {
    it('returns validated schemas for all models', () => {
        const models: ModelItem[] = [
            getModelItem('User', 'user'),
            getModelItem('Post', 'post'),
        ];

        const computed = getComputedModels(models, true, ['id', 'owner']);

        expect(computed.length).toBe(2);
        expect(computed[0].validatedSchema).instanceOf(ValidatedSchema);
        expect(computed[1].validatedSchema).instanceOf(ValidatedSchema);
    });

    it('isOwned is false if no authenticator and not set on model', () => {
        const models: ModelItem[] = [
            {
                schema: {
                    value: sString().type(),
                },
                name: 'Test',
                modelKey: 'test',
            }
        ];

        const computed = getComputedModels(models, false, ['id', 'owner']);
        expect(computed[0].isOwned).toBe(false);
    });

    it('isOwned is true if authenticator present and not set on model', () => {
        const models: ModelItem[] = [
            {
                schema: {
                    value: sString().type(),
                },
                name: 'Test',
                modelKey: 'test',
            }
        ];

        const computed = getComputedModels(models, true, ['id', 'owner']);
        expect(computed[0].isOwned).toBe(true);
    });

    it('retains isOwned value if set on model', () => {
        const models: ModelItem[] = [
            {
                schema: {
                    value: sString().type(),
                },
                name: 'Test',
                modelKey: 'test',
                isOwned: false,
            },
            {
                schema: {
                    value: sString().type(),
                },
                name: 'Test2',
                modelKey: 'test2',
                isOwned: true,
            }
        ];

        const computed = getComputedModels(models, true, ['id', 'owner']);
        expect(computed[0].isOwned).toBe(false);
        expect(computed[1].isOwned).toBe(true);
    });

    it('passes along isInternal flag', () => {
        const models = [
            {
                schema: {
                    value: sString().type(),
                },
                name: 'Test',
                modelKey: 'test',
                isInternal: true,
            }
        ];

        const computed = getComputedModels(models, true, ['id', 'owner']);
        expect(computed[0].isInternal).toBe(true);
    });
});

describe('verifyName', () => {
    it('passes for valid names', () => {
        const model = getModelItem('User_1', 'user');
        expect(() => verifyName(model)).not.toThrow();
    });

    it('throws if name is missing or not a string', () => {
        const bad1 = { ...getModelItem('User', 'x'), name: undefined as unknown as string };
        const bad2 = { ...getModelItem('User', 'x'), name: 123 as unknown as string };
        expect(() => verifyName(bad1 as ModelItem)).toThrow(/valid name/);
        expect(() => verifyName(bad2 as ModelItem)).toThrow(/valid name/);
    });

    it('throws if name does not match regex', () => {
        const bad1 = getModelItem('1User', 'x');
        const bad2 = getModelItem('User-Name', 'x');
        expect(() => verifyName(bad1)).toThrow(/start with a letter/);
        expect(() => verifyName(bad2)).toThrow(/start with a letter/);
    });
});

describe('verifyNoProtectedFieldNames', () => {
    it('passes when schema has no protected fields', () => {
        const model = getModelItem('Ok', 'ok');
        expect(() => verifyNoProtectedFieldNames(model, ['id', 'owner'])).not.toThrow();
    });

    it('throws when schema includes a protected field (case-insensitive)', () => {
        const model = getModelItem('Bad', 'bad');
        model.schema = { ID: sString().type(), value: sString().type() };
        expect(() => verifyNoProtectedFieldNames(model, ['id', 'owner'])).toThrow(/protected field/);
    });
});

describe('verifyNoInvalidIsOwned', () => {
    it('passes when isOwned is false or authentication enabled', () => {
        const m1 = { ...getModelItem('A', 'a'), isOwned: false };
        const m2 = { ...getModelItem('B', 'b'), isOwned: true };
        expect(() => verifyNoInvalidIsOwned(m1, false)).not.toThrow();
        expect(() => verifyNoInvalidIsOwned(m2, true)).not.toThrow();
    });

    it('throws when isOwned is true without authentication', () => {
        const model = { ...getModelItem('A', 'a'), isOwned: true };
        expect(() => verifyNoInvalidIsOwned(model, false)).toThrow(/set up authentication/);
    });
});

describe('verifyUniquenessByKey', () => {
    it('passes when none of the new keys conflict (case-insensitive)', () => {
        const next = getModelItem('User', 'user');
        const others: ModelItem[] = [getModelItem('Comment', 'comment')];
        expect(() => verifyUniquenessByKey(next, others)).not.toThrow();
    });

    it('throws when a new key conflicts with an existing one (case-insensitive)', () => {
        const next = getModelItem('User', 'User');
        const others: ModelItem[] = [getModelItem('X', 'user')];
        expect(() => verifyUniquenessByKey(next, others)).toThrow(/Model with key "User" already registered/);
    });
});

describe('verifyUniquenessByName', () => {
    it('passes when all names are unique across next and others', () => {
        const next = getModelItem('User', 'user');
        const others: ModelItem[] = [getModelItem('Comment', 'comment')];
        expect(() => verifyUniquenessByName(next, others)).not.toThrow();
    });

    it('throws when duplicate names exist within next (case-insensitive)', () => {
        const next = getModelItem('Post', 'post');
        const others: ModelItem[] = [
            getModelItem('Article', 'a1'),
            getModelItem('post', 'a2')
        ];

        expect(() => verifyUniquenessByName(next, others)).toThrow(/Model with name "Post" already registered/);
    });

    it('throws when a name in next conflicts with others (case-insensitive)', () => {
        const next = getModelItem('Post', 'post');
        const others: ModelItem[] = [getModelItem('post', 'p2')];
        expect(() => verifyUniquenessByName(next, others)).toThrow(/Model with name "Post" already registered/);
    });
});
