import { build } from 'esbuild';

async function run() {
    await Promise.all([
        build({
            entryPoints: ['./src/core/index.ts'],
            outdir: './dist/esm',
            bundle: true,
            format: 'esm',
            platform: 'node',
            target: 'node20',
            sourcemap: 'linked',
            minify: false,
            splitting: true,
            packages: 'external',
            tsconfig: 'tsconfig.core.json',
            keepNames: true,
            metafile: true
        })
    ]).catch(() => process.exit(1));
}

run();
