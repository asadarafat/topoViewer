import fs from 'node:fs';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

const root = path.resolve(import.meta.dirname, '..');
const assets = path.join(root, 'dist/webview/assets');
const extension = path.join(root, 'dist/extension.cjs');
const limits = {
  extensionBytes: 64 * 1024,
  initialCssGzipBytes: 20 * 1024,
  initialJsGzipBytes: 300 * 1024
};

function required(file) {
  if (!fs.existsSync(file)) throw new Error(`Required VS Code Studio artifact is missing: ${path.relative(root, file)}`);
  return fs.readFileSync(file);
}

const entry = required(path.join(assets, 'index.js'));
const css = required(path.join(assets, 'index.css'));
const extensionBytes = required(extension).byteLength;
const metrics = {
  extensionBytes,
  initialCssGzipBytes: gzipSync(css).byteLength,
  initialJsGzipBytes: gzipSync(entry).byteLength,
  lazyEditorChunk: fs.readdirSync(assets).some((name) => name === 'MonacoYamlEditor.js'),
  lazyMapperChunk: fs.readdirSync(assets).some((name) => name === 'MapperWorkspace.js')
};

const failures = [];
for (const [name, limit] of Object.entries(limits)) {
  if (metrics[name] > limit) failures.push(`${name} is ${metrics[name]} bytes; budget is ${limit}.`);
}
if (!metrics.lazyEditorChunk) failures.push('Monaco YAML editor is not isolated in a lazy chunk.');
if (!metrics.lazyMapperChunk) failures.push('Mapper workspace is not isolated in a lazy chunk.');

console.log(JSON.stringify({ limits, metrics }, null, 2));
if (failures.length) throw new Error(`VS Code Studio bundle budget failed:\n- ${failures.join('\n- ')}`);
