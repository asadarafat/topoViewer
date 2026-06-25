#!/usr/bin/env node

import { spawnSync } from 'node:child_process';

const paths = process.argv.slice(2);

if (paths.length === 0) {
  console.error('Usage: node scripts/check-git-clean.mjs <path> [path...]');
  process.exit(2);
}

const result = spawnSync('git', ['status', '--porcelain', '--', ...paths], {
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe']
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

if (result.status !== 0) {
  process.stderr.write(result.stderr);
  process.exit(result.status ?? 1);
}

const output = result.stdout.trim();

if (output) {
  console.error('Generated files are stale or uncommitted for the checked paths:');
  console.error(output);
  console.error('');
  console.error('Run the matching sync/build command locally, review the diff, and commit the generated output.');
  process.exit(1);
}

console.log(`Checked generated outputs are committed: ${paths.join(', ')}`);
