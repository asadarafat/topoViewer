#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const scope = readScope(args);
const errors = [];
const warnings = [];

const TEXT_EXTENSIONS = new Set([
  '.cjs',
  '.css',
  '.html',
  '.js',
  '.json',
  '.map',
  '.md',
  '.mjs',
  '.svg',
  '.toml',
  '.ts',
  '.tsx',
  '.txt',
  '.yaml',
  '.yml'
]);

const FORBIDDEN_PATH_PARTS = [
  '.donotpush',
  '.env',
  '.artifacts',
  '.DS_Store',
  '__pycache__',
  'node_modules',
  'playwright-report',
  'test-results'
];

const FORBIDDEN_PATH_SUFFIXES = [
  '.key',
  '.pem',
  '.pyc',
  '.tar.gz',
  '.tgz'
];

const FORBIDDEN_TEXT = [
  { value: '/Users/', reason: 'local home path' },
  { value: 'DG_25_6_v2', reason: 'private workspace path' },
  { value: '.donotpush', reason: 'private workspace marker' },
  { value: '.artifacts/', reason: 'local artifact path' },
  { value: '.artifacts/promo', reason: 'local promotional media path' },
  { value: 'github.com/asadarafat/TopoViewer', reason: 'wrong repository casing' },
  { value: 'asadarafat.github.io/TopoViewer', reason: 'wrong Pages route casing' },
  { value: 'BEGIN PRIVATE KEY', reason: 'private key material' },
  { value: 'BEGIN RSA PRIVATE KEY', reason: 'private key material' },
  { value: 'topoviewer-manual-transfer', reason: 'manual transfer artifact name' }
];

const NPM_PACKAGE_ALLOWED_ROOT_FILES = new Set([
  'LICENSE',
  'README.md',
  'package.json'
]);

const NPM_PACKAGE_ALLOWED_PREFIXES = [
  'dist/',
  'content/pages/',
  'schemas/'
];

const NPM_PACKAGE_REQUIRED_FILES = [
  'LICENSE',
  'README.md',
  'package.json',
  'dist/topoviewer.mjs',
  'dist/topoviewer.umd.js',
  'dist/topoviewer.css',
  'dist/types/index.d.ts',
  'content/pages/start/first-topology.md',
  'content/pages/examples/use-cases/react.md',
  'content/pages/reference/object-attributes.md',
  'schemas/topoviewer.schema.json',
  'schemas/topoviewer-topology.schema.json',
  'schemas/topoviewer-stylesheet.schema.json',
  'schemas/topoviewer-mapper.schema.json'
];

const GRAFANA_PLUGIN_REQUIRED_FILES = [
  'plugin.json',
  'module.js',
  'img/logo.svg'
];

const GRAFANA_PLUGIN_ALLOWED_PATHS = [
  /^plugin\.json$/,
  /^module\.js$/,
  /^module\.js\.map$/,
  /^module\.js\.LICENSE\.txt$/,
  /^img\/logo\.svg$/,
  /^\d+\.module\.js$/,
  /^\d+\.module\.js\.map$/,
  /^gpx_topoviewer-panel_[a-z0-9]+_[a-z0-9]+$/
];

const DOCS_SITE_REQUIRED_FILES = [
  '.nojekyll',
  'index.html',
  'docs/mkdocs/index.html',
  'docs/zensical/index.html',
  'harness/index.html',
  'studio/index.html'
];

function readScope(cliArgs) {
  const flag = cliArgs.find((arg) => arg.startsWith('--scope='));
  if (flag) return flag.slice('--scope='.length);
  const index = cliArgs.indexOf('--scope');
  if (index !== -1) return cliArgs[index + 1];
  return 'all';
}

function repoPath(...parts) {
  return path.join(repoRoot, ...parts);
}

function relative(filePath) {
  return path.relative(repoRoot, filePath).split(path.sep).join(path.posix.sep);
}

function fail(message) {
  errors.push(message);
}

function warn(message) {
  warnings.push(message);
}

