const { build } = require('esbuild');

build({
    entryPoints: ['./src/docs/index.ts'],
    bundle: true,
    platform: 'node',
    outfile: './dist/docs/bundle.js',
    target: 'node16',
    minify: false,
    sourcemap: true,
    tsconfig: "tsconfig.docs.json"
}).catch(() => process.exit(1));
