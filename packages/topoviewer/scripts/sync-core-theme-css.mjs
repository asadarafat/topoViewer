import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const tokenPath = resolve(packageRoot, 'src/core/themeTokens.json');
const stylesheetPath = resolve(packageRoot, 'src/styles.css');
const startMarker = '/* topoviewer-theme-tokens:start */';
const endMarker = '/* topoviewer-theme-tokens:end */';
const checkOnly = process.argv.includes('--check');

const tokens = JSON.parse(await readFile(tokenPath, 'utf8'));

function declarations(values, indent = '  ') {
  return Object.entries(tokens.cssVariables)
    .map(([token, variable]) => `${indent}${variable}: ${values[token]};`)
    .join('\n');
}

const generated = `${startMarker}
:root,
.topoviewer-theme-dark,
.topoviewer-theme-system {
${declarations(tokens.dark)}
  --topoviewer-region-label-bg: var(--topoviewer-surface-bg);
  --topoviewer-region-label-fg: var(--topoviewer-fg-strong);
  --topoviewer-edge-label-fg: var(--topoviewer-fg-strong);
  --topoviewer-node-shadow: 0 1px 4px var(--topoviewer-shadow-soft);
  --topoviewer-panel-shadow: 0 14px 34px var(--topoviewer-shadow-strong);
  --topoviewer-label-shadow: 0 8px 18px var(--topoviewer-shadow-strong);
  color-scheme: dark;
}

.topoviewer-theme-light {
${declarations(tokens.light)}
  color-scheme: light;
}

@media (prefers-color-scheme: light) {
  .topoviewer-theme-system {
${declarations(tokens.light, '    ')}
    color-scheme: light;
  }
}
${endMarker}`;

const stylesheet = await readFile(stylesheetPath, 'utf8');
const start = stylesheet.indexOf(startMarker);
const end = stylesheet.indexOf(endMarker);
const next = start >= 0 && end >= start
  ? `${stylesheet.slice(0, start)}${generated}${stylesheet.slice(end + endMarker.length)}`
  : `${generated}\n\n${stylesheet}`;

if (checkOnly) {
  if (next !== stylesheet) {
    console.error('[topoviewer] Generated theme CSS is stale. Run npm --workspace topoviewer run sync:theme.');
    process.exit(1);
  }
  console.log('[topoviewer] Generated theme CSS is current.');
} else {
  await writeFile(stylesheetPath, next);
  console.log('[topoviewer] Generated theme CSS updated.');
}
