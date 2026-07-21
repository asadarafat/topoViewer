import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect } from '@playwright/test';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../..');

function currentGitSha() {
  return execFileSync('git', ['rev-parse', '--short=12', 'HEAD'], {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore']
  }).trim();
}

export async function expectCurrentServerMarker(page, expectedPackage) {
  const response = await page.request.get('/__topoviewer-test-marker.json');
  expect(response.ok(), 'served app should expose the TopoViewer test marker').toBe(true);
  const marker = await response.json();
  expect(marker).toEqual({
    package: expectedPackage,
    gitSha: currentGitSha()
  });
}
