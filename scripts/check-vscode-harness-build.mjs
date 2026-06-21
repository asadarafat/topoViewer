import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const harnessSite = path.join(repoRoot, 'site/harness');

const requiredFiles = [
  'index.html',
  'fixtures/index.json',
  'fixtures/layered-network/topology.yaml',
  'fixtures/layered-network/stylesheet.yaml',
  'fixtures/insert-workflow/topology.yaml',
  'fixtures/attention-workflow/topology.yaml',
  'fixtures/inspector-workflow/topology.yaml',
  'fixtures/dense-links/topology.yaml',
  'fixtures/region-label-placement/topology.yaml'
];

function fail(message) {
  console.error(message);
  process.exit(1);
}

for (const file of requiredFiles) {
  const absolute = path.join(harnessSite, file);
  if (!fs.existsSync(absolute)) {
    fail(`VS Code harness build is missing required file: ${path.relative(repoRoot, absolute)}`);
  }
}

const indexHtml = fs.readFileSync(path.join(harnessSite, 'index.html'), 'utf8');
for (const needle of ['/topoViewer/harness/assets/', 'type="module"']) {
  if (!indexHtml.includes(needle)) {
    fail(`VS Code harness index.html does not include expected content: ${needle}`);
  }
}

const assetsDir = path.join(harnessSite, 'assets');
const assets = fs.existsSync(assetsDir) ? fs.readdirSync(assetsDir) : [];
if (!assets.some((file) => file.endsWith('.js'))) {
  fail('VS Code harness build is missing a JavaScript asset.');
}
if (!assets.some((file) => file.endsWith('.css'))) {
  fail('VS Code harness build is missing a CSS asset.');
}

const fixtures = JSON.parse(fs.readFileSync(path.join(harnessSite, 'fixtures/index.json'), 'utf8'));
for (const fixtureId of ['layered-network', 'insert-workflow', 'attention-workflow', 'inspector-workflow', 'dense-links', 'region-label-placement']) {
  if (!fixtures.some((fixture) => fixture.id === fixtureId)) {
    fail(`VS Code harness fixture index is missing ${fixtureId}.`);
  }
}

console.log(`VS Code harness build inspection passed: ${path.relative(repoRoot, harnessSite)}`);
