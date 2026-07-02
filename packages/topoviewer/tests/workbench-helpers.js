const fs = require('node:fs');
const path = require('node:path');
const yaml = require('js-yaml');

const canonicalTopologyPath = path.resolve(
  __dirname,
  '../content/examples/integration/complete-network-demo/topology.yaml'
);

function readCanonicalTopology() {
  return yaml.load(fs.readFileSync(canonicalTopologyPath, 'utf8')) || {};
}

const canonicalTopology = readCanonicalTopology();
const graph = canonicalTopology.graph || {};

const canonicalWorkbenchCounts = {
  nodes: (graph.nodes || []).length,
  links: (graph.links || []).length,
  paths: (graph.paths || []).length,
  edges: (graph.links || []).length + (graph.paths || []).length
};

const canonicalWorkbenchLayers = (graph.layers || [])
  .map((layer) => layer.name || layer.id)
  .filter((name) => name !== 'Diagram primitives');

const canonicalWorkbenchToggles = (canonicalTopology.toggles || [])
  .map((toggle) => toggle.name || toggle.id);
const canonicalServicesToggleName = canonicalWorkbenchToggles.find((name) => /services|child nodes/i.test(name)) || 'Show services inside nodes';

function canonicalFooterText() {
  return `Rendered ${canonicalWorkbenchCounts.nodes} nodes, ${canonicalWorkbenchCounts.links} links, ${canonicalWorkbenchCounts.paths} paths.`;
}

module.exports = {
  canonicalFooterText,
  canonicalWorkbenchCounts,
  canonicalWorkbenchLayers,
  canonicalWorkbenchToggles,
  canonicalServicesToggleName
};
