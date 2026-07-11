import { describe, expect, it } from 'vitest';
import {
  copyAuthoringSelection,
  createAuthoringCallout,
  createAuthoringLink,
  authoringObjectDisplayName,
  createAuthoringNode,
  createAuthoringPath,
  createAuthoringRegion,
  createAuthoringShape,
  defaultLayerId,
  planAuthoringAlignment,
  planAuthoringCalloutAttachment,
  planAuthoringDeletion,
  planAuthoringDistribution,
  planAuthoringPositionDelta,
  planAuthoringResize,
  pasteAuthoringClipboard,
  findAuthoringObject,
  findAuthoringPathTraversals,
  graphHasLinkBetween,
  graphHasReachabilityBetween,
  pathSegmentsWithoutDirectLinks,
  pathSegmentsWithoutReachability,
  resolveAuthoringSelection
} from '../../src/authoring';
import type { TopoDocument } from '../../src';

const document: TopoDocument = {
  graph: {
    layers: [{ id: 'physical', name: 'Physical' }, { id: 'service', name: 'Service' }],
    links: [
      { id: 'A-B', source: 'A', target: 'B', layers: ['physical'] },
      { id: 'B-C', source: 'B', target: 'C', layers: ['physical'], directions: { sourceToTarget: { label: '10G' } } }
    ],
    nodes: [
      { id: 'A', name: 'Node A', layers: ['physical'], position: [0, 0] },
      { id: 'B', name: 'Node B', layers: ['physical'], position: [100, 0] },
      { id: 'C', name: 'Node C', layers: ['physical'], position: [200, 0] },
      { id: 'D', name: 'Node D', layers: ['physical'], position: [300, 0] }
    ],
    paths: [],
    regions: []
  }
};

