import esbuild from 'esbuild';

const production = process.argv.includes('production');

await esbuild.build({
  entryPoints: ['src/main.ts'],
  bundle: true,
  external: ['obsidian'],
  format: 'cjs',
  platform: 'node',
  target: 'es2020',
  sourcemap: production ? false : 'inline',
  minify: production,
  outfile: 'main.js',
  logLevel: 'info'
});
