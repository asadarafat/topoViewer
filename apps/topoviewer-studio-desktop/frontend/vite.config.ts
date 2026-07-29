import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const frontendRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: './',
  root: frontendRoot,
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5180,
    strictPort: true
  },
  build: {
    emptyOutDir: true,
    outDir: path.join(frontendRoot, 'dist')
  }
});
