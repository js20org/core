export const httpCode = `type FetchMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface FetchProps {
    method: FetchMethod;
    path: string;
    shouldPassToken?: boolean;
    input?: any;
}

function getUrl(path: string): string {
    return baseUrl + path;
}

function getPathWithParams(path: string, input?: Record<string, any>) {
    if (!input) {
        return {
            parsedPath: path,
            remainingParams: input,
        };
    }

    const parts = path.split('/');
    const inputCopy = { ...input };

    const resolved = parts.map(p => {
        if (!p.startsWith(':')) {
            return p;
        }

        const key = p.slice(1);
        const value = input[key];

        if (value === undefined || value === null) {
            throw new Error('Missing required param: ' + key);
        }

        const encodedValue = encodeURIComponent(String(value));
        delete inputCopy[key];
        return encodedValue;
    });

    return {
        parsedPath: resolved.join('/'),
        remainingParams: inputCopy
    };
}

async function makeHttpRequest({ method, path, input }: FetchProps) {
    try {
        const { parsedPath, remainingParams } = getPathWithParams(path, input);
        const url = getUrl(parsedPath);
        const options: RequestInit = {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
        };
        if (input) {
            options.body = JSON.stringify(remainingParams);
        }
        const response = await fetch(url, options);
        if (!response.ok) {
            throw new Error("HTTP error! status: " + response.status);
        }
        return await response.json();
    } catch (error) {
        throw error;
    }
}`;