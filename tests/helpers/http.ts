import { expect } from 'vitest';

interface Props {
    headers?: Record<string, string>;
    body?: any;
    expectedResponse?: any;
}

async function runHttp(path: string, method: string, props?: Props) {
    const url = `http://localhost:3000${path}`;
    const response = await fetch(url, {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...props?.headers
        },
        body: JSON.stringify(props?.body)
    });

    if (response.status !== 200) {
        const errorText = await response.text();
        console.error('Error:', errorText);
    }

    expect(response.status).toBe(200);
    const content = await response.json();

    if (props?.expectedResponse) {
        expect(content).toEqual(props.expectedResponse);
    }

    return content;
}

export async function assertHttpOk(path: string, props?: Props) {
    return runHttp(path, 'GET', props);
}

export async function assertHttpOkPost(path: string, props?: Props) {
    return runHttp(path, 'POST', props);
}

export async function assertHttpOkPut(path: string, props?: Props) {
    return runHttp(path, 'PUT', props);
}

export async function assertHttpOkDelete(path: string, props?: Props) {
    return runHttp(path, 'DELETE', props);
}

export async function assertHttp401(path: string, props?: Props) {
    const url = `http://localhost:3000${path}`;
    const response = await fetch(url, {
        method: 'GET',
        headers: props?.headers
    });

    expect(response.status).toBe(401);

    try {
        const json = await response.json();
        return json;
    } catch {
        return null;
    }
}

export async function assertHttp401Post(path: string, props?: Props) {
    const url = `http://localhost:3000${path}`;
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...props?.headers
        },
        body: JSON.stringify(props?.body)
    });

    expect(response.status).toBe(401);
}

export async function assertHttp404(path: string, props?: Props) {
    const url = `http://localhost:3000${path}`;
    const response = await fetch(url, {
        method: 'GET',
        headers: props?.headers
    });

    expect(response.status).toBe(404);
}

export async function assertHttp500(path: string, props?: Props) {
    const url = `http://localhost:3000${path}`;
    const response = await fetch(url, {
        method: 'GET',
        headers: props?.headers
    });

    expect(response.status).toBe(500);

    try {
        const json = await response.json();
        return json;
    } catch {
        return null;
    }
}

export async function assertHttp400(path: string, props?: Props) {
    const url = `http://localhost:3000${path}`;
    const response = await fetch(url, {
        method: 'GET',
        headers: props?.headers
    });

    expect(response.status).toBe(400);

    try {
        const json = await response.json();
        return json;
    } catch {
        return null;
    }
}

export async function assertHttp400Post(path: string, props?: Props) {
    const url = `http://localhost:3000${path}`;
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...props?.headers
        },
        body: JSON.stringify(props?.body)
    });

    expect(response.status).toBe(400);

    try {
        const json = await response.json();
        return json;
    } catch {
        return null;
    }
}

export async function assertHttp400Put(path: string, props?: Props) {
    const url = `http://localhost:3000${path}`;
    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            ...props?.headers
        },
        body: JSON.stringify(props?.body)
    });

    expect(response.status).toBe(400);

    try {
        const json = await response.json();
        return json;
    } catch {
        return null;
    }
}

export async function assertHttp500Put(path: string, props?: Props) {
    const url = `http://localhost:3000${path}`;
    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            ...props?.headers
        },
        body: JSON.stringify(props?.body)
    });

    expect(response.status).toBe(500);
}
