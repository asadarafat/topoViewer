import esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['src/extension/extension.ts'],
  outfile: 'dist/extension.cjs',
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'cjs',
  external: ['vscode'],
  sourcemap: true,
  logLevel: 'info'
});
