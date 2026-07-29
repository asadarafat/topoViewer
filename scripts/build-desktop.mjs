#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import path from 'node:path';

const repositoryRoot = path.resolve(import.meta.dirname, '..');
const packageArtifact = process.argv.includes('--package');
const targetIndex = process.argv.indexOf('--platform');
const requestedTarget = targetIndex >= 0 ? process.argv[targetIndex + 1] : undefined;
const environment = goEnvironment();
const target = requestedTarget || `${environment.os}/${environment.architecture}`;

if (target !== `${environment.os}/${environment.architecture}`) {
  fail(
    `Desktop artifacts must be built on a native runner; requested ${target} from ` +
    `${environment.os}/${environment.architecture}.`
  );
}

run(process.execPath, [path.join(repositoryRoot, 'scripts', 'check-desktop-prerequisites.mjs')]);

const args = [
  'build',
  '-s',
  '-clean',
  '-nocolour',
  '-m',
  '-trimpath',
  '-skipbindings',
  '-platform',
  target
];
if (!packageArtifact) args.push('-nopackage');
if (environment.os === 'linux') args.push('-tags', 'webkit2_41');
if (environment.os === 'windows') {
  args.push('-webview2', packageArtifact ? 'embed' : 'error');
  if (packageArtifact) args.push('-nsis', '-installscope', 'user');
}

run(process.execPath, [path.join(repositoryRoot, 'scripts', 'run-desktop-wails.mjs'), ...args]);
console.log(`[topoviewer] Built Desktop Studio for ${target}${packageArtifact ? ' with native packaging' : ''}.`);

function goEnvironment() {
  const result = spawnSync('go', ['env', 'GOOS', 'GOARCH'], {
    cwd: path.join(repositoryRoot, 'apps', 'topoviewer-studio-desktop'),
    encoding: 'utf8'
  });
  if (result.error || result.status !== 0) {
    fail(result.error?.message || result.stderr.trim() || 'Go environment lookup failed.');
  }
  const [os, architecture] = result.stdout.trim().split(/\s+/);
  if (!os || !architecture) fail('Go returned an incomplete target environment.');
  return { architecture, os };
}

function run(command, args) {
  const result = spawnSync(command, args, { cwd: repositoryRoot, stdio: 'inherit' });
  if (result.error || result.status !== 0) {
    fail(result.error?.message || `${command} exited with ${result.status ?? 'an unknown status'}.`);
  }
}

function fail(message) {
  console.error(`[topoviewer] ${message}`);
  process.exit(1);
}
