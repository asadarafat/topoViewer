#!/usr/bin/env node

import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

const repositoryRoot = path.resolve(import.meta.dirname, '..');
const binaryIndex = process.argv.indexOf('--binary');
const binary = binaryIndex >= 0 && process.argv[binaryIndex + 1]
  ? path.resolve(repositoryRoot, process.argv[binaryIndex + 1])
  : path.join(
    repositoryRoot,
    'apps',
    'topoviewer-studio-desktop',
    'build',
    'bin',
    `topoviewer-studio${process.platform === 'win32' ? '.exe' : ''}`
  );

if (!existsSync(binary)) {
  console.error(`[topoviewer] Desktop binary is missing: ${binary}.`);
  process.exit(1);
}

const command = process.platform === 'linux' ? 'xvfb-run' : binary;
const args = process.platform === 'linux' ? ['-a', binary] : [];
if (process.platform === 'linux') {
  const probe = spawnSync('xvfb-run', ['--help'], { stdio: 'ignore' });
  if (probe.error) {
    console.error('[topoviewer] xvfb-run is required for Linux desktop startup smoke.');
    process.exit(1);
  }
}

const child = spawn(command, args, {
  detached: process.platform !== 'win32',
  env: {
    ...process.env,
    GDK_BACKEND: process.platform === 'linux' ? 'x11' : process.env.GDK_BACKEND
  },
  stdio: ['ignore', 'pipe', 'pipe']
});
let output = '';
child.stdout.on('data', (chunk) => { output += chunk.toString(); });
child.stderr.on('data', (chunk) => { output += chunk.toString(); });

const earlyExit = await Promise.race([
  new Promise((resolve) => child.once('exit', (code, signal) => resolve({ code, signal }))),
  new Promise((resolve) => setTimeout(() => resolve(undefined), 4000))
]);

if (earlyExit) {
  console.error(`[topoviewer] Desktop exited during startup smoke: ${JSON.stringify(earlyExit)}.`);
  if (output.trim()) console.error(output.trim());
  process.exit(1);
}

stop('SIGTERM');
await Promise.race([
  new Promise((resolve) => child.once('exit', resolve)),
  new Promise((resolve) => setTimeout(resolve, 3000))
]);
if (child.exitCode === null) stop('SIGKILL');
console.log('[topoviewer] Desktop process remained healthy through the startup smoke window.');
process.exit(0);

function stop(signal) {
  try {
    if (process.platform === 'win32') child.kill(signal);
    else process.kill(-child.pid, signal);
  } catch {
    child.kill(signal);
  }
}