function normalizeArtifactPath(filePath) {
  return filePath.replace(/^package\//, '').split(path.sep).join(path.posix.sep);
}

function isAllowedNpmPackagePath(filePath) {
  if (NPM_PACKAGE_ALLOWED_ROOT_FILES.has(filePath)) return true;
  return NPM_PACKAGE_ALLOWED_PREFIXES.some((prefix) => filePath.startsWith(prefix));
}

function assertNoForbiddenPath(filePath, context) {
  const parts = filePath.split('/');
  for (const part of parts) {
    if (FORBIDDEN_PATH_PARTS.includes(part)) {
      fail(`${context} includes forbidden path segment "${part}" in ${filePath}`);
    }
  }

  for (const suffix of FORBIDDEN_PATH_SUFFIXES) {
    if (filePath.endsWith(suffix)) {
      fail(`${context} includes forbidden file suffix "${suffix}" in ${filePath}`);
    }
  }
}

function isTextPath(filePath) {
  return TEXT_EXTENSIONS.has(path.extname(filePath));
}

function readTextIfAvailable(absolutePath) {
  if (!fs.existsSync(absolutePath)) return '';
  if (!fs.statSync(absolutePath).isFile()) return '';
  return fs.readFileSync(absolutePath, 'utf8');
}

function assertNoForbiddenText(text, context) {
  for (const { value, reason } of FORBIDDEN_TEXT) {
    if (text.includes(value)) {
      fail(`${context} contains ${reason}: ${value}`);
    }
  }
}

function walkFiles(root) {
  if (!fs.existsSync(root)) return [];
  const stat = fs.statSync(root);
  if (stat.isFile()) return [root];

  const files = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const absolute = path.join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(absolute));
    } else if (entry.isFile()) {
      files.push(absolute);
    }
  }
  return files;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function npmInvocation(args) {
  if (process.env.npm_execpath) {
    return {
      command: process.execPath,
      args: [process.env.npm_execpath, ...args]
    };
  }
  return { command: 'npm', args };
}

function npmPackDryRun() {
  const invocation = npmInvocation(['pack', '--workspace', 'topoviewer', '--dry-run', '--json', '--ignore-scripts']);
  const result = spawnSync(invocation.command, invocation.args, {
    cwd: repoRoot,
    encoding: 'utf8',
    shell: process.platform === 'win32'
  });

  if (result.error) {
    fail(`npm pack dry-run failed to start: ${result.error.message}`);
    return [];
  }

  if (result.status !== 0) {
    fail(`npm pack dry-run failed:\n${result.stderr || result.stdout}`);
    return [];
  }

  try {
    const parsed = JSON.parse(result.stdout);
    return parsed[0]?.files?.map((file) => normalizeArtifactPath(file.path)) || [];
  } catch (error) {
    fail(`npm pack dry-run did not produce parseable JSON: ${error instanceof Error ? error.message : String(error)}`);
    return [];
  }
}

function checkNpmPackageArtifact() {
  const packageRoot = repoPath('packages/topoviewer');
  const files = npmPackDryRun();
  const fileSet = new Set(files);

  for (const required of NPM_PACKAGE_REQUIRED_FILES) {
    if (!fileSet.has(required)) {
      fail(`npm package is missing required artifact file: ${required}`);
    }
  }

  for (const file of files) {
    if (!isAllowedNpmPackagePath(file)) {
      fail(`npm package includes non-allowlisted file: ${file}`);
    }
    assertNoForbiddenPath(file, 'npm package');

    if (isTextPath(file)) {
      const text = readTextIfAvailable(path.join(packageRoot, file));
      if (text) {
        assertNoForbiddenText(text, `npm package file ${file}`);
      }
    }
  }

  const packageJson = readJson(path.join(packageRoot, 'package.json'));
  if (packageJson.name !== 'topoviewer') {
    fail('npm package artifact must be named "topoviewer".');
  }
  if (packageJson.private) {
    fail('npm package artifact must not be private.');
  }
  if (packageJson.engines?.node !== '>=24 <25') {
    fail('npm package artifact must declare Node 24 engine range: >=24 <25.');
  }
  if (!packageJson.peerDependencies?.react || !packageJson.peerDependencies?.['react-dom'] || !packageJson.peerDependencies?.['@xyflow/react']) {
    fail('npm package artifact must declare React, React DOM, and @xyflow/react peer dependencies.');
  }

  console.log(`npm package artifact autopsy checked ${files.length} packed file(s).`);
}

