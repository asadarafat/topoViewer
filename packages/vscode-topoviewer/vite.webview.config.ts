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
      { find: /^topoviewer-studio\/app$/, replacement: path.join(repoRoot, 'packages/topoviewer-studio/src/app.ts') },
      { find: /^topoviewer-studio\/host$/, replacement: path.join(repoRoot, 'packages/topoviewer-studio/src/contracts/host.ts') },
      { find: /^topoviewer-studio\/host-security$/, replacement: path.join(repoRoot, 'packages/topoviewer-studio/src/hostSecurity.ts') },
      { find: /^topoviewer-studio\/security$/, replacement: path.join(repoRoot, 'packages/topoviewer-studio/src/security.ts') },
      { find: /^topoviewer-studio$/, replacement: path.join(repoRoot, 'packages/topoviewer-studio/src/index.ts') }
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
