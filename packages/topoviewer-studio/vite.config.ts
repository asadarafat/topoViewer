import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

const packageRoot = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(packageRoot, '../..');
const studioBase = process.env.TOPOVIEWER_STUDIO_BASE || '/topoviewer/studio/';
const studioOutDir = process.env.TOPOVIEWER_STUDIO_OUT_DIR || path.join(repoRoot, 'site/studio');

function studioMarker(): Plugin {
  return {
    name: 'topoviewer-studio-marker',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        if (request.url !== '/__topoviewer-studio-test-marker.json') {
          next();
          return;
        }
        response.statusCode = 200;
        response.setHeader('content-type', 'application/json; charset=utf-8');
        response.setHeader('cache-control', 'no-store');
        response.end(JSON.stringify({ package: 'topoviewer-studio' }));
      });
    }
  };
}

export default defineConfig(({ command }) => ({
  base: command === 'build' ? studioBase : '/',
  root: packageRoot,
  plugins: [studioMarker(), react()],
  server: {
    host: '127.0.0.1',
    port: 5175,
    strictPort: true,
    warmup: {
      clientFiles: [
        './src/features/inspector/PropertiesWorkspace.tsx',
        './src/features/mapper/MapperWorkspace.tsx',
        './src/features/workspace/MonacoYamlEditor.tsx'
      ]
    }
  },
  ssr: {
    noExternal: ['@mui/material', 'react-transition-group']
  },
  build: {
    outDir: studioOutDir,
    emptyOutDir: true,
    manifest: true
  }
}));
