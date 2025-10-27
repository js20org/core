import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        teardownTimeout: 10000,
        testTimeout: 10000,
        environment: 'node',
        globals: true,
        include: ['tests/**/*.test.ts'],
        coverage: {
            include: ['src/core/**'],
            reporter: ['text'],
        },
        fileParallelism: false,
        pool: 'threads',
        poolOptions: {
            threads: { minThreads: 1, maxThreads: 1 }
        },
        sequence: {
            concurrent: false,
            shuffle: false
        },
        alias: {
            '@js20/core': path.resolve(__dirname, './src/core')
        }
    },
});
