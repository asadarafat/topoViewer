#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packageRoot = path.join(repoRoot, 'packages/topoviewer-studio');
const packageJson = JSON.parse(fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8'));
const packageLock = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package-lock.json'), 'utf8'));
const failures = [];

function fail(message) {
  failures.push(message);
}

function run(command, args) {
  const result = spawnSync(command, args, { cwd: repoRoot, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`${command} ${args.join(' ')} failed:\n${result.stderr || result.stdout}`);
  return result.stdout;
}

function filesUnder(root) {
  return fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const candidate = path.join(root, entry.name);
    return entry.isDirectory() ? filesUnder(candidate) : [candidate];
  });
}

if (packageJson.private !== true) fail('topoviewer-studio must remain private.');
if (packageJson.license !== 'Apache-2.0') fail('topoviewer-studio must declare Apache-2.0.');
if (packageJson.publishConfig) fail('topoviewer-studio must not define publishConfig.');
if (Object.keys(packageJson.scripts || {}).some((name) => /publish/i.test(name))) fail('topoviewer-studio must not define publish scripts.');
if (JSON.stringify(packageJson.files) !== JSON.stringify(['dist', 'ACCESSIBILITY.md', 'ARCHITECTURE.md', 'package.json'])) {
  fail('topoviewer-studio package files must remain on the reviewed allowlist.');
}
if (!packageJson.exports?.['./security']) fail('topoviewer-studio must expose its reviewed cross-host security boundary.');
if (!packageJson.exports?.['./host-security']) fail('topoviewer-studio must expose its light host security boundary.');

const allowedLicenses = new Set([
  '(MIT AND Zlib)',
  '(MPL-2.0 OR Apache-2.0)',
  'Apache-2.0',
  'BSD-2-Clause',
  'BSD-3-Clause',
  'ISC',
  'MIT',
  'MIT OR SEE LICENSE IN FEEL-FREE.md',
  'MPL-2.0',
  'Python-2.0'
]);
const dependencies = JSON.parse(run('npm', ['query', '.workspace[name=topoviewer-studio] *', '--json']));
for (const dependency of dependencies) {
  if (!allowedLicenses.has(dependency.license)) fail(`${dependency.name}@${dependency.version} has unreviewed license ${dependency.license || '<missing>'}.`);
  if (!String(dependency.location || '').startsWith('node_modules/')) continue;
  const locked = packageLock.packages?.[dependency.location];
  if (!locked?.integrity) fail(`${dependency.name}@${dependency.version} has no package-lock integrity.`);
  if (!String(locked?.resolved || '').startsWith('https://registry.npmjs.org/')) {
    fail(`${dependency.name}@${dependency.version} does not resolve from the reviewed npm registry.`);
  }
}

const sourceFiles = filesUnder(path.join(packageRoot, 'src')).filter((file) => /\.(?:ts|tsx|css)$/.test(file));
const forbiddenRuntime = [
  [/\beval\s*\(/, 'eval'],
  [/\bnew\s+Function\b/, 'new Function'],
  [/\bfetch\s*\(/, 'fetch'],
  [/\bXMLHttpRequest\b/, 'XMLHttpRequest'],
  [/\bWebSocket\b/, 'WebSocket'],
  [/from\s+['"]node:/, 'Node built-in import'],
  [/\bacquireVsCodeApi\b/, 'direct VS Code API access']
];
const secretPatterns = [
  [/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/, 'private key'],
  [/\b(?:NPM_TOKEN|NODE_AUTH_TOKEN|AWS_SECRET_ACCESS_KEY)\b\s*[:=]\s*['"][^'"]+/, 'credential assignment'],
  [/gh[pousr]_[A-Za-z0-9_]{24,}/, 'GitHub token'],
  [/npm_[A-Za-z0-9]{24,}/, 'npm token'],
  [/\/Users\/[A-Za-z0-9._-]+\//, 'local macOS path'],
  [/\/home\/[A-Za-z0-9._-]+\//, 'local Linux path']
];
for (const file of sourceFiles) {
  const text = fs.readFileSync(file, 'utf8');
  const relative = path.relative(repoRoot, file);
  for (const [pattern, label] of forbiddenRuntime) if (pattern.test(text)) fail(`${relative} contains forbidden Studio runtime capability: ${label}.`);
  for (const [pattern, label] of secretPatterns) if (pattern.test(text)) fail(`${relative} contains possible ${label}.`);
}

const packed = JSON.parse(run('npm', ['pack', '--workspace', 'topoviewer-studio', '--dry-run', '--json']))[0];
const packedFiles = packed.files.map((entry) => entry.path);
for (const file of packedFiles) {
  if (!/^(?:ACCESSIBILITY\.md|ARCHITECTURE\.md|package\.json|dist\/)/.test(file)) fail(`Studio dry-run package contains unexpected file ${file}.`);
  if (/(?:\.env|\.artifacts|\.donotpush|test-results|playwright-report|node_modules)/.test(file)) fail(`Studio dry-run package leaks forbidden path ${file}.`);
}
for (const required of ['dist/security.js', 'dist/security.d.ts', 'dist/hostSecurity.js', 'dist/hostSecurity.d.ts', 'dist/contracts/host.js', 'dist/app.js']) {
  if (!packedFiles.includes(required)) fail(`Studio dry-run package is missing ${required}.`);
}

if (failures.length) {
  console.error(failures.map((message) => `- ${message}`).join('\n'));
  process.exit(1);
}
console.log(`Studio supply-chain check passed (${dependencies.length} dependency records, ${packedFiles.length} artifact files).`);
