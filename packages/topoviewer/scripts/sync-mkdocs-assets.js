import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const sourceDir = path.join(projectRoot, 'dist', 'embed');
const mkdocsPackageRoot = path.resolve(projectRoot, '..', 'mkdocs-topoviewer');
const packageAssetDir = path.join(mkdocsPackageRoot, 'mkdocs_topoviewer', 'assets');

const files = ['topoviewer-embed.css', 'topoviewer-embed.iife.js'];

if (!fs.existsSync(sourceDir)) {
  throw new Error(`Embed build directory does not exist: ${sourceDir}. Run npm run build first.`);
}

if (!fs.existsSync(path.join(mkdocsPackageRoot, 'pyproject.toml'))) {
  throw new Error(
    [
      `MkDocs plugin package was not found at: ${mkdocsPackageRoot}`,
      'Expected monorepo layout:',
      '  topoviewer/',
      '    packages/',
      '      topoviewer/',
      '      mkdocs-topoviewer/'
    ].join('\n')
  );
}

fs.mkdirSync(packageAssetDir, { recursive: true });

for (const file of files) {
  const source = path.join(sourceDir, file);
  const target = path.join(packageAssetDir, file);
  if (!fs.existsSync(source)) {
    throw new Error(`Expected embed asset is missing: ${source}`);
  }
  fs.copyFileSync(source, target);
  console.log(`synced ${path.relative(projectRoot, source)} -> ${path.relative(projectRoot, target)}`);
}
