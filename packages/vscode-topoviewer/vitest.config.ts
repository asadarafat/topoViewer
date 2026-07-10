import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { defineConfig } from 'vitest/config';

const packageRoot = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(packageRoot, '../..');

export default defineConfig({
  resolve: {
    alias: [
      { find: /^topoviewer\/authoring$/, replacement: path.join(repoRoot, 'packages/topoviewer/src/authoring.ts') },
      { find: /^topoviewer\/integration$/, replacement: path.join(repoRoot, 'packages/topoviewer/src/integration.ts') },
      { find: /^topoviewer$/, replacement: path.join(repoRoot, 'packages/topoviewer/src/index.ts') }
    ]
  }
});
