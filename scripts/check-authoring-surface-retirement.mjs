#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(import.meta.dirname, '..');
const errors = [];

const retiredPaths = [
  'packages/vscode-topoviewer/src/harness',
  'packages/vscode-topoviewer/vite.harness.config.ts',
  'packages/vscode-topoviewer/playwright.config.js',
  'packages/vscode-topoviewer/src/webview/WebviewApp.tsx',
  'packages/vscode-topoviewer/src/webview/AuthoringRail.tsx',
  'packages/vscode-topoviewer/src/webview/WebviewChrome.tsx',
  'packages/vscode-topoviewer/src/webview/host.ts',
  'packages/topoviewer/content/pages/examples/use-cases/harness.md'
];

const activeFilesWithoutHarnessProduct = [
  'package.json',
  'packages/vscode-topoviewer/package.json',
  '.github/workflows/ci.yml',
  'mkdocs.yml',
  'zensical.toml',
  'packages/topoviewer/content/pages/_fragments/readme.md',
  'packages/topoviewer/content/pages/examples/index.md',
  'packages/topoviewer/content/pages/examples/use-cases/index.md',
  'packages/topoviewer/content/pages/author/studio/index.md',
  'SUPPORT.md'
];

const maintainedDocumentationRoots = [
  'README.md',
  'CHANGELOG.md',
  'SECURITY.md',
  'SUPPORT.md',
  'CONTRIBUTING.md',
  'docs',
  'packages',
  'openspec/README.md',
  'openspec/config.yaml',
  'mkdocs.yml',
  'zensical.toml'
];
const ignoredDocumentationDirectories = new Set([
  'build',
  'coverage',
  'dist',
  'node_modules',
  'site'
]);

function visitDocumentation(relativePath) {
  const absolutePath = path.join(repoRoot, relativePath);
  if (!fs.existsSync(absolutePath)) return;
  const stat = fs.statSync(absolutePath);
  if (stat.isDirectory()) {
    for (const entry of fs.readdirSync(absolutePath, { withFileTypes: true })) {
      if (entry.isDirectory()
        && (entry.name.startsWith('.') || ignoredDocumentationDirectories.has(entry.name))) {
        continue;
      }
      visitDocumentation(path.join(relativePath, entry.name));
    }
    return;
  }
  if (!/\.(?:md|ya?ml)$/i.test(relativePath)) return;
  const text = fs.readFileSync(absolutePath, 'utf8');
  if (/\bharness\b/i.test(text)) {
    errors.push(`Maintained documentation still names the retired authoring surface: ${relativePath}`);
  }
}

for (const relativePath of retiredPaths) {
  if (fs.existsSync(path.join(repoRoot, relativePath))) {
    errors.push(`Retired Harness path still exists: ${relativePath}`);
  }
}

for (const relativePath of activeFilesWithoutHarnessProduct) {
  const absolutePath = path.join(repoRoot, relativePath);
  if (!fs.existsSync(absolutePath)) {
    errors.push(`Authoring ownership input is missing: ${relativePath}`);
    continue;
  }
  const text = fs.readFileSync(absolutePath, 'utf8');
  if (/browser harness|vscode:harness|test:vscode-harness|ci:test:harness|test-harness/i.test(text)) {
    errors.push(`Active product file still advertises or runs Harness: ${relativePath}`);
  }
}

for (const relativePath of maintainedDocumentationRoots) {
  visitDocumentation(relativePath);
}

const webviewEntry = fs.readFileSync(path.join(repoRoot, 'packages/vscode-topoviewer/src/webview/main.tsx'), 'utf8');
if (!webviewEntry.includes("from 'topoviewer-studio/app'")) {
  errors.push('The VS Code webview must mount the public topoviewer-studio application entry.');
}

const redirectPath = path.join(repoRoot, 'site/harness/index.html');
if (fs.existsSync(path.join(repoRoot, 'site'))) {
  if (!fs.existsSync(redirectPath)) {
    errors.push('The built Pages artifact is missing the /harness/ compatibility redirect.');
  } else {
    const redirect = fs.readFileSync(redirectPath, 'utf8');
    if (!redirect.includes('/topoviewer/studio/')) {
      errors.push('The /harness/ compatibility page does not redirect to /topoviewer/studio/.');
    }
    if (fs.existsSync(path.join(repoRoot, 'site/harness/assets'))) {
      errors.push('The retired /harness/ route still ships application assets.');
    }
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('Authoring surface retirement check passed: Studio is the only shipped authoring application.');
