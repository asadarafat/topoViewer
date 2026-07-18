import { describe, expect, it } from 'vitest';
import { parallelBezierControlPointDistance } from '../../src/core/edgeGeometry';

describe('parallel Bezier geometry', () => {
  it('centers parallel lanes around the default route', () => {
    const distances = [0, 1, 2].map((laneIndex) => parallelBezierControlPointDistance({
      laneCount: 3,
      laneIndex,
      stepSize: 34
    }));

    expect(distances).toEqual([-34, 0, 34]);
  });

  it('adds lane spacing to an explicit base bend', () => {
    const distances = [0, 1, 2].map((laneIndex) => parallelBezierControlPointDistance({
      baseDistance: 100,
      laneCount: 3,
      laneIndex,
      stepSize: 34
    }));

    expect(distances).toEqual([66, 100, 134]);
  });
});