function checkGrafanaPluginArtifact() {
  const distRoot = repoPath('packages/grafana-topoviewer-panel/dist');
  if (!fs.existsSync(distRoot)) {
    fail('Grafana plugin dist artifact is missing; run npm run grafana:panel:build before artifact autopsy.');
    return;
  }

  const files = walkFiles(distRoot)
    .map((file) => relative(file).replace('packages/grafana-topoviewer-panel/dist/', ''))
    .sort();
  const fileSet = new Set(files);

  for (const required of GRAFANA_PLUGIN_REQUIRED_FILES) {
    if (!fileSet.has(required)) {
      fail(`Grafana plugin artifact is missing required file: ${required}`);
    }
  }

  const executableFiles = files.filter((file) => /^gpx_topoviewer-panel_[a-z0-9]+_[a-z0-9]+$/.test(file));
  if (executableFiles.length !== 1) {
    fail(`Grafana plugin artifact must contain exactly one platform backend executable, found ${executableFiles.length}.`);
  }

  for (const file of files) {
    if (!GRAFANA_PLUGIN_ALLOWED_PATHS.some((pattern) => pattern.test(file))) {
      fail(`Grafana plugin artifact includes non-allowlisted file: ${file}`);
    }
    assertNoForbiddenPath(file, 'Grafana plugin artifact');

    if (isTextPath(file)) {
      const text = readTextIfAvailable(path.join(distRoot, file));
      if (text) {
        assertNoForbiddenText(text, `Grafana plugin artifact file ${file}`);
      }
    }
  }

  const pluginJson = readJson(path.join(distRoot, 'plugin.json'));
  if (pluginJson.id !== 'asadarafat-topoviewer-panel') {
    fail('Grafana plugin artifact plugin.json must use id "asadarafat-topoviewer-panel".');
  }
  if (pluginJson.backend !== true) {
    fail('Grafana plugin artifact plugin.json must declare backend: true.');
  }
  if (pluginJson.executable !== 'gpx_topoviewer-panel') {
    fail('Grafana plugin artifact plugin.json must declare executable "gpx_topoviewer-panel".');
  }
  const docsLink = pluginJson.info?.links?.find((link) => link.name === 'Documentation')?.url;
  if (docsLink !== 'https://asadarafat.github.io/topoviewer/') {
    fail('Grafana plugin artifact documentation link must use the lowercase public docs URL.');
  }

  console.log(`Grafana plugin artifact autopsy checked ${files.length} staged file(s).`);
}

function checkDocsArtifact() {
  const siteRoot = repoPath('site');
  if (!fs.existsSync(siteRoot)) {
    warn('docs site artifact is not present; skipping docs build artifact autopsy for this scope.');
    return;
  }

  for (const required of DOCS_SITE_REQUIRED_FILES) {
    if (!fs.existsSync(path.join(siteRoot, required))) {
      fail(`docs site artifact is missing required file: ${required}`);
    }
  }

  const files = walkFiles(siteRoot)
    .map((file) => relative(file).replace(/^site\//, ''))
    .sort();
  for (const file of files) {
    assertNoForbiddenPath(file, 'docs site artifact');
    if (!isTextPath(file)) continue;
    const text = readTextIfAvailable(path.join(siteRoot, file));
    if (text) {
      assertNoForbiddenText(text, `docs site artifact file ${file}`);
    }
  }

  console.log(`docs site artifact autopsy checked ${files.length} generated file(s).`);
}

function checkPromotionalMediaReferences() {
  const publicRoots = [
    'README.md',
    'docs',
    'packages/topoviewer/content/pages',
    'packages/topoviewer/README.md',
    'packages/mkdocs-topoviewer/README.md',
    'packages/vscode-topoviewer/README.md',
    'packages/grafana-topoviewer-panel/README.md'
  ];

  for (const root of publicRoots) {
    const absolute = repoPath(root);
    if (!fs.existsSync(absolute)) continue;
    for (const file of walkFiles(absolute)) {
      const rel = relative(file);
      if (!isTextPath(rel)) continue;
      const text = readTextIfAvailable(file);
      assertNoForbiddenText(text, `public media reference file ${rel}`);
      if (/\.artifacts\//.test(text)) {
        fail(`${rel} references local .artifacts content; checked-in public docs must use docs/assets or durable hosted media.`);
      }
    }
  }

  const docsAssetsRoot = repoPath('docs/assets');
  if (fs.existsSync(docsAssetsRoot)) {
    for (const file of walkFiles(docsAssetsRoot)) {
      const rel = relative(file);
      assertNoForbiddenPath(rel, 'docs asset');
    }
  }

  console.log('promotional media reference autopsy checked public docs and docs/assets.');
}

if (!['all', 'package', 'docs'].includes(scope)) {
  fail(`Unknown artifact check scope "${scope}". Use all, package, or docs.`);
}

if (scope === 'all' || scope === 'package') {
  checkNpmPackageArtifact();
  checkGrafanaPluginArtifact();
  checkPromotionalMediaReferences();
}

if (scope === 'all' || scope === 'docs') {
  checkDocsArtifact();
  checkPromotionalMediaReferences();
}

for (const message of warnings) {
  console.warn(`warning: ${message}`);
}

if (errors.length) {
  console.error('Release artifact checks failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(`release artifact checks passed for scope: ${scope}`);
