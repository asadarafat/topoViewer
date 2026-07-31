#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const siteRoot = path.join(repoRoot, 'site');

function walkFiles(root) {
  if (!fs.existsSync(root)) return [];
  const entries = fs.readdirSync(root, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolutePath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(absolutePath));
    } else if (entry.isFile()) {
      files.push(absolutePath);
    }
  }
  return files;
}

if (!fs.existsSync(siteRoot)) {
  console.log('Docs site is not present; nothing to prune.');
  process.exit(0);
}

let removedFiles = 0;
let removedBytes = 0;

for (const file of walkFiles(siteRoot)) {
  const relativePath = path.relative(siteRoot, file).split(path.sep).join('/');
  const isBuildManifest = relativePath === 'studio/.vite/manifest.json';
  if (!file.endsWith('.map') && !isBuildManifest) continue;
  const stat = fs.statSync(file);
  fs.rmSync(file);
  removedFiles += 1;
  removedBytes += stat.size;
}

const studioViteDirectory = path.join(siteRoot, 'studio/.vite');
if (fs.existsSync(studioViteDirectory) && fs.readdirSync(studioViteDirectory).length === 0) {
  fs.rmdirSync(studioViteDirectory);
}

const kib = (removedBytes / 1024).toFixed(1);
console.log(`Pruned ${removedFiles} publish-only docs artifact(s), ${kib} KiB removed.`);
