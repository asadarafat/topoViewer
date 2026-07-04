import { describe, expect, it } from 'vitest';
import { placeLabels } from '../../src/core/labelPlacement';

describe('label placement', () => {
  it('keeps higher-priority labels and moves lower-priority labels to a non-overlapping candidate', () => {
    const placements = placeLabels([
      {
        id: 'node-a',
        width: 40,
        height: 20,
        priority: 80,
        candidates: [{ x: 100, y: 100, transform: 'translate(-50%, -50%)' }]
      },
      {
        id: 'region-a',
        width: 60,
        height: 20,
        priority: 40,
        candidates: [
          { x: 100, y: 100, transform: 'translate(-50%, -50%)' },
          { x: 180, y: 100, transform: 'translate(-50%, -50%)' }
        ]
      }
    ]);

    expect(placements['node-a'].x).toBe(100);
    expect(placements['region-a'].x).toBe(180);
  });

  it('uses stable ID ordering for equal-priority labels', () => {
    const placements = placeLabels([
      {
        id: 'b',
        width: 40,
        height: 20,
        priority: 80,
        candidates: [
          { x: 100, y: 100, transform: 'translate(-50%, -50%)' },
          { x: 180, y: 100, transform: 'translate(-50%, -50%)' }
        ]
      },
      {
        id: 'a',
        width: 40,
        height: 20,
        priority: 80,
        candidates: [
          { x: 100, y: 100, transform: 'translate(-50%, -50%)' },
          { x: 180, y: 100, transform: 'translate(-50%, -50%)' }
        ]
      }
    ]);

    expect(placements.a.x).toBe(100);
    expect(placements.b.x).toBe(180);
  });

  it('can fade a lower-priority label when every candidate overlaps', () => {
    const placements = placeLabels([
      {
        id: 'node-a',
        width: 40,
        height: 20,
        priority: 80,
        candidates: [{ x: 100, y: 100, transform: 'translate(-50%, -50%)' }]
      },
      {
        id: 'region-a',
        width: 60,
        height: 20,
        priority: 40,
        collisionPolicy: 'fade',
        candidates: [{ x: 100, y: 100, transform: 'translate(-50%, -50%)' }]
      }
    ]);

    expect(placements['region-a'].opacity).toBeLessThan(1);
  });

  it('can ignore owner obstacles for labels that intentionally sit inside their object', () => {
    const placements = placeLabels([
      {
        id: 'node-a-label',
        width: 40,
        height: 20,
        priority: 80,
        ignoredObstacleIds: ['node-a-body'],
        candidates: [{ x: 100, y: 100, transform: 'translate(-50%, -50%)' }]
      }
    ], [
      {
        id: 'node-a-body',
        bounds: { x: 70, y: 80, width: 60, height: 40 }
      }
    ]);

    expect(placements['node-a-label'].x).toBe(100);
    expect(placements['node-a-label'].opacity).toBeUndefined();
  });
});
