#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
  mkdirSync
} from 'node:fs';
import path from 'node:path';

const repositoryRoot = path.resolve(import.meta.dirname, '..');
const desktopRoot = path.join(repositoryRoot, 'apps', 'topoviewer-studio-desktop');
const frontendRoot = path.join(desktopRoot, 'frontend', 'dist');
const outputIndex = process.argv.indexOf('--binary');
const binary = outputIndex >= 0
  ? path.resolve(repositoryRoot, process.argv[outputIndex + 1])
  : defaultBinary();
const rootPackage = readJson(path.join(repositoryRoot, 'package.json'));
const frontendPackage = readJson(path.join(desktopRoot, 'frontend', 'package.json'));
const wails = readJson(path.join(desktopRoot, 'wails.json'));
const failures = [];

if (rootPackage.version !== frontendPackage.version || rootPackage.version !== wails.info?.productVersion) {
  failures.push(
    `Desktop version drift: root=${rootPackage.version}, frontend=${frontendPackage.version}, ` +
    `wails=${wails.info?.productVersion}.`
  );
}

if (!existsSync(binary) || !statSync(binary).isFile()) {
  failures.push(`Native binary is missing: ${relative(binary)}.`);
}

const frontendFiles = files(frontendRoot);
const forbiddenFrontend = frontendFiles.filter((file) =>
  file.endsWith('.map') ||
  /\.(?:ts|tsx)$/.test(file) ||
  /(?:^|[._-])(?:test|spec|fixture)(?:[._-]|$)/i.test(path.basename(file))
);
if (forbiddenFrontend.length > 0) {
  failures.push(`Frontend contains forbidden development files: ${forbiddenFrontend.map(relative).join(', ')}.`);
}
const indexPath = path.join(frontendRoot, 'index.html');
if (!existsSync(indexPath)) {
  failures.push('Desktop frontend index.html is missing.');
}
const frontendText = frontendFiles
  .filter((file) => /\.(?:html|js|css)$/.test(file))
  .map((file) => readFileSync(file, 'utf8'))
  .join('\n');
for (const forbidden of ['desktop-test-project', 'topoviewer-studio/src', 'acquireVsCodeApi']) {
  if (frontendText.includes(forbidden)) failures.push(`Production frontend contains forbidden marker "${forbidden}".`);
}
for (const required of ['MonacoYamlEditor', 'MapperWorkspace']) {
  if (!frontendFiles.some((file) => path.basename(file).startsWith(required))) {
    failures.push(`Production frontend is missing lazy ${required} output.`);
  }
}

let binaryBytes;
if (existsSync(binary) && statSync(binary).isFile()) {
  binaryBytes = readFileSync(binary);
  if (binaryBytes.byteLength < 1_000_000) failures.push('Native binary is unexpectedly smaller than 1 MB.');
  if (binaryBytes.byteLength > 40 * 1024 * 1024) failures.push('Native binary exceeds the 40 MiB budget.');
}

const manifest = {
  architecture: process.arch,
  artifact: relative(binary),
  bytes: binaryBytes?.byteLength,
  checksum: binaryBytes ? `sha256:${createHash('sha256').update(binaryBytes).digest('hex')}` : undefined,
  commit: process.env.GITHUB_SHA || gitCommit(),
  files: files(path.join(desktopRoot, 'build', 'bin')).map((file) => {
    const bytes = readFileSync(file);
    return {
      bytes: bytes.byteLength,
      checksum: `sha256:${createHash('sha256').update(bytes).digest('hex')}`,
      path: relative(file)
    };
  }),
  operatingSystem: process.platform,
  supportStatus: process.env.TOPOVIEWER_DESKTOP_SIGNED === 'true' ? 'release-candidate' : 'internal-unsigned',
  version: rootPackage.version,
  wails: wailsVersion()
};

const manifestIndex = process.argv.indexOf('--manifest');
if (manifestIndex >= 0 && process.argv[manifestIndex + 1]) {
  const output = path.resolve(repositoryRoot, process.argv[manifestIndex + 1]);
  mkdirSync(path.dirname(output), { recursive: true });
  writeFileSync(output, `${JSON.stringify(manifest, null, 2)}\n`);
}

if (failures.length > 0) {
  console.error('[topoviewer] Desktop artifact inspection failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log(JSON.stringify(manifest, null, 2));

function defaultBinary() {
  if (process.platform === 'darwin') {
    return path.join(
      desktopRoot,
      'build',
      'bin',
      'TopoViewer Studio.app',
      'Contents',
      'MacOS',
      'topoviewer-studio'
    );
  }
  const extension = process.platform === 'win32' ? '.exe' : '';
  return path.join(desktopRoot, 'build', 'bin', `topoviewer-studio${extension}`);
}

function files(root) {
  if (!existsSync(root)) return [];
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const candidate = path.join(root, entry.name);
    return entry.isDirectory() ? files(candidate) : entry.isFile() ? [candidate] : [];
  });
}

function gitCommit() {
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: repositoryRoot,
      encoding: 'utf8'
    }).trim();
  } catch {
    return 'unknown';
  }
}

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf8'));
}

function relative(file) {
  return path.relative(repositoryRoot, file).split(path.sep).join('/');
}

function wailsVersion() {
  const goMod = readFileSync(path.join(desktopRoot, 'go.mod'), 'utf8');
  return goMod.match(/github\.com\/wailsapp\/wails\/v2\s+(v2\.\d+\.\d+)/)?.[1] || 'unknown';
}
