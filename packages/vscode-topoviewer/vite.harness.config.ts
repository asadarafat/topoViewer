import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin, type ResolvedConfig } from 'vite';
import { validateSources } from './src/shared/validation';

const packageRoot = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(packageRoot, '../..');
const packageFixtureRoot = path.join(packageRoot, 'fixtures');
const exampleFixtureRoot = path.join(repoRoot, 'packages/topoviewer/examples/test-cases');
const harnessBase = process.env.TOPOVIEWER_HARNESS_BASE || '/topoViewer/harness/';
const harnessOutDir = process.env.TOPOVIEWER_HARNESS_OUT_DIR || path.join(repoRoot, 'site/harness');

const fixtures = [
  {
    id: 'layered-network',
    name: 'Layered network authoring',
    root: packageFixtureRoot,
    directory: 'layered-network'
  },
  {
    id: 'insert-workflow',
    name: 'Insert workflow',
    root: packageFixtureRoot,
    directory: 'insert-workflow'
  },
  {
    id: 'attention-workflow',
    name: 'Attention workflow',
    root: packageFixtureRoot,
    directory: 'attention-workflow'
  },
  {
    id: 'inspector-workflow',
    name: 'Inspector workflow',
    root: packageFixtureRoot,
    directory: 'inspector-workflow'
  },
  {
    id: 'dense-links',
    name: 'Dense link grouping',
    root: packageFixtureRoot,
    directory: 'dense-links'
  },
  {
    id: 'region-label-placement',
    name: 'Region label placement',
    root: exampleFixtureRoot,
    directory: 'regions/region-label-placement'
  }
];

function readRequestBody(request: import('node:http').IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    request.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    request.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    request.on('error', reject);
  });
}

function sendJson(response: import('node:http').ServerResponse, value: unknown, statusCode = 200) {
  response.statusCode = statusCode;
  response.setHeader('content-type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(value));
}

function sendText(response: import('node:http').ServerResponse, value: string, statusCode = 200) {
  response.statusCode = statusCode;
  response.setHeader('content-type', 'text/plain; charset=utf-8');
  response.end(value);
}

function fixtureById(id: string) {
  return fixtures.find((fixture) => fixture.id === id);
}

function fixtureFile(id: string, fileName: 'topology.yaml' | 'stylesheet.yaml') {
  const fixture = fixtureById(id);
  if (!fixture) return undefined;
  const filePath = path.join(fixture.root, fixture.directory, fileName);
  if (!fs.existsSync(filePath)) return undefined;
  return filePath;
}

function copyStaticFixtures(outDir: string) {
  const targetRoot = path.join(outDir, 'fixtures');
  fs.rmSync(targetRoot, { recursive: true, force: true });
  fs.mkdirSync(targetRoot, { recursive: true });
  fs.writeFileSync(
    path.join(targetRoot, 'index.json'),
    `${JSON.stringify(fixtures.map(({ id, name }) => ({ id, name })), null, 2)}\n`
  );

  for (const fixture of fixtures) {
    const targetDirectory = path.join(targetRoot, fixture.id);
    fs.mkdirSync(targetDirectory, { recursive: true });
    for (const fileName of ['topology.yaml', 'stylesheet.yaml'] as const) {
      const source = fixtureFile(fixture.id, fileName);
      if (!source) throw new Error(`Harness fixture "${fixture.id}" is missing ${fileName}.`);
      fs.copyFileSync(source, path.join(targetDirectory, fileName));
    }
  }
}

function fixtureApi(): Plugin {
  let resolvedConfig: ResolvedConfig | undefined;

  return {
    name: 'topoviewer-vscode-fixture-api',
    configResolved(config) {
      resolvedConfig = config;
    },
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const url = new URL(request.url || '/', 'http://127.0.0.1');
        if (request.method === 'GET' && url.pathname === '/fixtures/index.json') {
          sendJson(response, fixtures.map(({ id, name }) => ({ id, name })));
          return;
        }

        if (request.method === 'GET' && url.pathname === '/fixtures') {
          sendJson(response, fixtures.map(({ id, name }) => ({ id, name })));
          return;
        }

        const fixtureMatch = url.pathname.match(/^\/fixtures\/([^/]+)\/(topology|stylesheet)\.yaml$/);
        if (request.method === 'GET' && fixtureMatch) {
          const filePath = fixtureFile(fixtureMatch[1], `${fixtureMatch[2]}.yaml` as 'topology.yaml' | 'stylesheet.yaml');
          if (!filePath) {
            sendJson(response, { error: 'Fixture not found' }, 404);
            return;
          }
          sendText(response, fs.readFileSync(filePath, 'utf8'));
          return;
        }

        if (request.method === 'POST' && url.pathname === '/validate') {
          try {
            const body = JSON.parse(await readRequestBody(request));
            sendJson(response, validateSources({
              ...body,
              topologyText: String(body.topologyText || ''),
              stylesheetText: String(body.stylesheetText || '')
            }));
          } catch (error) {
            sendJson(response, { error: error instanceof Error ? error.message : String(error) }, 400);
          }
          return;
        }

        next();
      });
    },
    closeBundle() {
      if (resolvedConfig?.command !== 'build') return;
      const outDir = path.isAbsolute(resolvedConfig.build.outDir)
        ? resolvedConfig.build.outDir
        : path.join(resolvedConfig.root, resolvedConfig.build.outDir);
      copyStaticFixtures(outDir);
    }
  };
}

export default defineConfig(({ command }) => ({
  base: command === 'build' ? harnessBase : '/',
  root: packageRoot,
  plugins: [fixtureApi(), react()],
  resolve: {
    alias: [
      { find: /^topoviewer$/, replacement: path.join(repoRoot, 'packages/topoviewer/src/index.ts') }
    ]
  },
  server: {
    host: '127.0.0.1',
    port: 5174,
    strictPort: true
  },
  build: {
    outDir: harnessOutDir,
    emptyOutDir: true
  }
}));
