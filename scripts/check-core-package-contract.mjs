#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packageRoot = path.join(repoRoot, 'packages/topoviewer');
const manifest = JSON.parse(fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8'));
const errors = [];

const typedEntries = new Map([
  ['.', { runtime: 'topoviewer', types: 'index' }],
  ['./authoring', { runtime: 'authoring', types: 'authoring' }],
  ['./authoring/attention', { runtime: 'authoring-attention', types: 'authoring-attention' }],
  ['./export', { runtime: 'export', types: 'export' }],
  ['./integration', { runtime: 'integration', types: 'integration' }],
  ['./security', { runtime: 'security', types: 'security' }]
]);
// Each typed public entry owns ESM/CJS runtime and declaration files. Keep the
// non-entry allowance fixed so adding an export cannot silently relax it.
const maxPackedFiles = 40 + (typedEntries.size * 4);
const maxUnpackedBytes = 4_010_000 + (typedEntries.size * 35_000);

function fail(message) {
  errors.push(message);
}

function assertEqual(actual, expected, context) {
  if (actual !== expected) fail(`${context}: expected ${JSON.stringify(expected)}, found ${JSON.stringify(actual)}`);
}

function npmInvocation(args) {
  if (process.env.npm_execpath) return { command: process.execPath, args: [process.env.npm_execpath, ...args] };
  return { command: 'npm', args };
}

function packedArtifact() {
  const invocation = npmInvocation(['pack', '--workspace', 'topoviewer', '--dry-run', '--json', '--ignore-scripts']);
  const result = spawnSync(invocation.command, invocation.args, {
    cwd: repoRoot,
    encoding: 'utf8',
    shell: process.platform === 'win32'
  });
  if (result.status !== 0) {
    fail(`npm pack dry-run failed:\n${result.stderr || result.stdout}`);
    return undefined;
  }
  try {
    return JSON.parse(result.stdout)[0];
  } catch (error) {
    fail(`npm pack dry-run returned invalid JSON: ${error instanceof Error ? error.message : String(error)}`);
    return undefined;
  }
}

assertEqual(manifest.type, 'module', 'package type');
assertEqual(manifest.main, './dist/topoviewer.cjs', 'CommonJS compatibility entry');
assertEqual(manifest.module, './dist/topoviewer.mjs', 'ESM compatibility entry');
assertEqual(manifest.types, './dist/types/index.d.mts', 'default declaration entry');
assertEqual(manifest.engines?.node, '>=22.12', 'consumer Node engine');

for (const [specifier, names] of typedEntries) {
  const entry = manifest.exports?.[specifier];
  if (!entry || typeof entry !== 'object') {
    fail(`missing typed package export ${specifier}`);
    continue;
  }
  assertEqual(entry.import?.types, `./dist/types/${names.types}.d.mts`, `${specifier} ESM declarations`);
  assertEqual(entry.import?.default, `./dist/${names.runtime}.mjs`, `${specifier} ESM runtime`);
  assertEqual(entry.require?.types, `./dist/types/${names.types}.d.cts`, `${specifier} CommonJS declarations`);
  assertEqual(entry.require?.default, `./dist/${names.runtime}.cjs`, `${specifier} CommonJS runtime`);
}

if (manifest.files?.includes('content/pages')) fail('npm files allowlist must not include content/pages');

const readme = fs.readFileSync(path.join(packageRoot, 'README.md'), 'utf8');
if (!readme.startsWith('<!-- Generated from packages/topoviewer/content/pages/_fragments/readme.md.')) {
  fail('package README must be a generated projection of the canonical README fragment');
}
if (/\{\s*id:\s*['"][^'"]+['"],\s*name:/s.test(readme)) {
  fail('package README still demonstrates the removed generic entity name field');
}
if (/const\s+documentSpec[\s\S]*?\n\s*stylesheet:\s*\[/m.test(readme)) {
  fail('package README still demonstrates inline stylesheet ownership in a topology document');
}

const rendererSource = fs.readFileSync(path.join(packageRoot, 'src/components/TopoViewer.tsx'), 'utf8');
if (/import\s+['"][^'"]+\.css['"]/.test(rendererSource)) {
  fail('TopoViewer component must not hide CSS loading behind a component side effect');
}

const stylesheetPath = path.join(packageRoot, 'dist/topoviewer.css');
if (!fs.existsSync(stylesheetPath)) {
  fail('built renderer stylesheet is missing');
} else {
  const stylesheet = fs.readFileSync(stylesheetPath, 'utf8');
  if (!stylesheet.includes('.react-flow')) fail('renderer stylesheet is missing React Flow base styles');
  if (!stylesheet.includes('.topoviewer')) fail('renderer stylesheet is missing TopoViewer styles');
}

const packed = packedArtifact();
if (packed) {
  const paths = new Set((packed.files || []).map((file) => file.path));
  for (const filePath of paths) {
    if (filePath.startsWith('content/pages/')) fail(`npm artifact includes documentation source: ${filePath}`);
  }
  for (const [, names] of typedEntries) {
    for (const required of [
      `dist/${names.runtime}.mjs`,
      `dist/${names.runtime}.cjs`,
      `dist/types/${names.types}.d.mts`,
      `dist/types/${names.types}.d.cts`
    ]) {
      if (!paths.has(required)) fail(`npm artifact is missing ${required}`);
    }
  }
  for (const required of ['dist/topoviewer.css', 'dist/embed/topoviewer-embed.css', 'dist/embed/topoviewer-embed.iife.js']) {
    if (!paths.has(required)) fail(`npm artifact is missing ${required}`);
  }
  if (packed.entryCount > maxPackedFiles) {
    fail(`npm artifact contains ${packed.entryCount} files; budget is ${maxPackedFiles}`);
  }
  if (packed.size > 1_250_000) fail(`npm tarball is ${packed.size} bytes; budget is 1250000`);
  if (packed.unpackedSize > maxUnpackedBytes) {
    fail(`npm artifact is ${packed.unpackedSize} unpacked bytes; budget is ${maxUnpackedBytes}`);
  }
}

if (errors.length > 0) {
  console.error('Core package contract failed:');
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Core package contract passed for ${typedEntries.size} typed entries and ${packed?.entryCount || 0} packed files.`);
