import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import yaml from 'js-yaml';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const zensicalSite = path.join(repoRoot, 'site/zensical');
const adapterPage = path.join(zensicalSite, 'examples/topoviewer/index.html');
const mirroredExamplePage = path.join(zensicalSite, 'topoviewer/reference/attention/object-focus/index.html');
const mirroredExampleSource = path.join(repoRoot, 'docs-zensical/topoviewer/reference/attention/object-focus/index.md');
const requiredFiles = [
  'index.html',
  'examples/topoviewer/index.html',
  'topoviewer/index.html',
  'topoviewer/reference/attention/object-focus/index.html',
  'assets/topoviewer/topoviewer-embed.css',
  'assets/topoviewer/topoviewer-embed.iife.js',
  'assets/topoviewer/topoviewer-zensical.css',
  'assets/topoviewer/topoviewer-zensical.js',
  'assets/topoviewer/examples/graph/basic/topology.yaml',
  'assets/topoviewer/examples/graph/basic/stylesheet.yaml',
  'assets/topoviewer/examples/attention/object-focus/topology.yaml',
  'assets/topoviewer/examples/attention/object-focus/stylesheet.yaml'
];

function fail(message) {
  console.error(message);
  process.exit(1);
}

for (const file of requiredFiles) {
  const absolute = path.join(zensicalSite, file);
  if (!fs.existsSync(absolute)) {
    fail(`Zensical build is missing required file: ${path.relative(repoRoot, absolute)}`);
  }
}

const adapterHtml = fs.readFileSync(adapterPage, 'utf8');
for (const needle of [
  'topoviewer-embed.css',
  'topoviewer-embed.iife.js',
  'topoviewer-zensical.js',
  'class="topoviewer-embed"',
  'data-topology="../../assets/topoviewer/examples/graph/basic/topology.yaml"',
  'data-stylesheet="../../assets/topoviewer/examples/graph/basic/stylesheet.yaml"'
]) {
  if (!adapterHtml.includes(needle)) {
    fail(`Zensical adapter page does not include expected content: ${needle}`);
  }
}

const mirroredHtml = fs.readFileSync(mirroredExamplePage, 'utf8');
for (const needle of [
  'class="topoviewer-embed"',
  'data-topology="../../../../assets/topoviewer/examples/attention/object-focus/topology.yaml"',
  'data-stylesheet="../../../../assets/topoviewer/examples/attention/object-focus/stylesheet.yaml"'
]) {
  if (!mirroredHtml.includes(needle)) {
    fail(`Mirrored Zensical TopoViewer page does not include expected content: ${needle}`);
  }
}

const mirroredSource = fs.readFileSync(mirroredExampleSource, 'utf8');
for (const needle of ['graph:', 'stylesheet:']) {
  if (!mirroredSource.includes(needle)) {
    fail(`Generated Zensical source page does not include expanded YAML content: ${needle}`);
  }
}
if (mirroredSource.includes('--8<--')) {
  fail('Generated Zensical source page still contains an unexpanded snippet directive.');
}

const topologyPath = path.join(repoRoot, 'docs-zensical/assets/topoviewer/examples/attention/object-focus/topology.yaml');
const stylesheetPath = path.join(repoRoot, 'docs-zensical/assets/topoviewer/examples/attention/object-focus/stylesheet.yaml');
const topology = yaml.load(fs.readFileSync(topologyPath, 'utf8')) || {};
const stylesheet = yaml.load(fs.readFileSync(stylesheetPath, 'utf8')) || {};
const { validateTopoDocument, lintTopoDocument } = await import(pathToFileURL(path.join(repoRoot, 'packages/topoviewer/dist/topoviewer.mjs')));
const documentSpec = validateTopoDocument({
  ...topology,
  ...stylesheet,
  graph: topology.graph || {},
  toggles: topology.toggles || stylesheet.toggles || []
}, 'Zensical TopoViewer example');
const issues = lintTopoDocument(documentSpec).filter((issue) => issue.severity === 'error');
if (issues.length) {
  fail(`Zensical TopoViewer example has semantic errors:\n${issues.map((issue) => `- ${issue.path}: ${issue.message}`).join('\n')}`);
}

console.log(`Zensical build inspection passed: ${path.relative(repoRoot, zensicalSite)}`);
