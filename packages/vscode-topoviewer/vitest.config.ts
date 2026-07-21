import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { defineConfig } from 'vitest/config';

const packageRoot = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(packageRoot, '../..');

export default defineConfig({
  resolve: {
    alias: [
      { find: /^topoviewer-studio\/host-security$/, replacement: path.join(repoRoot, 'packages/topoviewer-studio/src/hostSecurity.ts') },
      { find: /^topoviewer-studio\/security$/, replacement: path.join(repoRoot, 'packages/topoviewer-studio/src/security.ts') }
    ]
  }
});
