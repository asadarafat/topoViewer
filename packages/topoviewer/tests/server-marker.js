const { execFileSync } = require('node:child_process');
const path = require('node:path');
const { expect } = require('@playwright/test');

const repoRoot = path.resolve(__dirname, '../../..');

function currentGitSha() {
  return execFileSync('git', ['rev-parse', '--short=12', 'HEAD'], {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore']
  }).trim();
}

async function expectCurrentServerMarker(page, expectedPackage) {
  const response = await page.request.get('/__topoviewer-test-marker.json');
  expect(response.ok(), 'served app should expose the TopoViewer test marker').toBe(true);
  const marker = await response.json();
  expect(marker).toEqual({
    package: expectedPackage,
    gitSha: currentGitSha()
  });
}

module.exports = {
  expectCurrentServerMarker
};
