import { getValidatedSchema, sBoolean, sString, validateBySchema } from '@js20/schema';
import type { Authenticator, ComputedEndpoint, Endpoint, EndpointMethod, Headers } from '../types.js';

export function getComputedEndpoints(
    allEndpoints: Endpoint<any, any, any>[],
    hasAuthentication: boolean
): ComputedEndpoint[] {
    return allEndpoints.map((endpoint) => {
        const otherEndpoints = allEndpoints.filter(e => e !== endpoint);

        verifyNoInvalidLoggedInEndpoints(endpoint, hasAuthentication);
        verifyStartsWithSlash(endpoint.path);
        verifyNoTrailingSlash(endpoint.path);
        verifyIsUniqueRoute(endpoint, otherEndpoints);

        const { outputSchema, inputSchema } = endpoint;

        const validatedOutputSchema = getValidatedSchema(outputSchema);
        const validatedInputSchema = inputSchema ? getValidatedSchema(inputSchema) : undefined;

        return {
            endpoint,
            validatedInputSchema,
            validatedOutputSchema,
        };
    });
}

function verifyNoInvalidLoggedInEndpoints(endpoint: Endpoint<any, any, any>, hasAuthentication: boolean) {
    if (hasAuthentication) {
        return;
    }

    if ('isLoggedIn' in endpoint && endpoint.isLoggedIn) {
        throw new Error(`You need to set up authentication to use 'isLoggedIn' on endpoint with path "${endpoint.path}".`);
    }
}

export function verifyStartsWithSlash(path: string) {
    if (!path.startsWith('/')) {
        throw new Error(`Endpoint path must start with a slash: ${path}`);
    }
}

export function verifyNoTrailingSlash(path: string) {
    const isRoot = path === '/';

    if (isRoot) {
        return;
    }

    if (path.endsWith('/')) {
        throw new Error(`Endpoint path must not end with a trailing slash: ${path}`);
    }
}

function getEndpointKey({ method, path }: Endpoint<any, any, any>) {
    return `${method.toUpperCase()} ${path.toLowerCase()}`;
}

function getRawKey({ method, path }: Endpoint<any, any, any>) {
    return `${method.toUpperCase()} ${path}`;
}

export function verifyIsUniqueRoute(current: Endpoint<any, any, any>, otherEndpoints: Endpoint<any, any, any>[]) {
    for (const other of otherEndpoints) {
        const otherKey = getEndpointKey(other);
        const currentKey = getEndpointKey(current);

        const isSame = otherKey === currentKey;

        if (isSame) {
            throw new Error(`Route already registered: ${getRawKey(current)} - ${getRawKey(other)}`);
        }

        const normalizedOther = getEndpointKey({...other, path: getNormalizedParam(other.path)});
        const normalizedCurrent = getEndpointKey({...current, path: getNormalizedParam(current.path)});
        const isSameNormalized = normalizedOther === normalizedCurrent;

        if (isSameNormalized) {
            throw new Error(`Route already registered: ${getRawKey(current)} - ${getRawKey(other)}`);
        }

        const isRecursiveMatch = isRecursivelySame(normalizedOther, normalizedCurrent)
            || isRecursivelySame(normalizedCurrent, normalizedOther);

        if (isRecursiveMatch) {
            throw new Error(`Route already registered (recursive match): ${getRawKey(current)} - ${getRawKey(other)}`);
        }
    }
}

export function getNormalizedParam(route: string) {
    // Turn /something/:id/else into /something/:param/else
    return route.replace(/:[^/]+/g, ':param');
}

export function isRecursivelySame(a: string, b: string) {
    const hasStarA = a.includes('*');

    if (!hasStarA) {
        return false;
    }

    const [prefixA] = a.split('*');
    return b.startsWith(prefixA);
}

export async function isAllowedInEndpoint(authenticator: Authenticator | undefined, requestHeaders: Headers, computed: ComputedEndpoint) {
    if (!authenticator) {
        return {
            user: null,
            isAllowed: true,
        };
    }

    const user = await authenticator.getUserFromHeaders(requestHeaders);

    if (computed.endpoint.isLoggedIn) {
        return {
            user,
            isAllowed: !!user,
        };
    } else {
        return {
            user: null,
            isAllowed: true,
        };
    }
}

export function verifyEndpoint(endpoint: Endpoint<any, any, any>) {
    const sBaseEndpoint: Pick<Endpoint<any, any, any>, 'method' | 'path' | 'isLoggedIn'> = {
        method: sString().nonEmpty().type() as any,
        path: sString().nonEmpty().type(),
        isLoggedIn: sBoolean().type(),
    };

    const { method, path, isLoggedIn } = endpoint;
    const validated = getValidatedSchema(sBaseEndpoint);

    validateBySchema(validated, {
        method,
        path,
        isLoggedIn,
    });

    const allEndpointMethods: EndpointMethod[] = ['GET', 'POST', 'PUT', 'DELETE'];
    
    if (!allEndpointMethods.includes(endpoint.method)) {
        throw new Error(`Endpoint method must be one of: ${allEndpointMethods.join(', ')} - got "${endpoint.method}"`);
    }

    const hasRun = typeof endpoint.run === 'function';

    if (!hasRun) {
        throw new Error(`Endpoint is missing run function for path: ${endpoint.path}`);
    }

    const hasOutputSchema = typeof endpoint.outputSchema === 'object';

    if (!hasOutputSchema) {
        throw new Error(`Endpoint is missing outputSchema for path: ${endpoint.path}`);
    }

    const isValidInputSchema = 'inputSchema' in endpoint ? typeof endpoint.inputSchema === 'object' : true;

    if (!isValidInputSchema) {
        throw new Error(`Endpoint has invalid inputSchema for path: ${endpoint.path}`);
    }
}
