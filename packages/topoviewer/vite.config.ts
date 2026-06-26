import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

const packageRoot = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(packageRoot, '../..');

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

export default defineConfig({
  plugins: [testMarkerPlugin(), react()],
  build: {
    emptyOutDir: false,
    lib: {
      entry: 'src/index.ts',
      name: 'TopoViewer',
      fileName: 'topoviewer',
      formats: ['es', 'umd']
    },
    rollupOptions: {
      external: ['react', 'react/jsx-runtime', 'react/jsx-dev-runtime', 'react-dom', 'react-dom/client', '@xyflow/react'],
      output: {
        globals: {
          react: 'React',
          'react/jsx-runtime': 'React',
          'react/jsx-dev-runtime': 'React',
          'react-dom': 'ReactDOM',
          'react-dom/client': 'ReactDOMClient',
          '@xyflow/react': 'XYFlowReact'
        }
      }
    }
  }
});
