import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const contentPagesRoot = path.join(repoRoot, 'packages/topoviewer/content/pages');
const docsRoot = path.resolve(process.env.TOPOVIEWER_DOCS_ROOT || path.join(repoRoot, 'docs'));
const targetDocsRoot = path.join(docsRoot, 'topoviewer');
const projectionManifestPath = path.join(targetDocsRoot, '.content-projection-manifest.json');

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

function listMarkdownFiles(rootDir) {
  const files = [];
  if (!fs.existsSync(rootDir)) return files;
  for (const entry of fs.readdirSync(rootDir, { withFileTypes: true })) {
    const filePath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listMarkdownFiles(filePath));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(filePath);
    }
  }
  return files;
}

function relativeContentPath(filePath) {
  return path.relative(contentPagesRoot, filePath).split(path.sep).join('/');
}

function canonicalContentPages() {
  return listMarkdownFiles(contentPagesRoot)
    .map((source) => ({ relativePath: relativeContentPath(source), source }))
    .filter(({ relativePath }) => relativePath.split('/')[0] !== '_fragments')
    .sort((left, right) => left.relativePath.localeCompare(right.relativePath));
}

function readProjectionManifest() {
  if (!fs.existsSync(projectionManifestPath)) return [];
  try {
    const manifest = JSON.parse(readText(projectionManifestPath));
    if (manifest?.version !== 1 || !Array.isArray(manifest.files)) return [];
    return manifest.files.filter(
      (filePath) =>
        typeof filePath === 'string' &&
        filePath.endsWith('.md') &&
        !path.posix.isAbsolute(filePath) &&
        !filePath.split('/').includes('..')
    );
  } catch {
    return [];
  }
}

function writeProjectionManifest(contentPages) {
  return writeTextIfChanged(
    projectionManifestPath,
    `${JSON.stringify(
      {
        files: contentPages.map(({ relativePath }) => relativePath),
        version: 1
      },
      null,
      2
    )}\n`
  );
}

function removeFileIfExists(filePath) {
  if (!fs.existsSync(filePath)) return false;
  fs.rmSync(filePath, { recursive: true, force: true });
  return true;
}

function removeEmptyDirectories(rootDir) {
  if (!fs.existsSync(rootDir)) return;
  const entries = fs.readdirSync(rootDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      removeEmptyDirectories(path.join(rootDir, entry.name));
    }
  }
  if (rootDir !== targetDocsRoot && fs.readdirSync(rootDir).length === 0) {
    fs.rmdirSync(rootDir);
  }
}

function copyMarkdownDocs(contentPages) {
  let changed = false;
  for (const { relativePath, source } of contentPages) {
    const target = path.join(targetDocsRoot, relativePath);
    changed = writeTextIfChanged(target, readText(source)) || changed;
  }
  return changed;
}

function pruneStaleContentPages(contentPages) {
  const currentPaths = new Set(contentPages.map(({ relativePath }) => relativePath));
  const legacyStalePaths = [
    'api-reference.md',
    'architecture.md',
    'attention-reference.md',
    'attention-typescript-api.md',
    'attention.md',
    'authoring.md',
    'browser-harness.md',
    'build-vs-adopt.md',
    'evaluate/build-or-adopt.md',
    'evaluate/adopt-topoviewer-or-build-a-renderer.md',
    'evaluate/adopt-topoviewer-for-portable-topology.md',
    'compatibility.md',
    'debugging.md',
    'decisions.md',
    'design-review-checklist.md',
    'docs-standard.md',
    'examples-gallery.md',
    'examples.md',
    'getting-started.md',
    'glossary.md',
    'grafana-mapper-recipes.md',
    'grafana-telemetry-call-flow.md',
    'grafana.md',
    'integration-roadmap.md',
    'layout-guide.md',
    'mkdocs.md',
    'monorepo.md',
    'object-family-examples.md',
    'object-reference.md',
    'performance-reliability-accessibility.md',
    'production.md',
    'react.md',
    'real-network-demo.md',
    'reference-model.md',
    'release.md',
    'schemas.md',
    'style-a-topology.md',
    'stylesheet-reference.md',
    'stylesheet.md',
    'threat-model.md',
    'topology-model.md',
    'validate-yaml.md',
    'why-topoviewer.md',
    'tools/browser-harness.md',
    'labs/grafana-topoviewer-panel.md',
    'real-network-demo',
    'examples/real-network-demo.md',
    'examples/service-provider-network.md',
    'examples/examples-gallery.md',
    'examples/use-cases.md',
    'yaml-to-diagram/index.md',
    'embed/react.md',
    'embed/mkdocs.md',
    'embed/static-html-zensical-adapter.md',
    'zensical.md',
    'author/studio/edit-workspace.md'
  ];
  const stalePaths = new Set([
    ...legacyStalePaths,
    ...readProjectionManifest().filter((relativePath) => !currentPaths.has(relativePath))
  ]);

  let changed = false;
  for (const relativePath of stalePaths) {
    changed = removeFileIfExists(path.join(targetDocsRoot, relativePath)) || changed;
  }
  removeEmptyDirectories(targetDocsRoot);
  return changed;
}

const contentPages = canonicalContentPages();
const docsChanged = copyMarkdownDocs(contentPages);
const prunedStale = pruneStaleContentPages(contentPages);
const manifestChanged = writeProjectionManifest(contentPages);
const changed = docsChanged || prunedStale || manifestChanged;
console.log(changed ? `synced docs site into ${docsRoot}` : `docs site already synced at ${docsRoot}`);
