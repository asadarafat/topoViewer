import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outDir = path.join(root, 'site/studio');
const indexFile = path.join(outDir, 'index.html');
const manifestFile = path.join(outDir, '.vite/manifest.json');

if (!fs.existsSync(indexFile)) {
  console.error('Studio build is missing site/studio/index.html.');
  process.exit(1);
}
if (!fs.existsSync(manifestFile)) {
  console.error('Studio build is missing the Vite manifest required for lazy-boundary inspection.');
  process.exit(1);
}

const index = fs.readFileSync(indexFile, 'utf8');
if (!index.includes('/topoviewer/studio/assets/')) {
  console.error('Studio build does not use the expected /topoviewer/studio asset base.');
  process.exit(1);
}

const assetsDir = path.join(outDir, 'assets');
const assets = fs.existsSync(assetsDir) ? fs.readdirSync(assetsDir) : [];
const javascript = assets.filter((file) => file.endsWith('.js'));
if (javascript.length === 0) {
  console.error('Studio build contains no JavaScript entry.');
  process.exit(1);
}

const forbidden = ['acquireVsCodeApi', 'node:fs', 'vscode-topoviewer/src'];
const violations = [];
for (const file of javascript) {
  const source = fs.readFileSync(path.join(assetsDir, file), 'utf8');
  for (const token of forbidden) {
    if (source.includes(token)) violations.push(`${file}: ${token}`);
  }
}

const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
const entry = Object.values(manifest).find((item) => item.isEntry && item.src === 'index.html');
if (!entry) {
  console.error('Studio build manifest has no index.html entry.');
  process.exit(1);
}

const initialKeys = new Set();
function collectInitial(key) {
  if (initialKeys.has(key)) return;
  initialKeys.add(key);
  for (const imported of manifest[key]?.imports || []) collectInitial(imported);
}
const entryKey = Object.entries(manifest).find(([, item]) => item === entry)?.[0];
if (!entryKey) {
  console.error('Studio build manifest entry key is missing.');
  process.exit(1);
}
collectInitial(entryKey);
const initialFiles = [...initialKeys].map((key) => manifest[key]?.file).filter(Boolean);
const monacoKeys = Object.entries(manifest)
  .filter(([key, item]) => /MonacoYamlEditor|monaco-editor|editor\.api/i.test(`${key} ${item.src || ''} ${item.file}`))
  .map(([key]) => key);
const monacoFiles = monacoKeys.map((key) => manifest[key].file);
if (monacoFiles.length === 0) {
  console.error('Studio build contains no separately identifiable Monaco editor chunk.');
  process.exit(1);
}
const eagerMonaco = monacoKeys.filter((key) => initialKeys.has(key)).map((key) => manifest[key].file);
if (eagerMonaco.length > 0) {
  console.error(`Studio initial bundle eagerly includes Monaco: ${eagerMonaco.join(', ')}`);
  process.exit(1);
}

if (violations.length > 0) {
  console.error(`Studio browser build contains forbidden host assumptions:\n${violations.join('\n')}`);
  process.exit(1);
}

console.log(
  `Studio build inspection passed: ${javascript.length} JavaScript asset(s), `
  + `${initialFiles.length} initial chunk(s), ${monacoFiles.length} lazy Monaco chunk(s).`
);
