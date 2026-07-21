import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

const packageRoot = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(packageRoot, '../..');
const require = createRequire(import.meta.url);

function readGitSha() {
  try {
    return execFileSync('git', ['rev-parse', '--short=12', 'HEAD'], {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim();
  } catch {
    return 'unknown';
  }
}

function testMarkerPlugin(): Plugin {
  const marker = {
    package: 'topoviewer',
    gitSha: readGitSha()
  };

  return {
    name: 'topoviewer-test-marker',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const url = new URL(request.url || '/', 'http://127.0.0.1');
        if (request.method === 'GET' && url.pathname === '/__topoviewer-test-marker.json') {
          response.statusCode = 200;
          response.setHeader('cache-control', 'no-store');
          response.setHeader('content-type', 'application/json; charset=utf-8');
          response.end(JSON.stringify(marker));
          return;
        }
        next();
      });
    }
  };
}

function stylesheetAssetPlugin(): Plugin {
  return {
    name: 'topoviewer-stylesheet-asset',
    closeBundle() {
      const reactFlowCss = fs.readFileSync(require.resolve('@xyflow/react/dist/style.css'), 'utf8');
      const topoviewerCss = fs.readFileSync(path.join(packageRoot, 'src/styles.css'), 'utf8');
      fs.writeFileSync(path.join(packageRoot, 'dist/topoviewer.css'), `${reactFlowCss.trim()}\n${topoviewerCss}`);
    }
  };
}

const external = [
  'react',
  'react/jsx-runtime',
  'react/jsx-dev-runtime',
  'react-dom',
  'react-dom/client',
  '@xyflow/react'
];

export default defineConfig({
  plugins: [testMarkerPlugin(), react(), stylesheetAssetPlugin()],
  build: {
    emptyOutDir: false,
    lib: {
      entry: {
        authoring: 'src/authoring.ts',
        export: 'src/export.ts',
        integration: 'src/integration.ts',
        security: 'src/security.ts',
        topoviewer: 'src/index.ts'
      }
    },
    rollupOptions: {
      external,
      output: [
        {
          chunkFileNames: 'chunks/[name]-[hash].mjs',
          entryFileNames: '[name].mjs',
          format: 'es'
        },
        {
          chunkFileNames: 'chunks/[name]-[hash].cjs',
          entryFileNames: '[name].cjs',
          exports: 'named',
          format: 'cjs'
        }
      ]
    }
  }
});
