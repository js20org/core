import { type ComputedEndpoint } from '../types.js';
import { getPascalCasing } from '../utils/string.js';

export const getGeneratedEndpointName = (computed: ComputedEndpoint) => {
    const name = getPathName(computed);
    const prefix = getPrefix(computed);
    const automaticName = `${prefix}${name}`;

    return computed.endpoint.generate?.functionName || automaticName;
};

const getPlural = (name: string) => {
    return `${name}s`;
};

const getPathName = (computed: ComputedEndpoint) => {
    const pathParts = computed.endpoint.path.split('/');
    const lastPart = pathParts[pathParts.length - 1];

    const hasMoreThanOne = pathParts.length > 1;
    const isLastPartParam = lastPart.includes(':');

    const chosenPath =
        hasMoreThanOne && isLastPartParam
            ? pathParts[pathParts.length - 2]
            : lastPart;

    const { outputSchema = {} } = computed.endpoint;

    const isArrayOutput = Array.isArray(outputSchema) && outputSchema.length === 1;
    const formattedPath = chosenPath.replace(/-/g, ' ');
    const pluralized = isArrayOutput ? getPlural(formattedPath) : formattedPath;

    const isRootPath = computed.endpoint.path === '/';
    const name = isRootPath ? 'Root' : getPascalCasing(pluralized);

    return name;
};


const getPrefix = (computed: ComputedEndpoint) => {
    switch (computed.endpoint.method) {
        case 'GET':
            return 'get';
        case 'POST':
            return 'create';
        case 'PUT':
            return 'update';
        case 'DELETE':
            return 'delete';
        default:
            throw new Error(`Unknown method "${computed.endpoint.method}"`);
    }
};
