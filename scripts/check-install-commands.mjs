#!/usr/bin/env node

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceTarballInstallCommand = 'npm install /tmp/topoviewer-pack/topoviewer-0.1.0.tgz @xyflow/react react react-dom';
const futurePublishedInstallCommand = 'npm install topoviewer @xyflow/react react react-dom';
const futurePublishedInstallCommandFiles = new Set([
  'docs/topoviewer/maintainers/release.md',
  'docs/topoviewer/maintainers/monorepo.md',
  'packages/topoviewer/README.md',
  'packages/topoviewer/content/pages/maintainers/release.md',
  'packages/topoviewer/content/pages/maintainers/monorepo.md',
  'packages/topoviewer/docs/maintainers/release.md',
  'packages/topoviewer/docs/maintainers/monorepo.md'
]);
const publicTextRoots = [
  'README.md',
  'docs',
  'packages/topoviewer/README.md',
  'packages/topoviewer/docs',
  'packages/topoviewer/content',
  'packages/mkdocs-topoviewer/README.md',
  'packages/vscode-topoviewer/README.md',
  'packages/grafana-topoviewer-panel/README.md'
];
const textExtensions = new Set(['.md', '.mdx', '.txt', '.yaml', '.yml', '.toml', '.json']);
const ignoredParts = new Set(['node_modules', 'dist', 'site', '.artifacts', '.git']);

function repoPath(...parts) {
  return path.join(repoRoot, ...parts);
}

function relative(filePath) {
  return path.relative(repoRoot, filePath).split(path.sep).join(path.posix.sep);
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd || repoRoot,
    encoding: 'utf8',
    shell: process.platform === 'win32',
    stdio: options.stdio || 'pipe',
    env: {
      ...process.env,
      ...(options.env || {})
    }
  });

  if (result.error) {
    throw new Error(`${command} ${args.join(' ')} failed to start: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed with exit ${result.status}\n${result.stdout || ''}${result.stderr || ''}`);
  }
  return result;
}

function walkTextFiles(root) {
  const absolute = repoPath(root);
  if (!fs.existsSync(absolute)) return [];
  const stat = fs.statSync(absolute);
  if (stat.isFile()) {
    return textExtensions.has(path.extname(absolute)) ? [absolute] : [];
  }

  const files = [];
  for (const entry of fs.readdirSync(absolute, { withFileTypes: true })) {
    if (ignoredParts.has(entry.name)) continue;
    const child = path.join(absolute, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkTextFiles(relative(child)));
    } else if (entry.isFile() && textExtensions.has(path.extname(child))) {
      files.push(child);
    }
  }
  return files;
}

function assertPublicInstallCommands() {
  const badCommands = [];
  const installCommandPattern = /npm\s+install\s+[^\n`]*/g;
  const files = new Set(publicTextRoots.flatMap(walkTextFiles));

  for (const filePath of [...files].sort()) {
    const text = fs.readFileSync(filePath, 'utf8');
    const matches = (text.match(installCommandPattern) || []).filter((match) => /\btopoviewer\b/.test(match));
    for (const match of matches) {
      const normalized = match.trim().replace(/\s+/g, ' ');
      const relativePath = relative(filePath);
      const isAllowedSourceInstall = normalized === sourceTarballInstallCommand;
      const isAllowedFutureInstall =
        normalized === futurePublishedInstallCommand && futurePublishedInstallCommandFiles.has(relativePath);
      if (!isAllowedSourceInstall && !isAllowedFutureInstall) {
        badCommands.push(`${relative(filePath)}: ${normalized}`);
      }
    }
  }

  if (badCommands.length) {
    throw new Error([
      'Public TopoViewer install command drift detected.',
      'The topoviewer package is pre-publish, so usage docs must use the local tarball install command.',
      `Current source install command: ${sourceTarballInstallCommand}`,
      'The future npm command is allowed only in release/package-boundary docs.',
      ...badCommands.map((item) => `- ${item}`)
    ].join('\n'));
  }
}

function packTopoviewer(tempRoot) {
  run('npm', ['--workspace', 'topoviewer', 'run', 'build'], { stdio: 'inherit' });
  const result = run('npm', ['pack', '--workspace', 'topoviewer', '--json', '--ignore-scripts', '--pack-destination', tempRoot]);
  const parsed = JSON.parse(result.stdout);
  const filename = parsed[0]?.filename;
  if (!filename) {
    throw new Error('npm pack did not report a tarball filename.');
  }
  return path.join(tempRoot, filename);
}

function writeConsumerProject(consumerRoot) {
  fs.writeFileSync(
    path.join(consumerRoot, 'package.json'),
    `${JSON.stringify(
      {
        name: 'topoviewer-install-check',
        private: true,
        type: 'module',
        scripts: {}
      },
      null,
      2
    )}\n`
  );
}

function assertInstalledPackage(consumerRoot) {
  run('node', [
    '--input-type=module',
    '-e',
    [
      "import { TopoViewer, compileTopoGraph, validateTopoDocument } from 'topoviewer';",
      'if (typeof TopoViewer !== "function") throw new Error("TopoViewer export missing");',
      'if (typeof compileTopoGraph !== "function") throw new Error("compileTopoGraph export missing");',
      'if (typeof validateTopoDocument !== "function") throw new Error("validateTopoDocument export missing");'
    ].join(' ')
  ], { cwd: consumerRoot });

  run('node', [
    '-e',
    [
      "const viewer = require('topoviewer');",
      "if (typeof viewer.TopoViewer !== 'function') throw new Error('CommonJS TopoViewer export missing');",
      "require.resolve('topoviewer/style.css');",
      "require.resolve('topoviewer/schemas/topoviewer.schema.json');"
    ].join(' ')
  ], { cwd: consumerRoot });
}

assertPublicInstallCommands();

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'topoviewer-install-check-'));
try {
  const tarball = packTopoviewer(tempRoot);
  const consumerRoot = path.join(tempRoot, 'consumer');
  fs.mkdirSync(consumerRoot);
  writeConsumerProject(consumerRoot);
  run('npm', [
    'install',
    '--ignore-scripts',
    '--no-audit',
    '--no-fund',
    tarball,
    '@xyflow/react@^12.10.2',
    'react@^18.3.1',
    'react-dom@^18.3.1'
  ], { cwd: consumerRoot, stdio: 'inherit' });
  assertInstalledPackage(consumerRoot);
  console.log(`install dry-run passed for source tarball install command: ${sourceTarballInstallCommand}`);
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}
