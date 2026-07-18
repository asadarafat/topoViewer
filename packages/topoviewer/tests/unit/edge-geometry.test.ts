import { describe, expect, it } from 'vitest';
import { parallelBezierControlPointDistance, parallelStraightLaneEndpoints } from '../../src/core/edgeGeometry';

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

describe('parallel straight geometry', () => {
  const horizontal = {
    sourceX: 100,
    sourceY: 50,
    targetX: 300,
    targetY: 90
  };
  const sourceBounds = { x: 0, y: 0, width: 100, height: 100 };
  const targetBounds = { x: 300, y: 40, width: 100, height: 100 };

  it('moves horizontal-side anchors along the node perimeter without translating their x coordinates', () => {
    const lanes = [0, 1, 2].map((laneIndex) => parallelStraightLaneEndpoints(horizontal, {
      laneCount: 3,
      laneIndex,
      stepSize: 20,
      sourceSide: 'right',
      targetSide: 'left',
      sourceBounds,
      targetBounds
    }));

    expect(lanes.map(({ sourceX, sourceY, targetX, targetY }) => ({ sourceX, sourceY, targetX, targetY }))).toEqual([
      { sourceX: 100, sourceY: 30, targetX: 300, targetY: 70 },
      { sourceX: 100, sourceY: 50, targetX: 300, targetY: 90 },
      { sourceX: 100, sourceY: 70, targetX: 300, targetY: 110 }
    ]);
  });

  it('clamps large lane gaps to both node boundaries', () => {
    const lane = parallelStraightLaneEndpoints(horizontal, {
      laneCount: 3,
      laneIndex: 0,
      stepSize: 100,
      sourceSide: 'right',
      targetSide: 'left',
      sourceBounds,
      targetBounds,
      endpointPadding: 8
    });

    expect(lane).toEqual({ sourceX: 100, sourceY: 8, targetX: 300, targetY: 48 });
  });

  it('moves vertical-side anchors along the node perimeter without translating their y coordinates', () => {
    const lane = parallelStraightLaneEndpoints({ sourceX: 60, sourceY: 100, targetX: 100, targetY: 300 }, {
      laneCount: 3,
      laneIndex: 2,
      stepSize: 24,
      sourceSide: 'bottom',
      targetSide: 'top',
      sourceBounds: { x: 10, y: 0, width: 100, height: 100 },
      targetBounds: { x: 50, y: 300, width: 100, height: 100 }
    });

    expect(lane).toEqual({ sourceX: 84, sourceY: 100, targetX: 124, targetY: 300 });
  });
});
