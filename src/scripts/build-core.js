import { build } from 'esbuild';

build({
    entryPoints: ['./src/core/index.ts'],
    outdir: './dist/esm',
    tsconfig: 'tsconfig.core.json',
    bundle: true,
    format: 'esm',
    platform: 'node',
    target: 'node20',
    sourcemap: 'linked',
    minify: false,
    splitting: true,
    packages: 'external',
    keepNames: true,
    metafile: true
}).catch(() => process.exit(1));
