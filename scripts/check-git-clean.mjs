#!/usr/bin/env node

import { spawnSync } from 'node:child_process';

const rawArgs = process.argv.slice(2);
const paths = [];
let sourceArea = 'the canonical source inputs for this generated output';
let projectionArea = 'the checked generated output paths';

for (let index = 0; index < rawArgs.length; index += 1) {
  const arg = rawArgs[index];
  if (arg === '--') {
    paths.push(...rawArgs.slice(index + 1));
    break;
  }
  if (arg === '--source-area' || arg === '--source') {
    sourceArea = rawArgs[index + 1] || sourceArea;
    index += 1;
    continue;
  }
  if (arg === '--projection-area' || arg === '--projection') {
    projectionArea = rawArgs[index + 1] || projectionArea;
    index += 1;
    continue;
  }
  paths.push(arg);
}

if (paths.length === 0) {
  console.error('Usage: node scripts/check-git-clean.mjs [--source-area <label>] [--projection-area <label>] -- <path> [path...]');
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
  console.error('Generated projection drift detected.');
  console.error(`Canonical source area: ${sourceArea}`);
  console.error(`Generated projection area: ${projectionArea}`);
  console.error('');
  console.error('Stale or uncommitted projection paths:');
  for (const line of output.split('\n')) {
    const parsed = line.match(/^(.{1,2})\s+(.*)$/);
    const status = parsed?.[1]?.trim() || '??';
    const filePath = parsed?.[2]?.trim() || line.trim();
    console.error(`- ${status.padEnd(2)} ${filePath}`);
  }
  console.error('');
  console.error('Run the matching sync/build command locally, review the diff, and commit the generated output.');
  process.exit(1);
}

console.log(`Checked generated outputs are committed for ${projectionArea}: ${paths.join(', ')}`);
