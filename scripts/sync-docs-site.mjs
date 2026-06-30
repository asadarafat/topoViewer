import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const contentPagesRoot = path.join(repoRoot, 'packages/topoviewer/content/pages');
const docsRoot = path.resolve(process.env.TOPOVIEWER_DOCS_ROOT || path.join(repoRoot, 'docs'));
const targetDocsRoot = path.join(docsRoot, 'topoviewer');
const migratedContentPages = [
  'authoring.md',
  'browser-harness.md',
  'compatibility.md',
  'debugging.md',
  'getting-started.md',
  'grafana-telemetry-call-flow.md',
  'grafana.md',
  'layout-guide.md',
  'mkdocs.md',
  'react.md',
  'style-a-topology.md',
  'validate-yaml.md',
  'zensical.md',
  'examples/basic.md',
  'examples/datacenter.md',
  'examples/integrations.md',
  'examples/provider-network.md'
];

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function writeTextIfChanged(filePath, content) {
  const existing = fs.existsSync(filePath) ? readText(filePath) : undefined;
  if (existing === content) return false;
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
  return true;
}

function listMarkdownFiles(root) {
  const files = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const absolute = path.join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...listMarkdownFiles(absolute));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(absolute);
    }
  }
  return files;
}

function copyMarkdownDocs() {
  let changed = false;
  for (const source of listMarkdownFiles(contentPagesRoot)) {
    const relative = path.relative(contentPagesRoot, source);
    if (relative.split(path.sep)[0] === '_fragments') continue;
    const target = path.join(targetDocsRoot, relative);
    changed = writeTextIfChanged(target, readText(source)) || changed;
  }
  return changed;
}

function removeMigratedContentPages() {
  let changed = false;
  for (const relative of migratedContentPages) {
    const target = path.join(targetDocsRoot, relative);
    if (!fs.existsSync(target)) continue;
    fs.rmSync(target);
    changed = true;
  }
  return changed;
}

const docsChanged = copyMarkdownDocs();
const staleChanged = removeMigratedContentPages();
const changed = docsChanged || staleChanged;
console.log(changed ? `synced docs site into ${docsRoot}` : `docs site already synced at ${docsRoot}`);
