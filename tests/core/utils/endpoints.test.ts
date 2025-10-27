import { describe, expect, it } from 'vitest';
import { getComputedEndpoints, getNormalizedParam, isAllowedInEndpoint, isRecursivelySame, verifyEndpoint, verifyIsUniqueRoute, verifyNoTrailingSlash, verifyStartsWithSlash } from '../../../src/core/utils/endpoints';
import { Endpoint, EndpointMethod } from '../../../src/core/types';
import { sString, ValidatedSchema } from '@js20/schema';
import { MockAuthenticator } from '../../mock/mock-authenticator';

interface Input {
    test: string;
}

const sInput: Input = {
    test: sString().type(),
};

interface Output {
    result: string;
}

const sOutput: Output = {
    result: sString().type(),
};

function getEndpoint(path: string, isLoggedIn: boolean = false, method: EndpointMethod = 'GET'): Endpoint<any, any, any> {
    return {
        method,
        path,
        inputSchema: sInput,
        outputSchema: sOutput,
        isLoggedIn,
        run: async () => {},
    }
}

function getComputed(isLoggedIn: boolean) {
    const endpoint = getEndpoint('/test', isLoggedIn);
    return getComputedEndpoints([endpoint], true)[0];
}

describe('getComputedEndpoints', () => {
    it('validates schemas and returns computed endpoints', () => {
        const endpoints = [
            getEndpoint('/users'),
            getEndpoint('/projects/:projectId'),
        ];

        const computed = getComputedEndpoints(endpoints, true);

        expect(computed.length).toBe(2);
        expect(computed[0].validatedInputSchema).instanceOf(ValidatedSchema);
        expect(computed[0].validatedOutputSchema).instanceOf(ValidatedSchema);
        expect(computed[1].validatedInputSchema).instanceOf(ValidatedSchema);
        expect(computed[1].validatedOutputSchema).instanceOf(ValidatedSchema);
    });

    it('uses valid auth verification', () => {
        const endpoints = [
            getEndpoint('/public', false),
            getEndpoint('/private', true),
        ];

        expect(() => {
            getComputedEndpoints(endpoints, false);
        }).toThrow("You need to set up authentication to use 'isLoggedIn' on endpoint with path \"/private\".");
    });

    it('uses trailing slash verification', () => {
        const endpoints = [
            getEndpoint('/valid/path'),
            getEndpoint('/invalid/path/'),
        ];

        expect(() => {
            getComputedEndpoints(endpoints, true);
        }).toThrowError('Endpoint path must not end with a trailing slash: /invalid/path/');
    });

    it('uses starting slash verification', () => {
        const endpoints = [
            getEndpoint('/valid/path'),
            getEndpoint('invalid/path'),
        ];

        expect(() => {
            getComputedEndpoints(endpoints, true);
        }).toThrowError('Endpoint path must start with a slash: invalid/path');
    });

    it('uses unique route verification', () => {
        const endpoints = [
            getEndpoint('/users/:id'),
            getEndpoint('/users/:userId'),
        ];

        expect(() => {
            getComputedEndpoints(endpoints, true);
        }).toThrowError('Route already registered: GET /users/:id - GET /users/:userId');
    });
});

describe('verifyNoInvalidLoggedInEndpoints', () => {
    it('throws when endpoint requires logged in but no authentication is set up', () => {
        const endpoints = [
            getEndpoint('/private', true),
        ];

        expect(() => {
            getComputedEndpoints(endpoints, false);
        }).toThrowError("You need to set up authentication to use 'isLoggedIn' on endpoint with path \"/private\".");
    });

    it('does not throw when authentication is set up', () => {
        const endpoints = [
            getEndpoint('/private', true),
        ];

        expect(() => {
            getComputedEndpoints(endpoints, true);
        }).not.toThrow();
    });

    it('does not throw for public endpoints when no authentication is set up', () => {
        const endpoints = [
            getEndpoint('/public', false),
        ];

        expect(() => {
            getComputedEndpoints(endpoints, false);
        }).not.toThrow();
    });
});

describe('verifyStartsWithSlash', () => {
    it('does not throw when path starts with a slash', () => {
        expect(() => verifyStartsWithSlash('/api')).not.toThrow();
    });

    it('throws when path does not start with a slash', () => {
        expect(() => verifyStartsWithSlash('api')).toThrow(
            'Endpoint path must start with a slash: api'
        );
    });
});

describe('verifyNoTrailingSlash', () => {
    it('does not throw for root path', () => {
        expect(() => verifyNoTrailingSlash('/')).not.toThrow();
    });

    it('does not throw when path has no trailing slash', () => {
        expect(() => verifyNoTrailingSlash('/api')).not.toThrow();
    });

    it('throws when path has a trailing slash', () => {
        expect(() => verifyNoTrailingSlash('/api/')).toThrow(
            'Endpoint path must not end with a trailing slash: /api/'
        );
    });
});

