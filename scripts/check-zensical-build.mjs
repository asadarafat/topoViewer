import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import yaml from 'js-yaml';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const zensicalSite = path.join(repoRoot, 'site/zensical');
const zensicalDocsRoot = path.join(repoRoot, '.artifacts/zensical-docs');
const adapterPage = path.join(zensicalSite, 'topoviewer/zensical-embed/index.html');
const mirroredExamplePage = path.join(zensicalSite, 'topoviewer/reference/attention/object-focus/index.html');
const realNetworkDemoPage = path.join(zensicalSite, 'topoviewer/real-network-demo/index.html');
const whyTopoViewerPage = path.join(zensicalSite, 'topoviewer/why-topoviewer/index.html');
const mirroredExampleSource = path.join(zensicalDocsRoot, 'topoviewer/reference/attention/object-focus/index.md');
const zensicalCssPath = path.join(zensicalSite, 'assets/topoviewer/topoviewer-zensical.css');
const requiredFiles = [
  'index.html',
  'topoviewer/zensical-embed/index.html',
  'topoviewer/index.html',
  'topoviewer/real-network-demo/index.html',
  'topoviewer/why-topoviewer/index.html',
  'assets/topoviewer-yaml-to-diagram.png',
  'topoviewer/reference/attention/object-focus/index.html',
  'assets/topoviewer/topoviewer-embed.css',
  'assets/topoviewer/topoviewer-embed.iife.js',
  'assets/topoviewer/topoviewer-zensical.css',
  'assets/topoviewer/topoviewer-zensical.js',
  'assets/topoviewer/examples/graph/basic/topology.yaml',
  'assets/topoviewer/examples/graph/basic/stylesheet.yaml',
  'assets/topoviewer/examples/integration/real-network-underlay/topology.yaml',
  'assets/topoviewer/examples/integration/real-network-underlay/stylesheet.yaml',
  'assets/topoviewer/examples/integration/real-network-transport-layer/topology.yaml',
  'assets/topoviewer/examples/integration/real-network-transport-layer/stylesheet.yaml',
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
if (!adapterHtml.includes('--topoviewer-width: 100%;')) {
  fail('Zensical adapter page does not use the standard article-width TopoViewer default.');
}

const zensicalCss = fs.readFileSync(zensicalCssPath, 'utf8');
for (const needle of [
  '.md-typeset .topoviewer-figure',
  'width: var(--topoviewer-width, 100%)',
  'max-width: 100%',
  'min-height: 420px'
]) {
  if (!zensicalCss.includes(needle)) {
    fail(`Zensical TopoViewer CSS does not include expected viewport sizing rule: ${needle}`);
  }
}

const zensicalJs = fs.readFileSync(path.join(zensicalSite, 'assets/topoviewer/topoviewer-zensical.js'), 'utf8');
for (const needle of [
  'MutationObserver',
  'window.zensical.document$',
  'requestAnimationFrame',
  "window.dispatchEvent(new Event('resize'))"
]) {
  if (!zensicalJs.includes(needle)) {
    fail(`Zensical TopoViewer adapter does not include expected lifecycle hook: ${needle}`);
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

const realNetworkHtml = fs.readFileSync(realNetworkDemoPage, 'utf8');
for (const needle of [
  'class="topoviewer-embed"',
  'data-topology="../../assets/topoviewer/examples/integration/real-network-underlay/topology.yaml"',
  'data-stylesheet="../../assets/topoviewer/examples/integration/real-network-underlay/stylesheet.yaml"',
  'data-selected-layer-ids="[&quot;underlay&quot;]"',
  'data-topology="../../assets/topoviewer/examples/integration/real-network-bgp/topology.yaml"',
  'data-selected-layer-ids="[&quot;underlay&quot;,&quot;bgp&quot;]"',
  'data-topology="../../assets/topoviewer/examples/integration/real-network-transport-layer/topology.yaml"',
  'data-stylesheet="../../assets/topoviewer/examples/integration/real-network-transport-layer/stylesheet.yaml"',
  'data-selected-layer-ids="[&quot;underlay&quot;,&quot;bgp&quot;,&quot;transport&quot;]"',
  'data-topology="../../assets/topoviewer/examples/integration/real-network-service-path/topology.yaml"',
  'data-selected-layer-ids="[&quot;underlay&quot;,&quot;bgp&quot;,&quot;transport&quot;,&quot;service&quot;]"',
  'data-topology="../../assets/topoviewer/examples/integration/real-network-failure-view/topology.yaml"',
  'data-selected-layer-ids="[&quot;underlay&quot;,&quot;bgp&quot;,&quot;transport&quot;,&quot;service&quot;,&quot;operations&quot;]"',
  'data-attention="{&quot;query&quot;:{&quot;pathIds&quot;:[&quot;payments-primary&quot;],&quot;mode&quot;:&quot;dim-context&quot;}}"'
]) {
  if (!realNetworkHtml.includes(needle)) {
    fail(`Zensical real network demo page does not include expected content: ${needle}`);
  }
}
if (realNetworkHtml.includes('data-topology="../assets/topoviewer/examples/')) {
  fail('Zensical real network demo page has root-relative embed paths computed from the Markdown file instead of the generated page directory.');
}

const whyTopoViewerHtml = fs.readFileSync(whyTopoViewerPage, 'utf8');
for (const needle of [
  '<img alt="YAML to rendered network diagram" src="../../assets/topoviewer-yaml-to-diagram.png"',
]) {
  if (!whyTopoViewerHtml.includes(needle)) {
    fail(`Zensical Why TopoViewer page does not include expected inline image: ${needle}`);
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

const topologyPath = path.join(zensicalDocsRoot, 'assets/topoviewer/examples/attention/object-focus/topology.yaml');
const stylesheetPath = path.join(zensicalDocsRoot, 'assets/topoviewer/examples/attention/object-focus/stylesheet.yaml');
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