describe('shared authoring graph queries', () => {
  it('resolves direct and transitive undirected graph connectivity', () => {
    expect(graphHasLinkBetween(document, 'B', 'A')).toBe(true);
    expect(graphHasLinkBetween(document, 'A', 'C')).toBe(false);
    expect(graphHasReachabilityBetween(document, 'A', 'C')).toBe(true);
    expect(graphHasReachabilityBetween(document, 'A', 'D')).toBe(false);
    expect(pathSegmentsWithoutReachability(document, ['A', 'C', 'D'])).toEqual([{ source: 'C', target: 'D' }]);
    expect(pathSegmentsWithoutDirectLinks(document, ['A', 'C'])).toEqual([{ source: 'A', target: 'C' }]);
  });

  it('resolves object identity, direction identity, and display names', () => {
    expect(findAuthoringObject(document, { id: 'A', kind: 'node' })?.name).toBe('Node A');
    expect(findAuthoringObject(document, { id: 'B-C:sourceToTarget', kind: 'linkDirection' }))
      .toMatchObject({ direction: 'sourceToTarget', linkId: 'B-C' });
    expect(authoringObjectDisplayName(document, { id: 'A', kind: 'node' })).toBe('Node A');
    expect(resolveAuthoringSelection(document, 'B-C:sourceToTarget')).toEqual({ id: 'B-C:sourceToTarget', kind: 'linkDirection' });
  });

  it('uses selected declared layers and deterministic fallback order', () => {
    expect(defaultLayerId(document, ['service'])).toBe('service');
    expect(defaultLayerId(document, ['missing'])).toBe('physical');
    expect(defaultLayerId(undefined, ['custom'])).toBe('custom');
  });

  it('creates deterministic node values through the shared semantic mutation', () => {
    expect(createAuthoringNode(document, {
      kind: 'router',
      position: { x: 438.7, y: 221.2 },
      selectedLayerIds: ['physical']
    })).toEqual({
      id: 'router-1',
      labels: { role: 'router' },
      layers: ['physical'],
      name: 'New Router',
      position: [439, 221]
    });

    expect(createAuthoringNode(document, {
      kind: 'switch',
      position: { x: 180.4, y: 310.6 },
      selectedLayerIds: ['physical']
    })).toEqual({
      id: 'switch-1',
      labels: { role: 'switch' },
      layers: ['physical'],
      name: 'New Switch',
      position: [180, 311]
    });
  });

  it('normalizes a reverse link while preserving physical endpoint handles', () => {
    expect(createAuthoringLink(document, {
      selectedLayerIds: ['physical'],
      source: 'B',
      sourceHandle: 'B:e1-1',
      target: 'A',
      targetHandle: 'A:e1-49'
    })).toEqual({
      id: 'link-1',
      labels: { layer: 'physical' },
      layers: ['physical'],
      name: 'New Link',
      source: 'A',
      sourceHandle: 'A:e1-49',
      target: 'B',
      targetHandle: 'B:e1-1'
    });
  });

  it('rejects self-links and unknown endpoints without allocating an object', () => {
    expect(() => createAuthoringLink(document, {
      selectedLayerIds: ['physical'], source: 'A', target: 'A'
    })).toThrow(/must be different/);
    expect(() => createAuthoringLink(document, {
      selectedLayerIds: ['physical'], source: 'missing', target: 'A'
    })).toThrow(/does not exist/);
    expect(() => createAuthoringLink(document, {
      selectedLayerIds: ['physical'], source: 'A', target: 'missing'
    })).toThrow(/does not exist/);
  });

  it('creates annotation objects in the annotation layer', () => {
    expect(createAuthoringShape(document, { position: { x: 10.4, y: 20.6 } })).toMatchObject({
      id: 'shape-1', layers: ['annotations'], name: 'New Shape', position: [10, 21], size: [180, 96]
    });
    expect(createAuthoringCallout(document, { position: { x: 40, y: 50 } })).toMatchObject({
      body: 'Add context', id: 'callout-1', layers: ['annotations'], position: [40, 50], title: 'New Callout'
    });
  });

  it('plans a callout leader attachment to an existing node', () => {
    const withCallout: TopoDocument = {
      ...document,
      diagram: { callouts: [{ id: 'notice', title: 'Notice', position: [40, 50] }] }
    };
    expect(planAuthoringCalloutAttachment(withCallout, 'notice', 'B')).toEqual({
      insertions: [],
      removals: [],
      updates: [{
        path: ['diagram', 'callouts', 0, 'target'],
        scopePath: ['diagram', 'callouts', 0],
        value: 'B'
      }]
    });
    expect(() => planAuthoringCalloutAttachment(withCallout, 'missing', 'B')).toThrow(/does not exist/);
    expect(() => planAuthoringCalloutAttachment(withCallout, 'notice', 'missing')).toThrow(/does not exist/);
  });

  it('creates valid path and region entry objects in compatible layers', () => {
    expect(createAuthoringPath(document, { sequence: ['A', 'C'] })).toMatchObject({
      id: 'path-1', layers: ['paths'], sequence: ['A', 'C']
    });
    expect(() => createAuthoringPath(document, { sequence: ['A', 'D'] })).toThrow(/No graph traversal/);
    expect(createAuthoringRegion(document, { position: { x: 20, y: 40 } })).toMatchObject({
      id: 'region-1', layers: ['physical'], members: [], position: [20, 40], size: [280, 180]
    });
  });

  it('distinguishes loose, explicit, and deterministic shortest path semantics', () => {
    const diamond: TopoDocument = {
      graph: {
        layers: [{ id: 'physical' }, { id: 'paths' }],
        nodes: ['A', 'B', 'C', 'D'].map((id, index) => ({ id, position: [index * 100, 0] })),
        links: [
          { id: 'A-B', source: 'A', target: 'B' },
          { id: 'B-D', source: 'B', target: 'D' },
          { id: 'A-C', source: 'A', target: 'C' },
          { id: 'C-D', source: 'C', target: 'D' }
        ]
      }
    };
    const linksBefore = structuredClone(diamond.graph?.links);

    expect(findAuthoringPathTraversals(diamond, 'A', 'D')).toEqual([
      ['A', 'B', 'D'],
      ['A', 'C', 'D']
    ]);
    expect(createAuthoringPath(diamond, { mode: 'loose', sequence: ['A', 'D'] }).sequence).toEqual(['A', 'D']);
    expect(createAuthoringPath(diamond, { mode: 'shortest', sequence: ['A', 'D'] }).sequence).toEqual(['A', 'B', 'D']);
    expect(createAuthoringPath(diamond, { mode: 'explicit', sequence: ['A', 'C', 'D'] }).sequence).toEqual(['A', 'C', 'D']);
    expect(() => createAuthoringPath(diamond, { mode: 'explicit', sequence: ['A', 'D'] })).toThrow(/requires a direct link/);
    expect(diamond.graph?.links).toEqual(linksBefore);
  });

  it('copies and pastes a connected selection while repairing cloned endpoints', () => {
    const clipboard = copyAuthoringSelection(document, [
      { id: 'A', kind: 'node' },
      { id: 'B', kind: 'node' },
      { id: 'A-B', kind: 'link' }
    ]);
    const plan = pasteAuthoringClipboard(document, clipboard, { x: 40, y: 60 });

    expect(plan.insertions.map((entry) => [entry.selection.kind, entry.selection.id])).toEqual([
      ['node', 'a-1'], ['node', 'b-1'], ['link', 'a-b-1']
    ]);
    expect(plan.insertions[0].value).toMatchObject({ position: [40, 60] });
    expect(plan.insertions[2].value).toMatchObject({ source: 'a-1', target: 'b-1' });
  });

  it('plans dependency-safe node deletion without leaving broken links or paths', () => {
    const withReferences: TopoDocument = {
      ...document,
      diagram: { callouts: [{ id: 'note-A', target: 'A', position: [0, 80] }] },
      graph: {
        ...document.graph,
        paths: [{ id: 'path-A-C', sequence: ['A', 'B', 'C'] }],
        regions: [{ id: 'west', members: ['A', 'B'] }]
      }
    };
    const plan = planAuthoringDeletion(withReferences, [{ id: 'A', kind: 'node' }]);

    expect(plan.removals.map((entry) => entry.selection)).toEqual(expect.arrayContaining([
      { id: 'A', kind: 'node' },
      { id: 'A-B', kind: 'link' },
      { id: 'path-A-C', kind: 'path' },
      { id: 'note-A', kind: 'callout' }
    ]));
    expect(plan.updates).toContainEqual(expect.objectContaining({
      path: ['graph', 'regions', 0, 'members'], value: ['B']
    }));
  });

  it('plans nudge and alignment as targeted position edits', () => {
    const nudge = planAuthoringPositionDelta(document, [
      { id: 'A', kind: 'node' }, { id: 'B', kind: 'node' }
    ], { x: 20, y: -10 });
    expect(nudge.updates.map((entry) => [entry.path, entry.value])).toEqual([
      [['graph', 'nodes', 0, 'position', 0], 20],
      [['graph', 'nodes', 0, 'position', 1], -10],
      [['graph', 'nodes', 1, 'position', 0], 120],
      [['graph', 'nodes', 1, 'position', 1], -10]
    ]);

    const align = planAuthoringAlignment(document, [
      { id: 'A', kind: 'node' }, { id: 'B', kind: 'node' }
    ], 'top');
    expect(align.updates.filter((entry) => entry.path.at(-1) === 1).map((entry) => entry.value)).toEqual([0, 0]);

    const distribute = planAuthoringDistribution(document, [
      { id: 'A', kind: 'node' }, { id: 'B', kind: 'node' }, { id: 'D', kind: 'node' }
    ], 'horizontal');
    expect(distribute.updates.filter((entry) => entry.path.at(-1) === 0).map((entry) => entry.value)).toEqual([0, 150, 300]);

    const resize = planAuthoringResize(document, { id: 'A', kind: 'node' }, { x: 4, y: 8 }, { width: 120, height: 72 });
    expect(resize.updates).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: ['graph', 'nodes', 0, 'style', 'width'], value: 120 }),
      expect.objectContaining({ path: ['graph', 'nodes', 0, 'style', 'height'], value: 72 })
    ]));
  });
});
