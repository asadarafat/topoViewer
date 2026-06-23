import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const packageDocsRoot = path.join(repoRoot, 'packages/topoviewer/docs');
const docsRoot = path.resolve(process.env.TOPOVIEWER_DOCS_ROOT || path.join(repoRoot, 'docs'));
const targetDocsRoot = path.join(docsRoot, 'topoviewer');

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

function copyMarkdownDocs() {
  let changed = false;
  for (const entry of fs.readdirSync(packageDocsRoot, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
    const source = path.join(packageDocsRoot, entry.name);
    const target = path.join(targetDocsRoot, entry.name);
    changed = writeTextIfChanged(target, readText(source)) || changed;
  }
  return changed;
}

const index = `# TopoViewer

TopoViewer turns YAML topology facts and selector stylesheets into interactive network, infrastructure, and service-topology diagrams.

![TopoViewer YAML to rendered network diagram](assets/topoviewer-yaml-to-diagram.png)

It keeps graph facts in YAML, visual policy in selector stylesheets, and renderer behavior behind testable package boundaries.

## Start Here

- [Why TopoViewer?](topoviewer/why-topoviewer.md)
- [YAML to diagram](topoviewer/yaml-to-diagram/index.md)
- [Real network demo](topoviewer/real-network-demo.md)
- [Integration roadmap](topoviewer/integration-roadmap.md)
- [Authoring model](topoviewer/authoring.md)
- [Reference model](topoviewer/reference-model.md)
- [Stylesheet](topoviewer/stylesheet.md)
- [Topology attention](topoviewer/attention.md)
- [MkDocs embed](topoviewer/mkdocs.md)
- [Zensical adapter](topoviewer/zensical.md)
- [Production hardening](topoviewer/production.md)
- [Attention examples](topoviewer/reference/attention/index.md)

## Packages

| Package | Runtime | Install |
|---|---|---|
| \`topoviewer\` | React/browser/npm | \`npm install topoviewer\` |
| \`mkdocs-topoviewer\` | MkDocs/Python | \`pip install mkdocs-topoviewer\` |

## Examples

The feature examples are generated from \`packages/topoviewer/examples/test-cases\`. Each example is both documentation and a Playwright-backed test fixture.
`;

const docsChanged = copyMarkdownDocs();
const indexChanged = writeTextIfChanged(path.join(docsRoot, 'index.md'), index);
const changed = docsChanged || indexChanged;
console.log(changed ? `synced docs site into ${docsRoot}` : `docs site already synced at ${docsRoot}`);
