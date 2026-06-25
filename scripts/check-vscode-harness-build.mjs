import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const harnessSite = path.join(repoRoot, 'site/harness');

const requiredFiles = [
  'index.html',
  'fixtures/index.json'
];

const expectedFixtureIds = [
  'layered-network',
  'clos-2spine-4leaf',
  'insert-workflow',
  'attention-workflow',
  'inspector-workflow',
  'dense-links',
  'region-label-placement'
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
for (const needle of ['/topoviewer/harness/assets/', 'type="module"']) {
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
for (const fixture of fixtures) {
  for (const fileName of ['topology.yaml', 'stylesheet.yaml']) {
    const fixtureFile = path.join(harnessSite, 'fixtures', fixture.id, fileName);
    if (!fs.existsSync(fixtureFile)) {
      fail(`VS Code harness fixture "${fixture.id}" is missing ${fileName}.`);
    }
  }
}

for (const fixtureId of expectedFixtureIds) {
  if (!fixtures.some((fixture) => fixture.id === fixtureId)) {
    fail(`VS Code harness fixture index is missing ${fixtureId}.`);
  }
}

console.log(`VS Code harness build inspection passed: ${path.relative(repoRoot, harnessSite)}`);
