#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import os from 'node:os';

const require = createRequire(import.meta.url);

function commandOutput(command, args = []) {
  try {
    return execFileSync(command, args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim();
  } catch {
    return 'unavailable';
  }
}

function packageVersion(packageName) {
  try {
    return require(`${packageName}/package.json`).version || 'unavailable';
  } catch {
    return 'unavailable';
  }
}

const rows = [
  ['Node', process.version],
  ['npm', commandOutput('npm', ['--version'])],
  ['Python', commandOutput('python3', ['--version'])],
  ['Playwright', packageVersion('@playwright/test')],
  ['OS', `${os.type()} ${os.release()} ${os.arch()}`],
  ['CPU', `${os.cpus().length} x ${os.cpus()[0]?.model || 'unknown'}`],
  ['Memory', `${Math.round(os.totalmem() / 1024 / 1024)} MiB`],
  ['Git branch', commandOutput('git', ['rev-parse', '--abbrev-ref', 'HEAD'])],
  ['Git SHA', commandOutput('git', ['rev-parse', '--short=12', 'HEAD'])],
  ['CI', process.env.CI || 'false'],
  ['NODE_ENV', process.env.NODE_ENV || 'unset'],
  ['GITHUB_WORKFLOW', process.env.GITHUB_WORKFLOW || 'unset'],
  ['GITHUB_RUN_ID', process.env.GITHUB_RUN_ID || 'unset']
];

console.log('TopoViewer CI environment');
console.log('========================');
for (const [key, value] of rows) {
  console.log(`${key}: ${value}`);
}
