import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const contentPagesRoot = path.join(repoRoot, 'packages/topoviewer/content/pages');
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
  for (const entry of fs.readdirSync(contentPagesRoot, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
    const source = path.join(contentPagesRoot, entry.name);
    const target = path.join(targetDocsRoot, entry.name);
    changed = writeTextIfChanged(target, readText(source)) || changed;
  }
  return changed;
}

const docsChanged = copyMarkdownDocs();
const changed = docsChanged;
console.log(changed ? `synced docs site into ${docsRoot}` : `docs site already synced at ${docsRoot}`);
