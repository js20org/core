import { sBoolean, sDate, sString } from '@js20/schema';
import { MySqlDatabase } from '../../database/instances/mysql';
import { AuthConfig, Authenticator, Model, User as GlobalUser, Headers, PluginProps } from '../../types';
import { betterAuth } from "better-auth";
import { fromNodeHeaders, toNodeHandler } from "better-auth/node";

interface AuthModels {
    user: Model<User>;
    session: Model<Session>;
    account: Model<Account>;
    verification: Model<Verification>;
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
    },
    session: {
        name: 'session',
        schema: sSession,
        preserveName: true,
    },
    account: {
        name: 'account',
        schema: sAccount,
        preserveName: true,
    },
    verification: {
        name: 'verification',
        schema: sVerification,
        preserveName: true,
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

        const pool = await this.database.getNewPool();
        const auth = betterAuth({
            database: pool,
            emailAndPassword: {
                enabled: useEmailPassword,
            },
        });

        this.database.addModels(models);
        this.auth = auth;

        const handler = toNodeHandler(auth);

        props.addRegexEndpoint({
            plugin: 'better-auth',
            path: '/api/auth/*',
            getHandler: () => handler,
        });
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
}
