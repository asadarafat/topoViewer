#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(import.meta.dirname, '..');
const maxFileLines = 1000;
const defaultMaxBarrelExports = 80;
const customBarrelLimits = new Map([
  ['packages/topoviewer/src/index.ts', 140]
]);
const codeRoots = [
  'packages/topoviewer/src',
  'packages/topoviewer/scripts',
  'packages/topoviewer/tests',
  'packages/grafana-topoviewer-panel/src',
  'packages/grafana-topoviewer-panel/scripts',
  'packages/grafana-topoviewer-panel/tests',
  'packages/vscode-topoviewer/src',
  'packages/vscode-topoviewer/scripts',
  'packages/vscode-topoviewer/tests',
  'labs/grafana-topoviewer/scripts',
  'scripts'
];
const codeExtensions = new Set(['.cjs', '.js', '.mjs', '.ts', '.tsx']);
const ignoredPathParts = new Set([
  '.artifacts',
  '.venv',
  '.venv-docs',
  '.venv-zensical',
  'dist',
  'node_modules',
  'playwright-report',
  'site',
  'test-results'
]);

function relativePath(filePath) {
  return path.relative(repoRoot, filePath).split(path.sep).join('/');
}

function shouldSkip(entryPath) {
  return relativePath(entryPath).split('/').some((part) => ignoredPathParts.has(part));
}

function* walk(dir) {
  if (!fs.existsSync(dir) || shouldSkip(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (shouldSkip(fullPath)) continue;
    if (entry.isDirectory()) {
      yield* walk(fullPath);
      continue;
    }
    if (!entry.isFile()) continue;
    if (!codeExtensions.has(path.extname(entry.name))) continue;
    if (entry.name.endsWith('.d.ts')) continue;
    yield fullPath;
  }
}

function lineCount(content) {
  if (!content) return 0;
  return content.endsWith('\n') ? content.split('\n').length - 1 : content.split('\n').length;
}

function countBarrelExports(content) {
  let exportCount = 0;
  let inNamedExport = false;

  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('//') || line.startsWith('/*') || line.startsWith('*')) continue;

    if (inNamedExport) {
      exportCount += line
        .replace(/[{};]/g, '')
        .split(',')
        .map((part) => part.trim())
        .filter((part) => part && !part.startsWith('from ')).length;
      if (line.includes('}')) inNamedExport = false;
      continue;
    }

    const namedExport = line.match(/^export\s+(?:type\s+)?\{(.*)$/);
    if (namedExport) {
      const body = namedExport[1];
      exportCount += body
        .replace(/[{};]/g, '')
        .split(',')
        .map((part) => part.trim())
        .filter((part) => part && !part.startsWith('from ')).length;
      if (!line.includes('}')) inNamedExport = true;
      continue;
    }

    if (/^export\s+\*\s+from\s+/.test(line)) {
      exportCount += defaultMaxBarrelExports + 1;
      continue;
    }

    if (/^export\s+(?:default\s+)?(?:abstract\s+)?(?:const|let|var|function|class|type|interface|enum)\s+/.test(line)) {
      exportCount += 1;
    }
  }

  return exportCount;
}

const files = codeRoots.flatMap((root) => Array.from(walk(path.join(repoRoot, root))));
const lineViolations = [];
const barrelViolations = [];

for (const filePath of files) {
  const rel = relativePath(filePath);
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = lineCount(content);
  if (lines > maxFileLines) {
    lineViolations.push({ path: rel, lines, max: maxFileLines });
  }

  if (path.basename(filePath) === 'index.ts' || path.basename(filePath) === 'index.tsx') {
    const max = customBarrelLimits.get(rel) || defaultMaxBarrelExports;
    const exports = countBarrelExports(content);
    if (exports > max) {
      barrelViolations.push({ path: rel, exports, max });
    }
  }
}

if (lineViolations.length || barrelViolations.length) {
  if (lineViolations.length) {
    console.error(`Files over ${maxFileLines} lines:`);
    for (const violation of lineViolations.sort((a, b) => b.lines - a.lines)) {
      console.error(`  ${violation.path}: ${violation.lines} lines (${violation.lines - violation.max} over)`);
    }
  }

  if (barrelViolations.length) {
    console.error(`\nBarrel files over ${defaultMaxBarrelExports} exports:`);
    for (const violation of barrelViolations.sort((a, b) => b.exports - a.exports)) {
      console.error(`  ${violation.path}: ${violation.exports} exports (${violation.exports - violation.max} over limit ${violation.max})`);
    }
  }

  process.exit(1);
}

console.log(`Code health check passed: ${files.length} files, max ${maxFileLines} lines per file.`);
