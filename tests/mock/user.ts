import { expect } from 'vitest';
import { User } from '../../src/core/types';
import { assertHttpOk, assertHttpOkPost } from '../helpers/http';

let userCounter = 1;

interface ExtendedUser extends Omit<User, 'id'> {
    password: string;
}

export function getNewUser(): ExtendedUser {
    const user: ExtendedUser = {
        email: `user${userCounter}@example.com`,
        name: `User ${userCounter}`,
        password: 'password123'
    };
    userCounter++;
    return user;
}

export async function signupUser(user: ExtendedUser) {
    return await assertHttpOkPost('/api/auth/sign-up/email', {
        body: {
            email: user.email,
            name: user.name,
            password: user.password,
            confirmPassword: user.password
        }
    });
}

export async function loginUser(user: ExtendedUser) {
    const url = `http://localhost:3000/api/auth/sign-in/email`;
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            email: user.email,
            password: user.password
        })
    });

    expect(response.status).toBe(200);

    const authCookie = response.headers.get('set-cookie');
    expect(authCookie).toBeDefined();
    const content = await response.json();

    return {
        ...content,
        userId: content.user.id,
        authCookie
    };
}

export async function logoutUser(authCookie: string): Promise<void> {
    return await assertHttpOkPost('/api/auth/sign-out', {
        headers: {
            Cookie: authCookie
        }
    });
}

export async function getMe(authCookie: string) {
    return await assertHttpOk('/api/auth/get-session', {
        headers: {
            Cookie: authCookie
        }
    });
}
