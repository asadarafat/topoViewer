import { describe, expect, it } from 'vitest';
import {
  authoringRegionBounds,
  authoringRegionDepth,
  authoringRegionForNodePosition,
  createAuthoringRegion,
  planAuthoringNodeMove,
  planAuthoringRegionExpanded,
  planAuthoringRegionMove,
  planAuthoringReleaseFromRegion
} from '../../src/authoring';
import type { TopoDocument } from '../../src';

function topology(): TopoDocument {
  return {
    graph: {
      layers: [{ id: 'physical' }],
      nodes: [
        { id: 'A', layers: ['physical'], position: [40, 80] },
        { id: 'B', layers: ['physical'], position: [420, 80] }
      ],
      regions: [
        { id: 'west', layers: ['physical'], members: ['A'], position: [0, 0], size: [300, 220] },
        { id: 'east', layers: ['physical'], members: [], position: [380, 0], size: [300, 220] }
      ]
    }
  };
}

describe('shared region authoring plans', () => {
  it('places new sibling regions without overlap', () => {
    const value = createAuthoringRegion(topology(), { position: { x: 20, y: 20 } });
    expect(value.position).toEqual([20, 240]);
    const created = { x: 20, y: 240, width: 280, height: 180 };
    const west = authoringRegionBounds(topology(), 'west');
    expect(west && created.y >= west.y + west.height + 12).toBe(true);
  });

  it('supports explicit nested placement while rejecting unknown parents', () => {
    const document = topology();
    const child = createAuthoringRegion(document, {
      parentId: 'west',
      position: { x: 30, y: 30 },
      size: { width: 180, height: 120 }
    });
    expect(child).toMatchObject({ parent: 'west', position: [30, 30], size: [180, 120] });
    document.graph?.regions?.push(child);
    expect(authoringRegionDepth(document, child.id)).toBe(1);
    expect(() => createAuthoringRegion(document, {
      parentId: 'west',
      position: { x: 30, y: 30 },
      size: { width: 180, height: 120 }
    })).toThrow(/No non-overlapping placement/);
    expect(() => createAuthoringRegion(document, {
      parentId: 'missing', position: { x: 20, y: 20 }
    })).toThrow(/does not exist/);
  });

  it('previews containment and atomically moves membership between regions', () => {
    const document = topology();
    expect(authoringRegionForNodePosition(document, 'A', { x: 440, y: 90 })).toBe('east');
    const plan = planAuthoringNodeMove(document, 'A', { x: 440, y: 90 });
    expect(plan.updates).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: ['graph', 'nodes', 0, 'position', 0], value: 440 }),
      expect.objectContaining({ path: ['graph', 'regions', 0, 'members'], value: [] }),
      expect.objectContaining({ path: ['graph', 'regions', 1, 'members'], value: ['A'] })
    ]));
  });

  it('moves a region, its descendant regions, and recursive member nodes together', () => {
    const document = topology();
    document.graph?.regions?.push({
      id: 'west-child', parent: 'west', members: ['B'], position: [80, 100], size: [160, 100]
    });
    const plan = planAuthoringRegionMove(document, 'west', { x: 100, y: 50 });
    expect(plan.updates).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: ['graph', 'regions', 0, 'position', 0], value: 100 }),
      expect.objectContaining({ path: ['graph', 'regions', 2, 'position', 0], value: 180 }),
      expect.objectContaining({ path: ['graph', 'nodes', 0, 'position', 0], value: 140 }),
      expect.objectContaining({ path: ['graph', 'nodes', 1, 'position', 0], value: 520 })
    ]));
  });

  it('moves member-derived regions without inventing an ignored region position', () => {
    const document = topology();
    const west = document.graph?.regions?.[0];
    if (!west) throw new Error('West region fixture is missing.');
    delete west.position;
    delete west.size;
    const bounds = authoringRegionBounds(document, 'west');
    if (!bounds) throw new Error('Member-derived region bounds are missing.');

    const plan = planAuthoringRegionMove(document, 'west', {
      x: bounds.x + 100,
      y: bounds.y + 50
    });

    expect(plan.updates).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ path: ['graph', 'regions', 0, 'position', expect.anything()] })
    ]));
    expect(plan.updates).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: ['graph', 'nodes', 0, 'position', 0], value: 140 }),
      expect.objectContaining({ path: ['graph', 'nodes', 0, 'position', 1], value: 130 })
    ]));
  });

  it('creates an origin when an explicit-size region is dragged without one', () => {
    const document = topology();
    const west = document.graph?.regions?.[0];
    if (!west) throw new Error('West region fixture is missing.');
    delete west.position;

    const plan = planAuthoringRegionMove(document, 'west', { x: 80, y: 60 });

    expect(plan.updates).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: ['graph', 'regions', 0, 'position', 'x'], value: 80 }),
      expect.objectContaining({ path: ['graph', 'regions', 0, 'position', 'y'], value: 60 }),
      expect.objectContaining({ path: ['graph', 'nodes', 0, 'position', 0], value: 120 }),
      expect.objectContaining({ path: ['graph', 'nodes', 0, 'position', 1], value: 140 })
    ]));
  });

  it('releases membership without deleting the object and creates reversible aggregate state', () => {
    const document = topology();
    expect(planAuthoringReleaseFromRegion(document, 'A', 'west').updates).toContainEqual(expect.objectContaining({
      path: ['graph', 'regions', 0, 'members'], value: []
    }));
    const collapsedRoot = planAuthoringRegionExpanded(document, 'west', false).updates[0].value as Record<string, unknown>;
    const collapsed = collapsedRoot.aggregate as Record<string, unknown>;
    expect(collapsed).toMatchObject({
      groups: [{ id: 'summary-west', by: 'region', regionId: 'west', label: 'west' }],
      expandedGroupIds: []
    });
    const expandedDocument = {
      ...document,
      attention: { aggregate: collapsed }
    } as TopoDocument;
    const expanded = planAuthoringRegionExpanded(expandedDocument, 'west', true).updates[0].value as Record<string, unknown>;
    expect(expanded.expandedGroupIds).toEqual(['summary-west']);
  });
});
