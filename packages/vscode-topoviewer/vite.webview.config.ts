import { fileURLToPath } from 'node:url';
import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const packageRoot = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(packageRoot, '../..');

export default defineConfig({
  root: packageRoot,
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^topoviewer\/integration$/, replacement: path.join(repoRoot, 'packages/topoviewer/src/integration.ts') },
      { find: /^topoviewer$/, replacement: path.join(repoRoot, 'packages/topoviewer/src/index.ts') }
    ]
  },
  build: {
    outDir: path.join(packageRoot, 'dist/webview'),
    emptyOutDir: true,
    rollupOptions: {
      input: path.join(packageRoot, 'src/webview/index.html'),
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name][extname]'
      }
    }
  }
});
