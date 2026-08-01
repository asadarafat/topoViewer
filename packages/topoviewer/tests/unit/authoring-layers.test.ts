import { describe, expect, it } from 'vitest';
import {
  authoringLayerReferenceCount,
  authoringLayerReferences,
  createAuthoringLayer,
  planAuthoringLayerDeletion,
  planAuthoringLayerMembership,
  planAuthoringLayerRename,
  planAuthoringLayerReorder
} from '../../src/authoring';
import type { TopoDocument } from '../../src';

function topology(): TopoDocument {
  return {
    graph: {
      layers: [
        { id: 'physical', labels: { name: 'Physical' } },
        { id: 'services', labels: { name: 'Services' } },
        { id: 'operations', labels: { name: 'Operations' } }
      ],
      nodes: [
        { id: 'A', layers: ['physical'], position: [40, 40] },
        { id: 'B', layers: ['physical', 'services'], position: [220, 40] }
      ],
      links: [{ id: 'A-B', source: 'A', target: 'B', layers: ['physical'] }],
      paths: [{ id: 'service-path', sequence: ['A', 'B'], layers: ['services'] }],
      regions: [{ id: 'site', members: ['A', 'B'], layers: ['physical'] }]
    },
    diagram: {
      shapes: [{ id: 'boundary', layers: ['physical'], position: [20, 20] }],
      callouts: [{ id: 'note', layers: ['physical'], position: [40, 180] }],
      connectors: [{ id: 'note-link', layers: ['physical'], source: 'note', target: 'A' }]
    }
  };
}

describe('shared layer authoring plans', () => {
  it('creates deterministic collision-free layer IDs', () => {
    const document = topology();
    expect(createAuthoringLayer(document, 'Failure Domain')).toEqual({
      id: 'failure-domain',
      labels: { name: 'Failure Domain' }
    });
    document.graph?.layers?.push({ id: 'failure-domain' });
    expect(createAuthoringLayer(document, 'Failure Domain').id).toBe('failure-domain-2');
  });

  it('renames and reorders layers without changing their stable IDs', () => {
    expect(planAuthoringLayerRename(topology(), 'physical', '  Fabric  ').updates).toEqual([
      expect.objectContaining({ path: ['graph', 'layers', 0, 'labels', 'name'], value: 'Fabric' })
    ]);
    const reordered = planAuthoringLayerReorder(topology(), 'operations', 0).updates[0].value;
    expect(reordered).toEqual([
      { id: 'operations', labels: { name: 'Operations' } },
      { id: 'physical', labels: { name: 'Physical' } },
      { id: 'services', labels: { name: 'Services' } }
    ]);
  });

  it('assigns selected objects and refuses to remove their final layer', () => {
    const document = topology();
    const assigned = planAuthoringLayerMembership(document, [{ id: 'A', kind: 'node' }], 'services', true);
    expect(assigned.updates).toContainEqual(expect.objectContaining({
      path: ['graph', 'nodes', 0, 'layers'],
      value: ['physical', 'services']
    }));
    expect(() => planAuthoringLayerMembership(
      document,
      [{ id: 'A', kind: 'node' }],
      'physical',
      false
    )).toThrow(/at least one layer/);
  });

  it('reports references and requires an explicit replacement before deletion', () => {
    const document = topology();
    expect(authoringLayerReferenceCount(document, 'physical')).toBe(7);
    expect(authoringLayerReferenceCount(document, 'missing')).toBe(0);
    expect(authoringLayerReferences(document, 'physical')).toEqual(expect.arrayContaining([
      { id: 'A', kind: 'node' },
      { id: 'A-B', kind: 'link' },
      { id: 'site', kind: 'region' },
      { id: 'boundary', kind: 'shape' },
      { id: 'note', kind: 'callout' }
    ]));
    expect(() => planAuthoringLayerDeletion(document, 'physical')).toThrow(/referenced by 7 objects/);
  });

  it('migrates every graph and diagram reference before deleting a layer', () => {
    const plan = planAuthoringLayerDeletion(topology(), 'physical', 'operations');
    expect(plan.removals).toEqual([
      expect.objectContaining({
        path: ['graph', 'layers', 0],
        selection: { id: 'physical', kind: 'layer' }
      })
    ]);
    expect(plan.updates).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: ['graph', 'nodes', 0, 'layers'], value: ['operations'] }),
      expect.objectContaining({ path: ['graph', 'nodes', 1, 'layers'], value: ['operations', 'services'] }),
      expect.objectContaining({ path: ['graph', 'links', 0, 'layers'], value: ['operations'] }),
      expect.objectContaining({ path: ['graph', 'regions', 0, 'layers'], value: ['operations'] }),
      expect.objectContaining({ path: ['diagram', 'shapes', 0, 'layers'], value: ['operations'] }),
      expect.objectContaining({ path: ['diagram', 'callouts', 0, 'layers'], value: ['operations'] }),
      expect.objectContaining({ path: ['diagram', 'connectors', 0, 'layers'], value: ['operations'] })
    ]));
  });

  it('refuses to delete the final declared layer', () => {
    const document = topology();
    document.graph!.layers = [{ id: 'physical', labels: { name: 'Physical' } }];
    expect(() => planAuthoringLayerDeletion(document, 'physical', 'physical')).toThrow(/final topology layer/);
  });
});
