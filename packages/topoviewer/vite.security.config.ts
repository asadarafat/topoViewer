import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/security.ts',
      formats: ['es', 'umd'],
      name: 'TopoViewerSecurity',
      fileName: (format) => format === 'es' ? 'security.mjs' : 'security.umd.js'
    },
    emptyOutDir: false,
    sourcemap: true
  }
});
