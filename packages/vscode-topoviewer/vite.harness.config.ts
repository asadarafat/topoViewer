import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import yaml from 'js-yaml';
import { defineConfig, type Plugin, type ResolvedConfig } from 'vite';
import { validateSources } from './src/shared/validation';

const packageRoot = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(packageRoot, '../..');
const contentExamplesRoot = path.join(repoRoot, 'packages/topoviewer/content/examples');
const contentExamplesCatalog = path.join(contentExamplesRoot, 'catalog.yaml');
const harnessBase = process.env.TOPOVIEWER_HARNESS_BASE || '/topoviewer/harness/';
const harnessOutDir = process.env.TOPOVIEWER_HARNESS_OUT_DIR || path.join(repoRoot, 'site/harness');
const serverMarker = {
  package: 'vscode-topoviewer-harness',
  gitSha: readGitSha()
};

type ExampleFileKey = 'topology' | 'stylesheet' | 'mapper';

interface ContentExample {
  id: string;
  title: string;
  path: string;
  sourcePath?: string;
  sourceFiles?: Partial<Record<ExampleFileKey, string>>;
  harness?: boolean | {
    id?: string;
    name?: string;
    order?: number;
  };
}

interface HarnessFixtureSource {
  id: string;
  name: string;
  order: number;
  mapperFile?: string;
  topologyFile: string;
  stylesheetFile: string;
}

function exampleSourceFile(example: ContentExample, key: ExampleFileKey) {
  const fileName = key === 'topology' ? 'topology.yaml' : key === 'stylesheet' ? 'stylesheet.yaml' : 'mapper.yaml';
  const configured = example.sourceFiles?.[key];
  const source = path.join(contentExamplesRoot, configured || example.sourcePath || example.path, fileName);
  const relativePath = path.relative(contentExamplesRoot, source);
  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    throw new Error(`Harness fixture source resolves outside canonical content examples: ${source}`);
  }
  return source;
}

function harnessMetadata(example: ContentExample) {
  if (!example.harness) return undefined;
  return typeof example.harness === 'object' ? example.harness : {};
}

function loadHarnessFixtures(): HarnessFixtureSource[] {
  if (!fs.existsSync(contentExamplesCatalog)) {
    throw new Error(`Canonical content catalog is missing: ${contentExamplesCatalog}`);
  }

  const catalog = yaml.load(fs.readFileSync(contentExamplesCatalog, 'utf8')) as { examples?: ContentExample[] } | undefined;
  const fixtureIds = new Set<string>();
  return (catalog?.examples || [])
    .flatMap((example): HarnessFixtureSource[] => {
      const metadata = harnessMetadata(example);
      if (!metadata) return [];
      const fixture: HarnessFixtureSource = {
        id: metadata.id || example.id,
        name: metadata.name || example.title,
        order: metadata.order ?? Number.MAX_SAFE_INTEGER,
        mapperFile: fs.existsSync(exampleSourceFile(example, 'mapper')) ? exampleSourceFile(example, 'mapper') : undefined,
        topologyFile: exampleSourceFile(example, 'topology'),
        stylesheetFile: exampleSourceFile(example, 'stylesheet')
      };
      if (fixtureIds.has(fixture.id)) {
        throw new Error(`Duplicate harness fixture id in canonical catalog: ${fixture.id}`);
      }
      fixtureIds.add(fixture.id);
      return [fixture];
    })
    .sort((left, right) => left.order - right.order || left.name.localeCompare(right.name) || left.id.localeCompare(right.id));
}

const fixtures = loadHarnessFixtures();

function readRequestBody(request: import('node:http').IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    request.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    request.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    request.on('error', reject);
  });
}

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
  const filePath = fileName === 'topology.yaml' ? fixture.topologyFile : fixture.stylesheetFile;
  if (!fs.existsSync(filePath)) return undefined;
  return filePath;
}

function defaultMapperText(sourceId = 'topoviewer') {
  return [
    'version: 1',
    'identity:',
    `  sourceId: ${sourceId}`,
    '  sourceIdLabel: source_id',
    'rules: []',
    ''
  ].join('\n');
}

function fixtureMapperText(id: string) {
  const fixture = fixtureById(id);
  if (!fixture) return undefined;
  return fixture.mapperFile && fs.existsSync(fixture.mapperFile)
    ? fs.readFileSync(fixture.mapperFile, 'utf8')
    : defaultMapperText(id);
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
    fs.writeFileSync(path.join(targetDirectory, 'mapper.yaml'), fixtureMapperText(fixture.id) || defaultMapperText(fixture.id));
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
        if (request.method === 'GET' && url.pathname === '/__topoviewer-test-marker.json') {
          response.setHeader('cache-control', 'no-store');
          sendJson(response, serverMarker);
          return;
        }

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

        const mapperMatch = url.pathname.match(/^\/fixtures\/([^/]+)\/mapper\.yaml$/);
        if (request.method === 'GET' && mapperMatch) {
          const mapperText = fixtureMapperText(mapperMatch[1]);
          if (mapperText === undefined) {
            sendJson(response, { error: 'Fixture not found' }, 404);
            return;
          }
          sendText(response, mapperText);
          return;
        }

        if (request.method === 'POST' && url.pathname === '/validate') {
          try {
            const body = JSON.parse(await readRequestBody(request));
            sendJson(response, validateSources({
              ...body,
              mapperText: String(body.mapperText || ''),
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
      { find: /^topoviewer\/authoring$/, replacement: path.join(repoRoot, 'packages/topoviewer/src/authoring.ts') },
      { find: /^topoviewer\/integration$/, replacement: path.join(repoRoot, 'packages/topoviewer/src/integration.ts') },
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
