import { describe, expect, it } from 'vitest';
import { computeLayoutPositions } from '../../src';
import { createSyntheticClosDocument } from '../../scripts/synthetic-clos-fixture.mjs';

function meanYByStage(positions, expectedStageById) {
  const totals = new Map();
  Object.entries(expectedStageById).forEach(([id, stage]) => {
    const position = positions.get(id);
    expect(position, `${id} should have a generated position`).toBeDefined();
    const entry = totals.get(stage) || { count: 0, y: 0 };
    entry.count += 1;
    entry.y += position.y;
    totals.set(stage, entry);
  });
  return [...totals.entries()]
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([stage, entry]) => ({ stage: Number(stage), meanY: entry.y / entry.count }));
}

describe('synthetic CLOS benchmark fixture', () => {
  it('generates a deterministic 1k-node staged graph', () => {
    const first = createSyntheticClosDocument({ nodes: 1000 });
    const second = createSyntheticClosDocument({ nodes: 1000 });

    expect(first.graph.nodes).toHaveLength(1000);
    expect(first.graph.links).toHaveLength(2520);
    expect(first.metadata.stageCounts).toEqual([158, 211, 264, 210, 157]);
    expect(second.graph.nodes).toEqual(first.graph.nodes);
    expect(second.graph.links).toEqual(first.graph.links);
  });

  it('covers 1k-node CLOS layout without browser or React dependencies', () => {
    const document = createSyntheticClosDocument({ nodes: 1000 });
    const positions = computeLayoutPositions(document.graph.nodes, document.graph.links, document.layout);
    const stageMeans = meanYByStage(positions, document.metadata.expectedStageById);

    expect(positions.size).toBe(1000);
    for (let index = 1; index < stageMeans.length; index += 1) {
      expect(stageMeans[index - 1].meanY).toBeLessThan(stageMeans[index].meanY);
    }
  });
});
