import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceDir = path.join(repoRoot, 'packages/topoviewer/dist/embed');
const targetDir = path.join(repoRoot, '.artifacts/zensical-docs/assets/topoviewer');
const files = ['topoviewer-embed.css', 'topoviewer-embed.iife.js'];

if (!fs.existsSync(sourceDir)) {
  throw new Error(`Embed build directory does not exist: ${sourceDir}. Run npm run build first.`);
}

fs.mkdirSync(targetDir, { recursive: true });

for (const file of files) {
  const source = path.join(sourceDir, file);
  const target = path.join(targetDir, file);
  if (!fs.existsSync(source)) {
    throw new Error(`Expected embed asset is missing: ${source}`);
  }
  fs.copyFileSync(source, target);
  console.log(`synced ${path.relative(repoRoot, source)} -> ${path.relative(repoRoot, target)}`);
}
