import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const frontendRoot = path.dirname(fileURLToPath(import.meta.url));
const goldenOutDir = path.resolve(
  frontendRoot,
  '../../../.artifacts/topoviewer-studio/desktop-golden-site'
);
const productionOutDir = path.join(frontendRoot, 'dist');

export function desktopFrontendOutDir(mode: string): string {
  return mode === 'golden' ? goldenOutDir : productionOutDir;
}

export default defineConfig(({ mode }) => {
  return {
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
      outDir: desktopFrontendOutDir(mode)
    }
  };
});
