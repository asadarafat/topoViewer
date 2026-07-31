import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const stylesheetPath = resolve(packageRoot, 'src/styles.css');
const rendererBoundaryPaths = [
  resolve(packageRoot, 'src/components/TopoViewer.tsx'),
  resolve(packageRoot, 'src/components/TopoViewerRenderBoundary.tsx'),
  resolve(packageRoot, 'src/components/runtimePresentation.ts'),
  resolve(packageRoot, 'src/embed.tsx')
];
const startMarker = '/* topoviewer-theme-tokens:start */';
const endMarker = '/* topoviewer-theme-tokens:end */';
const colorLiteral = /#[\da-f]{3,8}\b|\brgba?\([^)]*\)|\bhsla?\([^)]*\)/giu;

const stylesheet = await readFile(stylesheetPath, 'utf8');
const start = stylesheet.indexOf(startMarker);
const end = stylesheet.indexOf(endMarker);

if (start < 0 || end < start) {
  console.error('[topoviewer] Generated theme token markers are missing from src/styles.css.');
  process.exit(1);
}

const ownedCss = `${stylesheet.slice(0, start)}${stylesheet.slice(end + endMarker.length)}`;
function colorViolations(source, file) {
  return source.split('\n').flatMap((line, index) => {
    const matches = [...line.matchAll(colorLiteral)];
    return matches.map((match) => `${file}:${index + 1}:${match.index + 1} ${match[0]}`);
  });
}

const violations = colorViolations(ownedCss, 'src/styles.css');
for (const path of rendererBoundaryPaths) {
  const source = await readFile(path, 'utf8');
  violations.push(...colorViolations(source, path.slice(packageRoot.length + 1)));
}

if (violations.length > 0) {
  console.error('[topoviewer] Renderer chrome contains color literals outside the generated theme block:');
  console.error(violations.join('\n'));
  process.exit(1);
}

console.log('[topoviewer] Renderer chrome colors are owned by the canonical theme tokens.');
