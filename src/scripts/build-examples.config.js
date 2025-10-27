const { build } = require('esbuild');

build({
    entryPoints: ['./src/examples/*.ts', './src/examples/raw/*.ts'],
    bundle: true,
    platform: 'node',
    outdir: './dist/examples',
    external: ['pg-hstore', 'prettier'],
    target: 'node16',
    minify: false,
    sourcemap: true,
    tsconfig: "tsconfig.json",
    alias: {
        '@js20/core': './src/core'
    }
}).catch(() => process.exit(1));
