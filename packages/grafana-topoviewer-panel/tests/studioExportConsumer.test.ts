import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { describe, expect, it } from 'vitest';
import { compileTopoGraph, composeTopoViewerDocument, type TopoDocument } from 'topoviewer';
import { createRuntimeModel } from '../src/runtimeModel';

const fixtureRoot = path.resolve(import.meta.dirname, '../../topoviewer-studio/tests/fixtures/portable-consumer');

function fixture(name: string) {
  return fs.readFileSync(path.join(fixtureRoot, name), 'utf8');
}

function semanticHash(document: TopoDocument) {
  const graph = compileTopoGraph(document, ['physical']);
  const value = JSON.stringify({
    edges: graph.edges.map((edge) => edge.id).sort(),
    nodes: graph.nodes.map((node) => node.id).sort()
  });
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

describe('Studio export Grafana consumer', () => {
  it('renders the portable bundle without semantic graph drift', () => {
    const topologyYaml = fixture('topology.yaml');
    const stylesheetYaml = fixture('stylesheet.yaml');
    const mapperYaml = fixture('mapper.yaml');
    const expected = composeTopoViewerDocument(
      yaml.load(topologyYaml) as TopoDocument,
      yaml.load(stylesheetYaml) as TopoDocument
    );
    const model = createRuntimeModel({
      sourceMode: 'mountedBundle',
      mountedBundle: { selectedBundleId: 'studio-portable-consumer' }
    }, {
      bundle: {
        id: 'studio-portable-consumer',
        name: 'Studio Portable Consumer',
        root: '/etc/topoviewer/bundles/studio-portable-consumer',
        topologyPath: '/etc/topoviewer/bundles/studio-portable-consumer/studio-portable-consumer.topo.tv.yaml',
        stylesheetPath: '/etc/topoviewer/bundles/studio-portable-consumer/studio-portable-consumer.style.tv.yaml',
        mapperPath: '/etc/topoviewer/bundles/studio-portable-consumer/studio-portable-consumer.mapper.tv.yaml'
      },
      diagnostics: [],
      mapperYaml,
      stylesheetYaml,
      topologyYaml
    });

    expect(model.diagnostics).toEqual([]);
    expect(model.topoviewerProps?.document).toBe(model.document);
    expect(model.document && semanticHash(model.document)).toBe(semanticHash(expected));
  });
});

