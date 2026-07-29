import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const repositoryRoot = path.resolve(import.meta.dirname, '..');
const desktopRoot = path.join(repositoryRoot, 'apps', 'topoviewer-studio-desktop');
const goMod = await readFile(path.join(desktopRoot, 'go.mod'), 'utf8');
const match = goMod.match(/^\s*(?:require\s+)?github\.com\/wailsapp\/wails\/v2\s+(v2\.\d+\.\d+)\s*$/m);

if (!match) {
  console.error('[topoviewer] Desktop go.mod must pin one stable Wails v2 version.');
  process.exit(1);
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: node scripts/run-desktop-wails.mjs <wails arguments>');
  process.exit(1);
}

const result = spawnSync(
  'go',
  ['run', `github.com/wailsapp/wails/v2/cmd/wails@${match[1]}`, ...args],
  {
    cwd: desktopRoot,
    encoding: 'utf8',
    stdio: 'inherit'
  }
);

if (result.error) {
  console.error(`[topoviewer] Could not execute the pinned Wails CLI: ${result.error.message}`);
  process.exit(1);
}
process.exit(result.status ?? 1);
