#!/usr/bin/env node

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceTarballInstallCommand = 'npm install /tmp/topoviewer-pack/topoviewer-0.1.0.tgz @xyflow/react react react-dom';
const publishedInstallCommand = 'npm install topoviewer @xyflow/react react react-dom';
const mkdocsPublishedInstallCommand = 'pip install mkdocs-topoviewer';
const mkdocsLocalEditableInstallPattern = /\b(?:python\s+-m\s+)?pip\s+install\s+-e\s+packages\/mkdocs-topoviewer\b/g;
const mkdocsWrongInstallPattern = /\bpip\s+install\s+topoviewer\b/g;
const sourceTarballInstallCommandFiles = new Set([
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
const requiredMkdocsPublishedInstallCommandFiles = new Set([
  'packages/mkdocs-topoviewer/README.md',
  'packages/topoviewer/content/pages/embed/mkdocs.md',
  'packages/topoviewer/docs/embed/mkdocs.md',
  'docs/topoviewer/embed/mkdocs.md'
]);
const allowedMkdocsPublishedInstallCommandFiles = new Set([
  ...requiredMkdocsPublishedInstallCommandFiles,
  'README.md',
  'packages/topoviewer/content/pages/_fragments/readme.md',
  'packages/topoviewer/content/pages/maintainers/monorepo.md',
  'packages/topoviewer/content/pages/maintainers/release.md',
  'packages/topoviewer/docs/maintainers/monorepo.md',
  'packages/topoviewer/docs/maintainers/release.md',
  'docs/topoviewer/maintainers/monorepo.md',
  'docs/topoviewer/maintainers/release.md'
]);
const allowedMkdocsLocalEditableInstallFiles = new Set([
  'packages/mkdocs-topoviewer/README.md',
  'packages/topoviewer/content/pages/maintainers/monorepo.md',
  'packages/topoviewer/content/pages/maintainers/release.md',
  'packages/topoviewer/docs/maintainers/monorepo.md',
  'packages/topoviewer/docs/maintainers/release.md',
  'docs/topoviewer/maintainers/monorepo.md',
  'docs/topoviewer/maintainers/release.md'
]);
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
      const isAllowedPublishedInstall = normalized === publishedInstallCommand;
      const isAllowedSourceInstall =
        normalized === sourceTarballInstallCommand && sourceTarballInstallCommandFiles.has(relativePath);
      if (!isAllowedPublishedInstall && !isAllowedSourceInstall) {
        badCommands.push(`${relative(filePath)}: ${normalized}`);
      }
    }
  }

  if (badCommands.length) {
    throw new Error([
      'Public TopoViewer install command drift detected.',
      `Current public install command: ${publishedInstallCommand}`,
      `Local tarball install is allowed only in maintainer release/preflight docs: ${sourceTarballInstallCommand}`,
      ...badCommands.map((item) => `- ${item}`)
    ].join('\n'));
  }
}

function assertMkDocsInstallCommands() {
  const badCommands = [];
  const missingRequiredCommands = [];
  const wrongPackageCommands = [];
  const leakedEditableCommands = [];
  const files = new Set(publicTextRoots.flatMap(walkTextFiles));

  for (const relativePath of requiredMkdocsPublishedInstallCommandFiles) {
    const absolutePath = repoPath(relativePath);
    if (!fs.existsSync(absolutePath)) {
      missingRequiredCommands.push(`${relativePath}: file missing`);
      continue;
    }
    const text = fs.readFileSync(absolutePath, 'utf8');
    if (!text.includes(mkdocsPublishedInstallCommand)) {
      missingRequiredCommands.push(`${relativePath}: missing ${mkdocsPublishedInstallCommand}`);
    }
  }

  for (const filePath of [...files].sort()) {
    const text = fs.readFileSync(filePath, 'utf8');
    const relativePath = relative(filePath);
    if (mkdocsWrongInstallPattern.test(text)) {
      wrongPackageCommands.push(relativePath);
    }
    mkdocsWrongInstallPattern.lastIndex = 0;
    if (mkdocsLocalEditableInstallPattern.test(text) && !allowedMkdocsLocalEditableInstallFiles.has(relativePath)) {
      leakedEditableCommands.push(relativePath);
    }
    mkdocsLocalEditableInstallPattern.lastIndex = 0;
    if (text.includes(mkdocsPublishedInstallCommand) && !allowedMkdocsPublishedInstallCommandFiles.has(relativePath)) {
      badCommands.push(relativePath);
    }
  }

  if (missingRequiredCommands.length || wrongPackageCommands.length || leakedEditableCommands.length || badCommands.length) {
    throw new Error([
      'Public mkdocs-topoviewer install command drift detected.',
      `Current public MkDocs install command: ${mkdocsPublishedInstallCommand}`,
      ...missingRequiredCommands.map((item) => `- missing required command: ${item}`),
      ...wrongPackageCommands.map((item) => `- wrong MkDocs package command in ${item}; use mkdocs-topoviewer, not topoviewer`),
      ...leakedEditableCommands.map((item) => `- local editable MkDocs install leaked into public docs: ${item}`),
      ...badCommands.map((item) => `- unexpected public MkDocs install command in ${item}`)
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
assertMkDocsInstallCommands();

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
  console.log(`install dry-run passed for local release tarball command: ${sourceTarballInstallCommand}`);
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}