describe('verifyIsUniqueRoute', () => {
    it('throws on exact same key', () => {
        const endpoint = getEndpoint('/users');
        const others = [getEndpoint('/users')];

        expect(() => {
            verifyIsUniqueRoute(endpoint, others);
        }).toThrowError('Route already registered: GET /users - GET /users');
    });

    it('throws on case-insensitive path match', () => {
        const endpoint = getEndpoint('/Users');
        const others = [getEndpoint('/users')];

        expect(() => {
            verifyIsUniqueRoute(endpoint, others);
        }).toThrowError('Route already registered: GET /Users - GET /users');
    });

    it('throws on normalized param collision', () => {
        const endpoint = getEndpoint('/users/:userId');
        const others = [getEndpoint('/users/:id')];

        expect(() => {
            verifyIsUniqueRoute(endpoint, others);
        }).toThrowError('Route already registered: GET /users/:userId - GET /users/:id');
    });

    it('throws on recursive star collision (existing has star)', () => {
        const endpoint = getEndpoint('/api/users');
        const others = [getEndpoint('/api/*')];
        expect(() => {
            verifyIsUniqueRoute(endpoint, others);
        }).toThrowError('Route already registered (recursive match): GET /api/users - GET /api/*');
    });

    it('throws on recursive star collision (current has star)', () => {
        const endpoint = getEndpoint('/api/*');
        const others = [getEndpoint('/api/users')];
        expect(() => {
            verifyIsUniqueRoute(endpoint, others);
        }).toThrowError('Route already registered (recursive match): GET /api/* - GET /api/users');
    });

    it('does not throw when routes are different', () => {
        const endpoint = getEndpoint('/users/:id/posts');
        const others = [getEndpoint('/users/:id/comments')];
        expect(() => {
            verifyIsUniqueRoute(endpoint, others);
        }).not.toThrow();
    });

    it('does not throw when methods are different', () => {
        const endpoint = getEndpoint('/users');
        const others = [getEndpoint('/users', false, 'POST')];
        expect(() => {
            verifyIsUniqueRoute(endpoint, others);
        }).not.toThrow();
    });
});

describe('getNormalizedParam', () => {
    it('replaces any :paramName with :param', () => {
        const res = getNormalizedParam('/a/:id/b/:slug/c');
        expect(res).toBe('/a/:param/b/:param/c');
    });

    it('leaves non-params intact', () => {
        const res = getNormalizedParam('/a/b/c');
        expect(res).toBe('/a/b/c');
    });

    it('does not alter star segments', () => {
        const res = getNormalizedParam('/api/*');
        expect(res).toBe('/api/*');
    });
});

describe('isRecursivelySame', () => {
    it('returns true when b starts with a prefix before *', () => {
        const res = isRecursivelySame('/api/*', '/api/users/123');
        expect(res).toBe(true);
    });

    it('returns false when a has no *', () => {
        const res = isRecursivelySame('/api/users', '/api/users/123');
        expect(res).toBe(false);
    });

    it('returns false when prefix does not match', () => {
        const res = isRecursivelySame('/admin/*', '/api/users');
        expect(res).toBe(false);
    });

    it('handles root star', () => {
        const res = isRecursivelySame('/*', '/anything/here');
        expect(res).toBe(true);
    });
});

describe('isAllowedInEndpoint', () => {
    it('no authenticator means always allowed', async () => {
        const result = await isAllowedInEndpoint(undefined, {}, getComputed(false));

        expect(result).toEqual({
            user: null,
            isAllowed: true,
        });
    });

    it('logged in endpoint requires user', async () => {
        const auth = new MockAuthenticator();
        const computed = getComputed(true);

        const resultNoAuth = await isAllowedInEndpoint(auth, {}, computed);
        expect(resultNoAuth).toEqual({
            user: null,
            isAllowed: false,
        });

        const resultWithAuth = await isAllowedInEndpoint(auth, { Authorization: 'Bearer token' }, computed);
        expect(resultWithAuth).toEqual({
            user: {
                id: 'user1',
                name: 'Test',
                email: 'test@js20.dev',
            },
            isAllowed: true,
        });
    });

    it('non-logged in endpoint allows all', async () => {
        const auth = new MockAuthenticator();
        const computed = getComputed(false);
        const resultNoAuth = await isAllowedInEndpoint(auth, {}, computed);
        expect(resultNoAuth).toEqual({
            user: null,
            isAllowed: true,
        });

        const resultWithAuth = await isAllowedInEndpoint(auth, { Authorization: 'Bearer token' }, computed);
        expect(resultWithAuth).toEqual({
            user: null,
            isAllowed: true,
        });
    });
});

describe('verifyEndpoint', () => {
    it('does not throw for valid endpoint', () => {
        const endpoint = getEndpoint('/valid/path');
        expect(() => verifyEndpoint(endpoint)).not.toThrow();
    });

    it('throws for schema error', () => {
        const endpoint = {...getEndpoint('/path'), path: '' as any };
        expect(() => verifyEndpoint(endpoint)).toThrow(
            /The provided value does not match the schema/
        );
    });

    it('throws for invalid method', () => {
        const endpoint = {...getEndpoint('/path'), method: 'INVALID' as any };
        expect(() => verifyEndpoint(endpoint)).toThrow(
            /Endpoint method must be one of:/
        );
    });

    it('throws for missing run function', () => {
        const endpoint = {...getEndpoint('/path'), run: undefined as any };
        expect(() => verifyEndpoint(endpoint)).toThrow(
            /Endpoint is missing run function for path: \/path/
        );
    });

    it('throws for missing output schema', () => {
        const endpoint = {...getEndpoint('/path'), outputSchema: undefined as any };
        expect(() => verifyEndpoint(endpoint)).toThrow(
            /Endpoint is missing outputSchema for path:/
        );
    });

    it('throws for invalid input schema', () => {
        const endpoint = {...getEndpoint('/path'), inputSchema: 123 as any };
        expect(() => verifyEndpoint(endpoint)).toThrow(
            /Endpoint has invalid inputSchema for path/
        );
    });
});