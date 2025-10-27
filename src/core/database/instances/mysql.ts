import { createPool, type Pool } from "mysql2/promise";
import { type Options as SequelizeOptions, Sequelize, Transaction } from 'sequelize';
import { fontDim } from '@js20/node-utils';
import { format } from 'sql-formatter';
import Db, { type Database as BetterSqlite3Database } from 'better-sqlite3';

import type { ComputedModel, ModelFactory, ModelFactoryProps, PluginProps } from '../../types.js';
import { BaseDatabase } from '../database.js';
import { getAttributesWithOwnerId, getAttributesWithUuidId, getSequelizeFieldsFromSchema } from '../../utils/sql-fields.js';
import { getPascalCasing } from '../../utils/string.js';
import { SequelizeFactory } from '../factories/sequelize-factory.js';
import type { Instance } from '../../types-shared.js';

export interface MysqlConnectOptions {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
    shouldUseSocket?: boolean;
}

interface InMemoryOptions {
    isInMemory: true;
}

type ConnectOptions = MysqlConnectOptions | InMemoryOptions;

export interface DatabaseOptions {
    initializeTables?: boolean;
    force?: boolean;
    muteDropTable?: boolean;
}

type SequelizeModel = ReturnType<Sequelize['define']>;

const protectedFieldNames: (keyof Instance)[] = [
    'id',
    'createdAt',
    'updatedAt',
    'ownerId'
];

interface SequelizeModelItem {
    sequelizeModel: SequelizeModel;
    modelKey: string;
    computed: ComputedModel;
}

export class MySqlDatabase extends BaseDatabase<Pool> {
    private options: DatabaseOptions;
    private sequelize: Sequelize;
    private connectionOptions: ConnectOptions;
    private modelItems: SequelizeModelItem[] = [];

    constructor(connectionOptions: ConnectOptions, options: DatabaseOptions = {}) {
        super(protectedFieldNames);

        this.connectionOptions = connectionOptions;
        this.options = options;
        this.sequelize = this.getSequelizeInstance(connectionOptions, options);
    }

    private getSequelizeInstance(connectionOptions: ConnectOptions, options: DatabaseOptions) {
        const isInMemory = 'isInMemory' in connectionOptions && connectionOptions.isInMemory;

        if (isInMemory) {
            return this.getInMemorySequelize();
        } else {
            return this.getSequelizeFromMysqlOptions(connectionOptions as MysqlConnectOptions, options);
        }
    }

    private getInMemorySequelize() {
        return new Sequelize({
            dialect: 'sqlite',
            storage: ':memory:',
            logging: false,
        });
    }

    private getSequelizeFromMysqlOptions(connectionOptions: MysqlConnectOptions, options: DatabaseOptions) {
        const sequelizeOptions: SequelizeOptions = {
            host: connectionOptions.host,
            port: connectionOptions.port,
            dialect: 'mysql' as any,
            logging: (log) => logSqlQuery(options, log),
        };

        if (connectionOptions.shouldUseSocket) {
            sequelizeOptions.dialectOptions = {
                socketPath: connectionOptions.host,
            };
        }

        return new Sequelize(
            connectionOptions.database,
            connectionOptions.user,
            connectionOptions.password,
            sequelizeOptions
        );
    }

    async connect(): Promise<void> {
        await this.sequelize.authenticate();

        console.log('✓ MySQL connected');
    }

    async disconnect(): Promise<void> {
        if (!this.sequelize) {
            return;
        }

        await this.sequelize.close();
    }

    private defineModel(computed: ComputedModel) {
        const { model, isOwned } = computed;
        const { modelKey, preserveName = false } = model;

        const attributes = getSequelizeFieldsFromSchema(computed.validatedSchema);
        const withStringId = getAttributesWithUuidId(attributes);
        const withOwner = getAttributesWithOwnerId(withStringId, isOwned);
        const tableName = preserveName ? model.name : getPascalCasing(model.name);

        const sequelizeModel = this.sequelize.define(tableName, withOwner, {
            charset: 'utf8mb4',
            collate: 'utf8mb4_bin',
            freezeTableName: preserveName,
        });

        this.modelItems.push({
            sequelizeModel,
            modelKey,
            computed,
        });
    }

    private async initializeTables(): Promise<void> {
        for (const model of Object.values(this.modelItems)) {
            await model.sequelizeModel.sync({
                alter: false,
                force: this.options.force,
            });
        }
    }

    async initialize(props: PluginProps): Promise<void> {
        super.initialize(props);
    }

