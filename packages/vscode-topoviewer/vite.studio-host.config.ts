import path from 'node:path';
import { fileURLToPath } from 'node:url';
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
      { find: /^topoviewer-studio$/, replacement: path.join(repoRoot, 'packages/topoviewer-studio/src/index.ts') }
    ]
  },
  server: { host: '127.0.0.1', port: 5176, strictPort: true }
});
