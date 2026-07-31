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
  const expectedMarker = {
    package: expectedPackage,
    gitSha: currentGitSha()
  };

  await expect
    .poll(
      async () => {
        try {
          const response = await page.request.get('/__topoviewer-test-marker.json');
          const body = await response.text();
          if (!response.ok()) return { body, status: response.status() };

          try {
            return JSON.parse(body);
          } catch {
            return { body };
          }
        } catch (error) {
          return { transportError: error instanceof Error ? error.message : String(error) };
        }
      },
      {
        intervals: [100, 250, 500],
        message: 'served app should expose the current TopoViewer test marker',
        timeout: 5_000
      }
    )
    .toEqual(expectedMarker);
}
