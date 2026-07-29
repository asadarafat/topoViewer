#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const repositoryRoot = path.resolve(import.meta.dirname, '..');
const desktopRoot = path.join(repositoryRoot, 'apps', 'topoviewer-studio-desktop');
const goMod = readFileSync(path.join(desktopRoot, 'go.mod'), 'utf8');
const goDirective = goMod.match(/^go\s+(\d+)\.(\d+)(?:\.(\d+))?$/m);
const wailsVersion = goMod.match(/^\s*(?:require\s+)?github\.com\/wailsapp\/wails\/v2\s+(v2\.\d+\.\d+)\s*$/m);
const failures = [];
const facts = {};

if (Number.parseInt(process.versions.node.split('.')[0] || '0', 10) !== 24) {
  failures.push(`Node.js 24 is required; found ${process.version}.`);
}
facts.node = process.version;

if (!goDirective || compareVersion(goDirective.slice(1), [1, 25, 0]) < 0) {
  failures.push('Desktop go.mod must require Go 1.25 or newer.');
}
facts.goDirective = goDirective?.slice(1).filter(Boolean).join('.');

if (!wailsVersion) {
  failures.push('Desktop go.mod must pin one stable Wails v2 version.');
}
facts.wails = wailsVersion?.[1];

const goEnvironment = run('go', ['env', 'GOVERSION', 'GOOS', 'GOARCH'], desktopRoot);
if (!goEnvironment.ok) {
  failures.push(`Go is unavailable: ${goEnvironment.error}`);
} else {
  const [version, os, architecture] = goEnvironment.stdout.trim().split(/\s+/);
  facts.go = version;
  facts.os = os;
  facts.architecture = architecture;
  const parsed = version?.match(/^go(\d+)\.(\d+)(?:\.(\d+))?/);
  if (!parsed || compareVersion(parsed.slice(1), [1, 25, 0]) < 0) {
    failures.push(`Go 1.25 or newer is required; found ${version || 'an unknown version'}.`);
  }
}

if (facts.os === 'linux') {
  requireCommand('gcc', ['--version']);
  requireCommand('pkg-config', ['--version']);
  requirePkgConfig('gtk+-3.0', 'GTK 3 development files');
  requirePkgConfig('webkit2gtk-4.1', 'WebKit2GTK 4.1 development files');
}

if (facts.os === 'darwin') {
  requireCommand('xcode-select', ['-p'], 'Xcode command-line tools');
}

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ failures, ...facts }, null, 2));
} else if (failures.length === 0) {
  console.log(
    `[topoviewer] Desktop prerequisites ready: Node ${facts.node}, ${facts.go}, ` +
    `Wails ${facts.wails}, ${facts.os}/${facts.architecture}.`
  );
}

if (failures.length > 0) {
  console.error('[topoviewer] Desktop prerequisites failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

function compareVersion(parts, minimum) {
  const values = parts.map((part) => Number.parseInt(part || '0', 10));
  for (let index = 0; index < minimum.length; index += 1) {
    if ((values[index] || 0) !== minimum[index]) {
      return (values[index] || 0) - minimum[index];
    }
  }
  return 0;
}

function requireCommand(command, args, label = command) {
  const result = run(command, args, desktopRoot);
  if (!result.ok) failures.push(`${label} is required: ${result.error}`);
}

function requirePkgConfig(moduleName, label) {
  const result = run('pkg-config', ['--exists', moduleName], desktopRoot);
  if (!result.ok) failures.push(`${label} is required (pkg-config module ${moduleName}).`);
}

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8' });
  return {
    error: result.error?.message || result.stderr.trim() || `exit ${result.status ?? 'unknown'}`,
    ok: !result.error && result.status === 0,
    stdout: result.stdout || ''
  };
}
