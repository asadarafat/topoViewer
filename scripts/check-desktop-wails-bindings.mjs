import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import {
  readFileSync,
  readdirSync,
  writeFileSync
} from 'node:fs';
import {
  cp,
  mkdtemp,
  readdir,
  readFile,
  rm
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const repositoryRoot = path.resolve(import.meta.dirname, '..');
const generatedRoot = path.join(
  repositoryRoot,
  'apps',
  'topoviewer-studio-desktop',
  'frontend',
  'wailsjs'
);
const write = process.argv.includes('--write');

async function treeDigest(root) {
  const result = new Map();
  async function visit(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    entries.sort((left, right) => left.name.localeCompare(right.name));
    for (const entry of entries) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        await visit(absolute);
      } else if (entry.isFile()) {
        const relative = path.relative(root, absolute).split(path.sep).join('/');
        result.set(relative, createHash('sha256').update(await readFile(absolute)).digest('hex'));
      }
    }
  }
  await visit(root);
  return result;
}

function changedFiles(before, after) {
  return [...new Set([...before.keys(), ...after.keys()])]
    .filter((file) => before.get(file) !== after.get(file))
    .sort();
}

function generateBindings() {
  const result = spawnSync(
    process.execPath,
    [
      path.join(repositoryRoot, 'scripts', 'run-desktop-wails.mjs'),
      'generate',
      'module',
      '-nocolour'
    ],
    {
      cwd: repositoryRoot,
      encoding: 'utf8',
      stdio: 'inherit'
    }
  );
  if (result.error || result.status !== 0) {
    throw new Error(result.error?.message || `Wails binding generation exited with ${result.status}.`);
  }
  normalizeGeneratedText(generatedRoot);
}

function normalizeGeneratedText(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      normalizeGeneratedText(absolute);
      continue;
    }
    if (!entry.isFile() || !/\.(?:js|json|ts)$/.test(entry.name)) continue;

    const source = readFileSync(absolute, 'utf8');
    const normalized = `${source.replace(/[ \t]+$/gm, '').trimEnd()}\n`;
    if (normalized !== source) writeFileSync(absolute, normalized);
  }
}

if (write) {
  generateBindings();
  console.log('[topoviewer] Desktop Wails bindings regenerated.');
  process.exit(0);
}

const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), 'topoviewer-wails-bindings-'));
const backupRoot = path.join(temporaryRoot, 'wailsjs');
await cp(generatedRoot, backupRoot, { recursive: true });
const before = await treeDigest(generatedRoot);

try {
  generateBindings();
  const after = await treeDigest(generatedRoot);
  const changed = changedFiles(before, after);
  if (changed.length > 0) {
    console.error('[topoviewer] Generated Wails bindings are stale:');
    changed.forEach((file) => console.error(`  - ${file}`));
    console.error('Run: npm run desktop:bindings:generate');
    process.exitCode = 1;
  } else {
    console.log(`[topoviewer] Desktop Wails bindings match ${before.size} generated files.`);
  }
} finally {
  await rm(generatedRoot, { force: true, recursive: true });
  await cp(backupRoot, generatedRoot, { recursive: true });
  await rm(temporaryRoot, { force: true, recursive: true });
}
