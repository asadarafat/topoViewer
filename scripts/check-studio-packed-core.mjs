#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const coreRoot = path.join(repoRoot, 'packages/topoviewer');
const studioRoot = path.join(repoRoot, 'packages/topoviewer-studio');
const coreManifest = JSON.parse(fs.readFileSync(path.join(coreRoot, 'package.json'), 'utf8'));

function runNpm(args, cwd = repoRoot, stdio = 'inherit') {
  const command = process.env.npm_execpath ? process.execPath : 'npm';
  const commandArgs = process.env.npm_execpath ? [process.env.npm_execpath, ...args] : args;
  const result = spawnSync(command, commandArgs, {
    cwd,
    encoding: 'utf8',
    shell: process.platform === 'win32',
    stdio
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`npm ${args.join(' ')} failed with exit ${result.status}${stdio === 'pipe' ? `\n${result.stdout || ''}${result.stderr || ''}` : ''}`);
  }
  return result;
}

function sourceFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(target);
    return /\.(ts|tsx)$/.test(entry.name) ? [target] : [];
  });
}

function assertConsumedEntriesArePublished() {
  const consumed = new Set();
  const importPattern = /from\s+['"](topoviewer(?:\/[^'"]+)?)['"]/g;
  for (const file of sourceFiles(path.join(studioRoot, 'src'))) {
    const source = fs.readFileSync(file, 'utf8');
    for (const match of source.matchAll(importPattern)) consumed.add(match[1]);
  }

  const missing = [...consumed].filter((specifier) => {
    const exportKey = specifier === 'topoviewer' ? '.' : `.${specifier.slice('topoviewer'.length)}`;
    return !coreManifest.exports?.[exportKey];
  });
  if (missing.length > 0) {
    throw new Error(`Studio consumes unpublished core entries: ${missing.join(', ')}`);
  }
}

function copyStudio(target) {
  fs.cpSync(studioRoot, target, {
    recursive: true,
    filter(source) {
      const relative = path.relative(studioRoot, source);
      return !relative.split(path.sep).some((part) => ['coverage', 'dist', 'node_modules', 'playwright-report', 'test-results'].includes(part));
    }
  });
}

assertConsumedEntriesArePublished();
runNpm(['--workspace', 'topoviewer', 'run', 'build']);

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'topoviewer-studio-packed-core-'));
try {
  const packResult = runNpm([
    'pack',
    '--workspace',
    'topoviewer',
    '--ignore-scripts',
    '--json',
    '--pack-destination',
    tempRoot
  ], repoRoot, 'pipe');
  const tarballName = JSON.parse(packResult.stdout)[0]?.filename;
  if (!tarballName) throw new Error('npm pack did not return a core tarball filename');

  const isolatedStudio = path.join(tempRoot, 'packages/topoviewer-studio');
  fs.mkdirSync(path.dirname(isolatedStudio), { recursive: true });
  copyStudio(isolatedStudio);

  const studioManifestPath = path.join(isolatedStudio, 'package.json');
  const studioManifest = JSON.parse(fs.readFileSync(studioManifestPath, 'utf8'));
  studioManifest.dependencies.topoviewer = `file:${path.join(tempRoot, tarballName)}`;
  fs.writeFileSync(studioManifestPath, `${JSON.stringify(studioManifest, null, 2)}\n`);

  runNpm(['install', '--ignore-scripts', '--no-audit', '--no-fund'], isolatedStudio);
  runNpm(['run', 'typecheck'], isolatedStudio);
  runNpm(['run', 'build'], isolatedStudio);
  console.log('Studio packed-core typecheck and build passed.');
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}
