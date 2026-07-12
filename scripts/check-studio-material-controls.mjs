import { readdirSync, readFileSync } from 'node:fs';
import { extname, join, relative, sep } from 'node:path';

const root = process.cwd();
const sourceRoot = join(root, 'packages', 'topoviewer-studio', 'src');
const allowedRoot = join(sourceRoot, 'ui') + sep;
const rawInteractiveElement = /<(button|input|select|textarea|dialog|details|summary)\b[^>]*>/gs;
const directMaterialImport = /from\s+['"]@mui\/material(?:\/[^'"]*)?['"]/g;
const failures = [];

function files(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? files(path) : extname(path) === '.tsx' ? [path] : [];
  });
}

for (const file of files(sourceRoot)) {
  const source = readFileSync(file, 'utf8');
  const path = relative(root, file);
  for (const match of source.matchAll(rawInteractiveElement)) {
    const browserOwnedInput = file.startsWith(allowedRoot)
      && match[1] === 'input'
      && /\btype=["'](?:color|file)["']/.test(match[0]);
    if (browserOwnedInput) continue;
    failures.push(`${path}:${source.slice(0, match.index).split('\n').length} owns raw <${match[1]}>; use a Studio UI control.`);
  }
  if (file.startsWith(allowedRoot)) continue;
  for (const match of source.matchAll(directMaterialImport)) {
    failures.push(`${path}:${source.slice(0, match.index).split('\n').length} imports Material directly; use packages/topoviewer-studio/src/ui.`);
  }
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log('Studio Material control ownership check passed.');
}
