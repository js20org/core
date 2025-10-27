import { build } from 'esbuild';

build({
    entryPoints: ['./src/examples/*.ts', './src/examples/raw/*.ts'],
    external: ['pg-hstore', 'prettier'],
    outdir: './dist/examples',
    bundle: true,
    format: 'esm',
    platform: 'node',
    target: 'node20',
    sourcemap: 'linked',
    minify: false,
    packages: 'external',
    keepNames: true,
    metafile: true,
    tsconfig: "tsconfig.json",
    alias: {
        '@js20/core': './src/core'
    }
}).catch(() => process.exit(1));
