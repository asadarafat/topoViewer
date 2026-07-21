import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const canonicalTopologyPath = path.resolve(
  __dirname,
  '../content/examples/integration/complete-network-demo/topology.yaml'
);

function readCanonicalTopology() {
  return yaml.load(fs.readFileSync(canonicalTopologyPath, 'utf8')) || {};
}

const canonicalTopology = readCanonicalTopology();
const graph = canonicalTopology.graph || {};

export const canonicalWorkbenchCounts = {
  nodes: (graph.nodes || []).length,
  links: (graph.links || []).length,
  paths: (graph.paths || []).length,
  edges: (graph.links || []).length + (graph.paths || []).length
};

export const canonicalWorkbenchLayers = (graph.layers || [])
  .map((layer) => layer.labels?.name || layer.id)
  .filter((name) => name !== 'Diagram primitives');

export const canonicalWorkbenchToggles = (canonicalTopology.toggles || [])
  .map((toggle) => toggle.labels?.name || toggle.id);
export const canonicalServicesToggleName = canonicalWorkbenchToggles.find((name) => /services|child nodes/i.test(name)) || 'Show services inside nodes';

export function canonicalFooterText() {
  return `Rendered ${canonicalWorkbenchCounts.nodes} nodes, ${canonicalWorkbenchCounts.links} links, ${canonicalWorkbenchCounts.paths} paths.`;
}
