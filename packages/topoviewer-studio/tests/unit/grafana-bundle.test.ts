import { describe, expect, it } from 'vitest';
import { strFromU8, unzipSync } from 'fflate';
import { parse } from 'yaml';
import { compileTopoGraph, composeTopoViewerDocument, type TopoDocument } from 'topoviewer';
import { createStudioExportSnapshot } from '../../src/export/exportSnapshot';
import { encodeGrafanaBundle } from '../../src/export/grafanaBundle';
import { createStarterProject } from '../../src/hosts/starterProject';

function graphIdentity(document: TopoDocument) {
  const compiled = compileTopoGraph(document);
  return { edges: compiled.edges.map((edge) => edge.id), nodes: compiled.nodes.map((node) => node.id) };
}

describe('Grafana bundle export', () => {
  it('packages canonical panel files deterministically without changing graph semantics', () => {
    const project = createStarterProject({ name: 'Branch Core' });
    project.documents.mapper = { contentHash: 'mapper', kind: 'mapper', path: 'mapper.yaml', text: 'version: 1\nrules: []\n' };
    const snapshot = createStudioExportSnapshot(project, 'revision-1');
    const first = encodeGrafanaBundle(snapshot);
    const second = encodeGrafanaBundle(snapshot);
    expect(first.bytes).toEqual(second.bytes);
    const files = unzipSync(first.bytes);
    expect(Object.keys(files).sort()).toEqual(['branch-core/branch-core.mapper.tv.yaml', 'branch-core/branch-core.style.tv.yaml', 'branch-core/branch-core.topo.tv.yaml', 'branch-core/manifest.json']);
    const exported = composeTopoViewerDocument(parse(strFromU8(files['branch-core/branch-core.topo.tv.yaml'])) as TopoDocument, parse(strFromU8(files['branch-core/branch-core.style.tv.yaml'])) as TopoDocument);
    expect(graphIdentity(exported)).toEqual(graphIdentity(snapshot.project.documents.topology.text ? composeTopoViewerDocument(parse(project.documents.topology.text), parse(project.documents.stylesheet.text)) : {}));
  });

  it('rejects a project without a valid mapper', () => {
    const snapshot = createStudioExportSnapshot(createStarterProject(), 'revision-1');
    expect(() => encodeGrafanaBundle(snapshot)).toThrow(/requires mapper YAML/);
  });
});
