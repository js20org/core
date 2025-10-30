import { sBoolean, sDate, sString } from '@js20/schema';
import { MySqlDatabase } from '../../database/instances/mysql.js';
import type { AuthConfig, Authenticator, User as GlobalUser, Headers, PluginProps, InternalModel, NoUndefined } from '../../types.js';
import { betterAuth } from "better-auth";
import { fromNodeHeaders, toNodeHandler } from "better-auth/node";
import { fontYellow } from '@js20/node-utils';

interface AuthModels {
    user: InternalModel<User>;
    session: InternalModel<Session>;
    account: InternalModel<Account>;
    verification: InternalModel<Verification>;
}

interface User {
    name?: string
    email?: string
    emailVerified?: boolean
    image?: string
}

interface Session {
    userId: string
    token?: string
    expiresAt?: Date
    ipAddress?: string
    userAgent?: string
}

interface Account {
    userId: string
    accountId: string
    providerId: string
    accessToken?: string
    refreshToken?: string
    accessTokenExpiresAt?: Date
    refreshTokenExpiresAt?: Date
    scope?: string
    idToken?: string
    password?: string
}

interface Verification {
    identifier?: string
    value?: string
    expiresAt: Date
}

const sUser: User = {
    name: sString().optional().type(),
    email: sString().optional().type(),
    emailVerified: sBoolean().optional().type(),
    image: sString().optional().type(),
}

const sSession: Session = {
    userId: sString().type(),
    token: sString().optional().type(),
    expiresAt: sDate().optional().type(),
    ipAddress: sString().optional().type(),
    userAgent: sString().optional().type(),
}

const sAccount: Account = {
    userId: sString().type(),
    accountId: sString().type(),
    providerId: sString().type(),
    accessToken: sString().optional().type(),
    refreshToken: sString().optional().type(),
    accessTokenExpiresAt: sDate().optional().type(),
    refreshTokenExpiresAt: sDate().optional().type(),
    scope: sString().optional().type(),
    idToken: sString().optional().type(),
    password: sString().optional().type(),
}

const sVerification: Verification = {
    identifier: sString().optional().type(),
    value: sString().optional().type(),
    expiresAt: sDate().type(),
}

const models: AuthModels = {
    user: {
        name: 'user',
        schema: sUser,
        preserveName: true,
        isInternal: true,
    },
    session: {
        name: 'session',
        schema: sSession,
        preserveName: true,
        isInternal: true,
    },
    account: {
        name: 'account',
        schema: sAccount,
        preserveName: true,
        isInternal: true,
    },
    verification: {
        name: 'verification',
        schema: sVerification,
        preserveName: true,
        isInternal: true,
    }
}

export class BetterAuth implements Authenticator {
    private database: MySqlDatabase;
    private config?: AuthConfig;
    private auth: any;

    constructor(database: MySqlDatabase, config?: AuthConfig) {
        this.database = database;
        this.config = config;
    }

    async initialize(props: PluginProps): Promise<void> {
        const { useEmailPassword = true } = this.config || {};

        verifyConfig(props, this.config);

        const pool = this.database.getNewPool();
        const safeConfig = getSafeConfig(this.config);

        const auth = betterAuth({
            baseURL: safeConfig.baseURL,
            secret: safeConfig.secret,
            trustedOrigins: props.config.server.allowedOrigins,
            cookie: {
                name: 'better-auth.session',
                secure: true,
                sameSite: 'lax',
                httpOnly: true,
                path: safeConfig.cookie.path,
                domain: safeConfig.cookie.domain,
            },
            expiresIn: safeConfig.expiresIn,
            database: pool,
            emailAndPassword: {
                enabled: useEmailPassword,
            },
        });

        this.database.addModels(models);
        this.auth = auth;
    }

    async getUserFromHeaders(headers: Headers): Promise<GlobalUser | null> {
        if (!this.auth) {
            throw new Error('BetterAuth not initialized');
        }

        const session = await this.auth.api.getSession({
            headers: fromNodeHeaders(headers),
        });

        const isValid = session?.user?.email && session?.user?.name;

        if (isValid) {
            return {
                id: session.user.id,
                email: session.user.email,
                name: session.user.name,
            };
        } else {
            return null;
        }
    }

    getRoutesHandler() {        
        if (!this.auth) {
            throw new Error('BetterAuth not initialized');
        }

        return {
            path: '/api/auth/*',
            getHandler: () => toNodeHandler(this.auth),
        };
    }
}

function getSafeConfig(config?: AuthConfig): NoUndefined<AuthConfig> {
    return {
        baseURL: config?.baseURL || 'http://localhost:3000',
        secret: config?.secret || 'test-secret',
        cookie: {
            domain: config?.cookie?.domain || 'yourapp.com',
            path: config?.cookie?.path || '/',
        },
        expiresIn: config?.expiresIn || 1000 * 60 * 60 * 24 * 7, // 7 days
        useEmailPassword: config?.useEmailPassword ?? true,
    };
}

function verifyConfig(props: PluginProps, config?: AuthConfig) {
    const isInvalid = config?.secret && config.secret.length < 12;

    if (isInvalid) {
        throw new Error('AuthConfig.secret must be at least 12 characters long');
    }

    if (!config?.baseURL) {
        if (props.config.isProduction) {
            throw new Error('AuthConfig.baseURL is required in production');
        }

        console.warn(fontYellow(`[JS20 > BetterAuth] Warning: No baseURL provided in AuthConfig. Using a default baseURL is insecure. For production environments it will throw an error.`));
    }
    
    if (!config?.secret) {
        if (props.config.isProduction) {
            throw new Error('AuthConfig.secret is required in production');
        }

        console.warn(fontYellow(`[JS20 > BetterAuth] Warning: No secret provided in AuthConfig. Using a default secret is insecure. For production environments it will throw an error.`));
    }

    if (!config?.cookie?.domain) {
        if (props.config.isProduction) {
            throw new Error('AuthConfig.cookie.domain is required in production');
        }

        console.warn(fontYellow(`[JS20 > BetterAuth] Warning: No cookie.domain provided in AuthConfig. Using a default domain is insecure. For production environments it will throw an error.`));
    }

    if (!config?.cookie?.path) {
        if (props.config.isProduction) {
            throw new Error('AuthConfig.cookie.path is required in production');
        }

        console.warn(fontYellow(`[JS20 > BetterAuth] Warning: No cookie.path provided in AuthConfig. Using a default path is insecure. For production environments it will throw an error.`));
    }
}
