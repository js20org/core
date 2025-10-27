import { Authenticator, Headers } from '../../src/core/types';

export class MockAuthenticator implements Authenticator {
    async initialize() {}

    async getUserFromHeaders(headers: Headers) {
        const hasAuthHeader = headers['Authorization']?.startsWith('Bearer ');

        if (hasAuthHeader) {
            return {
                id: 'user1',
                name: 'Test',
                email: 'test@js20.dev',
            };
        } else {
            return null;
        }
    }
}
