#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(import.meta.dirname, '..');
const siteRoot = path.join(repoRoot, 'site');
const requiredSiteAssets = [
  'docs/mkdocs/assets/topoviewer/topoviewer-embed.css',
  'docs/mkdocs/assets/topoviewer/topoviewer-embed.iife.js',
  'docs/zensical/assets/topoviewer/topoviewer-embed.css',
  'docs/zensical/assets/topoviewer/topoviewer-embed.iife.js',
  'harness/index.html'
];

function missingAssets() {
  return requiredSiteAssets.filter((relativePath) => !fs.existsSync(path.join(siteRoot, relativePath)));
}

function run(label, command, args, env = {}) {
  console.log(`\n==> ${label}`);
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    env: { ...process.env, ...env },
    shell: process.platform === 'win32',
    stdio: 'inherit'
  });
  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const initialMissing = missingAssets();
if (initialMissing.length === 0) {
  console.log('Renderer parity site assets already exist.');
  process.exit(0);
}

console.log('Renderer parity site assets are missing:');
for (const asset of initialMissing) {
  console.log(`- ${asset}`);
}

run('build MkDocs site for renderer parity', 'npm', ['run', 'docs:build:fast']);
run('build Zensical site for renderer parity', 'npm', ['run', 'zensical:build'], {
  TOPOVIEWER_ZENSICAL_SKIP_VIEWER_BUILD: '1'
});
run('build VS Code harness site for renderer parity', 'npm', ['run', 'vscode:harness:build']);
run('write Pages redirects for renderer parity', 'npm', ['run', 'pages:redirects']);

const finalMissing = missingAssets();
if (finalMissing.length > 0) {
  console.error('Renderer parity site assets are still missing after build:');
  for (const asset of finalMissing) {
    console.error(`- ${asset}`);
  }
  process.exit(1);
}

console.log('Renderer parity site assets are ready.');
