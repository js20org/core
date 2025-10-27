import { build } from 'esbuild';

build({
    entryPoints: ['./src/docs/index.ts'],
    tsconfig: "tsconfig.docs.json",
    outfile: './dist/docs/bundle.js',
    bundle: true,
    format: 'esm',
    platform: 'node',
    target: 'node20',
    sourcemap: 'linked',
    minify: false,
    packages: 'external',
    keepNames: true,
    metafile: true
}).catch(() => process.exit(1));
