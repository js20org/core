import Express from 'express';
import { Headers } from '../types';

export function getExpressRequestInput(req: Express.Request): any {
    const result: any = {};

    for (const key in req.query) {
        result[key] = req.query[key];
    }

    const hasBody = req.body && Object.keys(req.body).length > 0;

    if (hasBody) {
        for (const key in req.body) {
            result[key] = req.body[key];
        }
    }

    for (const key in req.params) {
        result[key] = req.params[key];
    }

    return result;
}

export function getExpressHeaders(req: Express.Request): Headers {
    const headers: Headers = {};

    for (const key in req.headers) {
        const value = req.headers[key];

        if (typeof value === 'string') {
            headers[key] = value;
        } else if (Array.isArray(value)) {
            headers[key] = value.join(', ');
        }
    }

    return headers;
}