    async sync(computedModels: ComputedModel[]): Promise<void> {
        const thisDbModels = this.getThisDbModels(computedModels);

        for (const computed of thisDbModels) {
            this.defineModel(computed);
        }

        const { initializeTables = true } = this.options;

        if (initializeTables) {
            await this.initializeTables();
        }
    }

    private getPoolFromMySql(options: MysqlConnectOptions): Pool {
        return createPool({
            host: options.host,
            user: options.user,
            password: options.password,
            database: options.database,
            port: options.port,
        });
    }

    private getPoolFromInMemory(): BetterSqlite3Database {
        return getInMemoryTestDbForAuth();
    }

    getNewPool(): Pool | BetterSqlite3Database {
        const isInMemory = 'isInMemory' in this.connectionOptions && this.connectionOptions.isInMemory;

        if (isInMemory) {
            return this.getPoolFromInMemory();
        } else {
            return this.getPoolFromMySql(this.connectionOptions as MysqlConnectOptions);
        }
    }

    getModelFactories({ user, bypassOwnership, transaction }: ModelFactoryProps): Record<string, ModelFactory<any>> {
        const result: Record<string, ModelFactory<any>> = {};

        for (const { modelKey, sequelizeModel, computed } of this.modelItems) {
            result[modelKey] = new SequelizeFactory({
                modelName: computed.model.name,
                model: sequelizeModel,
                dataSchema: computed.validatedSchema,
                isOwned: computed.isOwned,
                user,
                bypassOwnership,
                transaction,
            });
        }

        return result;
    }

    async getTransaction(): Promise<Transaction> {
        return this.sequelize.transaction();
    }
}

function logSqlQuery(options: DatabaseOptions, log: string) {
    const sanitize = (s: string) => s.replace(/^Executing\s*\([^)]*\):\s*/i, '').trim();
    const query = sanitize(log);

    const isListTables = query.startsWith('SHOW TABLES');
    const isShowIndex = query.startsWith('SHOW INDEX FROM');
    const isShowColumns = query.startsWith('SHOW FULL COLUMNS FROM');
    const isPing = query.startsWith('SELECT 1+1 AS result');

    const isShowTableName = query.startsWith(
        'SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES'
    );

    const isConstraint = query.startsWith(
        'SELECT CONSTRAINT_NAME as constraint_name'
    );

    const isDropTable = query.startsWith('DROP TABLE');
    const shouldSkipDropTable = options.muteDropTable && isDropTable;

    const isSkipped =
        isListTables ||
        isShowIndex ||
        isShowTableName ||
        isShowColumns ||
        isConstraint ||
        isPing ||
        shouldSkipDropTable;

    if (isSkipped) {
        return;
    }

    const isCreateTable = query.startsWith('CREATE TABLE');
    const isAlterTable = query.startsWith('ALTER TABLE');
    const isTableModifier = isCreateTable || isAlterTable;

    if (isTableModifier) {
        console.log('');
        console.log('> SQL Query:');
        console.log(fontDim(format(query, { language: 'mysql' })));
        console.log('');
    } else {
        console.log(`SQL Query: ${fontDim(query)}`);
    }
}

//Temp solution
function getInMemoryTestDbForAuth(): BetterSqlite3Database {
    const database = new Db(':memory:');

    const statements = [
        'CREATE TABLE IF NOT EXISTS `account` (`userId` VARCHAR(255) NOT NULL, `accountId` VARCHAR(255) NOT NULL, `providerId` VARCHAR(255) NOT NULL, `accessToken` VARCHAR(255), `refreshToken` VARCHAR(255), `accessTokenExpiresAt` DATETIME, `refreshTokenExpiresAt` DATETIME, `scope` VARCHAR(255), `idToken` VARCHAR(255), `password` VARCHAR(255), `id` UUID NOT NULL PRIMARY KEY, `createdAt` DATETIME NOT NULL, `updatedAt` DATETIME NOT NULL);',
        'CREATE TABLE IF NOT EXISTS `session` (`userId` VARCHAR(255) NOT NULL, `token` VARCHAR(255), `expiresAt` DATETIME, `ipAddress` VARCHAR(255), `userAgent` VARCHAR(255), `id` UUID NOT NULL PRIMARY KEY, `createdAt` DATETIME NOT NULL, `updatedAt` DATETIME NOT NULL);',
        'CREATE TABLE IF NOT EXISTS `user` (`name` VARCHAR(255), `email` VARCHAR(255), `emailVerified` TINYINT(1), `image` VARCHAR(255), `id` UUID NOT NULL PRIMARY KEY, `createdAt` DATETIME NOT NULL, `updatedAt` DATETIME NOT NULL);'
    ];

    for (const stmt of statements) {
        database.prepare(stmt).run();
    }

    return database;
}