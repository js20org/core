import { type MysqlConnectOptions } from '@js20/core';

export function getConnectOptions(): MysqlConnectOptions {
    return {
        host: process.env.SQL_HOST || '',
        port: parseInt(process.env.SQL_PORT || '5432'),
        user: process.env.SQL_USER || '',
        password: process.env.SQL_PASSWORD || '',
        database: process.env.SQL_DATABASE || '',
    };
}
