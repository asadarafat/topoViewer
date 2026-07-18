import { describe, expect, it } from 'vitest';
import type { NodeChange } from '@xyflow/react';
import { applyTopoNodeChanges } from '../../src/components/regionDrag';
import {
  applyHelperLineSnapToChanges,
  calculateHelperLines,
  helperLineBoxFromNode,
  normalizeHelperLinesOptions,
  resolveDragStopPosition,
  type HelperLineNodeLike
} from '../../src/components/helperLines';
import type { TopoDocument } from '../../src';

function node(id: string, x: number, y: number, width = 80, height = 40, extra: Partial<HelperLineNodeLike> = {}): HelperLineNodeLike {
  return {
    id,
    type: 'network',
    position: { x, y },
    measured: { width, height },
    ...extra
  };
}

describe('helper line geometry', () => {
  it('normalizes disabled and enabled options', () => {
    expect(normalizeHelperLinesOptions(undefined)).toMatchObject({ enabled: false, snap: false, threshold: 5 });
    expect(normalizeHelperLinesOptions(true)).toMatchObject({ enabled: true, snap: true, snapMode: 'commit', threshold: 5 });
    expect(normalizeHelperLinesOptions({ snap: false, threshold: 9, showMidpoints: true })).toMatchObject({
      enabled: true,
      snap: false,
      snapMode: 'commit',
      snapHysteresis: 3,
      threshold: 9,
      showMidpoints: true
    });
    expect(normalizeHelperLinesOptions({ snap: true, snapMode: 'commit' })).toMatchObject({
      enabled: true,
      snap: true,
      snapMode: 'commit'
    });
    expect(normalizeHelperLinesOptions({ snap: true, snapMode: 'live' })).toMatchObject({
      enabled: true,
      snap: true,
      snapMode: 'live'
    });
  });

  it('detects edge and center alignments', () => {
    const options = normalizeHelperLinesOptions({ snap: true });
    const result = calculateHelperLines(
      { id: 'drag', x: 96, y: 183, width: 80, height: 40 },
      [{ id: 'peer', x: 100, y: 170, width: 80, height: 60 }],
      options
    );

    expect(result.lines.vertical).toEqual({ value: 100, kind: 'edge' });
    expect(result.lines.horizontal).toEqual({ value: 200, kind: 'center' });
    expect(result.snappedPosition).toEqual({ x: 100, y: 180 });
  });

  it('keeps guide-lock metadata readable but outside the enumerable line shape', () => {
    const options = normalizeHelperLinesOptions({ snap: true });
    const result = calculateHelperLines(
      { id: 'drag', x: 96, y: 100, width: 80, height: 40 },
      [{ id: 'peer', x: 100, y: 100, width: 80, height: 40 }],
      options
    );

    expect(result.lines.vertical).toEqual({ value: 100, kind: 'edge' });
    expect(result.lines.vertical?.candidateId).toBe('peer');
    expect(result.lines.vertical?.draggedOffset).toBe(0);
    expect(Object.keys(result.lines.vertical || {})).toEqual(['value', 'kind']);
  });

  it('detects right and bottom edge alignments', () => {
    const options = normalizeHelperLinesOptions({ snap: true });
    const result = calculateHelperLines(
      { id: 'drag', x: 176, y: 176, width: 20, height: 20 },
      [{ id: 'peer', x: 100, y: 100, width: 100, height: 100 }],
      options
    );

    expect(result.lines.vertical).toEqual({ value: 200, kind: 'edge' });
    expect(result.lines.horizontal).toEqual({ value: 200, kind: 'edge' });
    expect(result.snappedPosition).toEqual({ x: 180, y: 180 });
  });

  it('ignores hidden candidates and the dragged node', () => {
    const options = normalizeHelperLinesOptions(true);
    const result = calculateHelperLines(
      { id: 'drag', x: 101, y: 100, width: 80, height: 40 },
      [
        { id: 'drag', x: 100, y: 100, width: 80, height: 40 },
        { id: 'hidden', x: 100, y: 100, width: 80, height: 40, hidden: true }
      ],
      options
    );

    expect(result.lines).toEqual({});
    expect(result.snappedPosition).toBeUndefined();
  });

  it('prefers measured dimensions and falls back to compiled dimensions', () => {
    expect(helperLineBoxFromNode(node('measured', 10, 20, 120, 70))).toMatchObject({
      width: 120,
      height: 70
    });
    expect(helperLineBoxFromNode({
      id: 'compiled',
      position: { x: 10, y: 20 },
      style: { width: 96, height: 54 }
    })).toMatchObject({
      width: 96,
      height: 54
    });
  });

  it('uses absolute coordinates for parented nodes when React Flow provides them', () => {
    expect(helperLineBoxFromNode({
      id: 'child',
      position: { x: 10, y: 20 },
      internals: { positionAbsolute: { x: 310, y: 420 } },
      measured: { width: 90, height: 50 }
    })).toMatchObject({
      x: 310,
      y: 420
    });
  });

  it('snaps parent-relative node changes using absolute geometry and returns local coordinates', () => {
    const options = normalizeHelperLinesOptions({ snap: true, snapMode: 'live' });
    const result = applyHelperLineSnapToChanges({
      changes: [{ id: 'child', type: 'position', dragging: true, position: { x: 2, y: 20 } }],
      nodes: [
        {
          id: 'child',
          type: 'network',
          position: { x: 10, y: 20 },
          internals: { positionAbsolute: { x: 310, y: 420 } },
          measured: { width: 80, height: 40 }
        },
        {
          id: 'peer',
          type: 'network',
          position: { x: 0, y: 0 },
          internals: { positionAbsolute: { x: 300, y: 420 } },
          measured: { width: 80, height: 40 }
        }
      ],
      options
    });

    expect(result.lines.vertical).toEqual({ value: 300, kind: 'edge' });
    expect(result.changes[0].position).toEqual({ x: 0, y: 20 });
  });

  it('does not snap outside the threshold', () => {
    const options = normalizeHelperLinesOptions({ snap: true, threshold: 3 });
    const result = calculateHelperLines(
      { id: 'drag', x: 96, y: 100, width: 80, height: 40 },
      [{ id: 'peer', x: 100, y: 100, width: 80, height: 40 }],
      options
    );

    expect(result.lines.horizontal).toEqual({ value: 100, kind: 'edge' });
    expect(result.lines.vertical).toBeUndefined();
    expect(result.snappedPosition).toEqual({ x: 96, y: 100 });
  });

  it('renders guide-only lines without changing position', () => {
    const options = normalizeHelperLinesOptions({ snap: false });
    const result = applyHelperLineSnapToChanges({
      changes: [{ id: 'drag', type: 'position', dragging: true, position: { x: 101, y: 100 } }],
      nodes: [node('drag', 0, 0), node('peer', 100, 100)],
      options
    });

    expect(result.lines.vertical).toEqual({ value: 100, kind: 'edge' });
    expect(result.changes[0].position).toEqual({ x: 101, y: 100 });
    expect(result.snappedPositions.size).toBe(0);
  });

  it('snaps pending position changes in live snap mode', () => {
    const options = normalizeHelperLinesOptions({ snap: true, snapMode: 'live' });
    const result = applyHelperLineSnapToChanges({
      changes: [{ id: 'drag', type: 'position', dragging: true, position: { x: 101, y: 100 } }],
      nodes: [node('drag', 0, 0), node('peer', 100, 100)],
      options
    });

    expect(result.changes[0].position).toEqual({ x: 100, y: 100 });
    expect(result.snappedPositions.get('drag')).toEqual({ x: 100, y: 100 });
  });

  it('snaps a selected drag group as one rigid translation', () => {
    const options = normalizeHelperLinesOptions({ snap: true, snapMode: 'live' });
    const result = applyHelperLineSnapToChanges({
      changes: [
        { id: 'group-b', type: 'position', dragging: true, position: { x: 301, y: 200 } },
        { id: 'group-a', type: 'position', dragging: true, position: { x: 101, y: 100 } }
      ],
      nodes: [node('group-a', 0, 0), node('group-b', 200, 100), node('peer', 100, 100)],
      options,
      activeNodeId: 'group-a',
      activeNodeIds: new Set(['group-a', 'group-b'])
    });

    expect(result.changes.map((change) => change.position)).toEqual([
      { x: 300, y: 200 },
      { x: 100, y: 100 }
    ]);
    expect(result.snappedPositions).toEqual(new Map([
      ['group-b', { x: 300, y: 200 }],
      ['group-a', { x: 100, y: 100 }]
    ]));
  });

  it('retains an active live guide outside the snap threshold without moving the node', () => {
    const options = normalizeHelperLinesOptions({ snap: true, snapMode: 'live', threshold: 5, snapHysteresis: 3 });
    const result = applyHelperLineSnapToChanges({
      changes: [{ id: 'drag', type: 'position', dragging: true, position: { x: 106, y: 0 } }],
      nodes: [node('drag', 0, 0), node('peer', 100, 100)],
      options,
      previousLines: { vertical: { value: 100, kind: 'edge' } }
    });

    expect(result.lines.vertical).toEqual({ value: 100, kind: 'edge' });
    expect(result.changes[0].position).toEqual({ x: 106, y: 0 });
    expect(result.snappedPositions.size).toBe(0);
  });

  it('switches live snap candidates only when the competing guide is materially closer', () => {
    const options = normalizeHelperLinesOptions({ snap: true, snapMode: 'live', threshold: 5, snapHysteresis: 3 });
    const retained = applyHelperLineSnapToChanges({
      changes: [{ id: 'drag', type: 'position', dragging: true, position: { x: 103, y: 100 } }],
      nodes: [node('drag', 0, 0), node('active', 100, 100), node('competing', 105, 100)],
      options,
      previousLines: { vertical: { value: 100, kind: 'edge' } }
    });
    const switched = applyHelperLineSnapToChanges({
      changes: [{ id: 'drag', type: 'position', dragging: true, position: { x: 108.5, y: 100 } }],
      nodes: [node('drag', 0, 0), node('active', 100, 100), node('competing', 110, 100)],
      options,
      previousLines: { vertical: { value: 100, kind: 'edge' } }
    });

    expect(retained.lines.vertical).toEqual({ value: 100, kind: 'edge' });
    expect(retained.changes[0].position).toEqual({ x: 100, y: 100 });
    expect(switched.lines.vertical).toEqual({ value: 110, kind: 'edge' });
    expect(switched.changes[0].position).toEqual({ x: 110, y: 100 });
  });

  it('records commit-mode snap candidates without rewriting live drag changes', () => {
    const options = normalizeHelperLinesOptions({ snap: true, snapMode: 'commit' });
    const result = applyHelperLineSnapToChanges({
      changes: [{ id: 'drag', type: 'position', dragging: true, position: { x: 101, y: 100 } }],
      nodes: [node('drag', 0, 0), node('peer', 100, 100)],
      options
    });

    expect(result.lines.vertical).toEqual({ value: 100, kind: 'edge' });
    expect(result.changes[0].position).toEqual({ x: 101, y: 100 });
    expect(result.snappedPositions.get('drag')).toEqual({ x: 100, y: 100 });
  });

  it('accepts active position changes when React Flow omits the dragging flag', () => {
    const options = normalizeHelperLinesOptions({ snap: true, snapMode: 'live' });
    const result = applyHelperLineSnapToChanges({
      changes: [{ id: 'drag', type: 'position', position: { x: 101, y: 100 } }],
      nodes: [node('drag', 0, 0), node('peer', 100, 100)],
      options
    });

    expect(result.lines.vertical).toEqual({ value: 100, kind: 'edge' });
    expect(result.changes[0].position).toEqual({ x: 100, y: 100 });
  });

  it('ignores explicit non-drag position changes', () => {
    const options = normalizeHelperLinesOptions(true);
    const result = applyHelperLineSnapToChanges({
      changes: [{ id: 'drag', type: 'position', dragging: false, position: { x: 101, y: 100 } }],
      nodes: [node('drag', 0, 0), node('peer', 100, 100)],
      options
    });

    expect(result.lines).toEqual({});
    expect(result.changes[0].position).toEqual({ x: 101, y: 100 });
  });

  it('accepts explicit non-drag position changes for the active drag-session node', () => {
    const options = normalizeHelperLinesOptions({ snap: true, snapMode: 'live' });
    const result = applyHelperLineSnapToChanges({
      changes: [{ id: 'drag', type: 'position', dragging: false, position: { x: 101, y: 100 } }],
      nodes: [node('drag', 0, 0), node('peer', 100, 100)],
      options,
      activeNodeId: 'drag'
    });

    expect(result.lines.vertical).toEqual({ value: 100, kind: 'edge' });
    expect(result.changes[0].position).toEqual({ x: 100, y: 100 });
  });

  it('uses fixed visible objects as candidates', () => {
    const options = normalizeHelperLinesOptions({ snap: true, snapMode: 'live' });
    const result = applyHelperLineSnapToChanges({
      changes: [{ id: 'drag', type: 'position', dragging: true, position: { x: 101, y: 100 } }],
      nodes: [node('drag', 0, 0), node('fixed', 100, 100, 80, 40, { draggable: false })],
      options
    });

    expect(result.lines.vertical).toEqual({ value: 100, kind: 'edge' });
    expect(result.changes[0].position).toEqual({ x: 100, y: 100 });
  });

  it('supports bounded midpoint guide candidates', () => {
    const options = normalizeHelperLinesOptions({ snap: true, showMidpoints: true, midpointCandidateLimit: 4 });
    const result = calculateHelperLines(
      { id: 'drag', x: 145, y: 0, width: 20, height: 20 },
      [
        { id: 'left', x: 100, y: 0, width: 20, height: 20 },
        { id: 'right', x: 180, y: 0, width: 20, height: 20 }
      ],
      options
    );

    expect(result.lines.vertical).toEqual({ value: 150, kind: 'midpoint' });
    expect(result.snappedPosition?.x).toBe(140);
  });

  it('bounds candidate scans with the configured candidate limit', () => {
    const options = normalizeHelperLinesOptions({ candidateLimit: 1 });
    const result = calculateHelperLines(
      { id: 'drag', x: 100, y: 100, width: 80, height: 40 },
      [
        { id: 'a-far', x: 400, y: 400, width: 80, height: 40 },
        { id: 'z-near', x: 100, y: 100, width: 80, height: 40 }
      ],
      options
    );

    expect(result.lines).toEqual({});
  });

  it('keeps a two-node commit-snap guide stable through staggered near-threshold movement', () => {
    const options = normalizeHelperLinesOptions({
      snap: true,
      snapMode: 'commit',
      threshold: 5,
      snapHysteresis: 3
    });
    const nodes = [node('drag', 100, 100), node('peer', 220, 100)];
    let previousLines = {};

    const nearFrames = [216, 223, 226].map((x) => {
      const result = applyHelperLineSnapToChanges({
        changes: [{ id: 'drag', type: 'position', dragging: true, position: { x, y: 100 } }],
        nodes,
        options,
        previousLines
      });
      previousLines = result.lines;
      return result;
    });
    const released = applyHelperLineSnapToChanges({
      changes: [{ id: 'drag', type: 'position', dragging: true, position: { x: 229, y: 149 } }],
      nodes,
      options,
      previousLines
    });

    expect(nearFrames.map((frame) => frame.lines.vertical)).toEqual([
      { value: 220, kind: 'edge' },
      { value: 220, kind: 'edge' },
      { value: 220, kind: 'edge' }
    ]);
    expect(nearFrames.map((frame) => frame.changes[0].position?.x)).toEqual([216, 223, 226]);
    expect(nearFrames.map((frame) => frame.snappedPositions.get('drag')?.x)).toEqual([220, 220, 226]);
    expect(released.lines).toEqual({});
    expect(released.snappedPositions.size).toBe(0);
  });
});

describe('helper line integration contracts', () => {
  it('preserves region member translation after a snapped region position change', () => {
    const document: TopoDocument = {
      graph: {
        layers: [{ id: 'physical' }],
        nodes: [
          { id: 'n1', position: [40, 50], layers: ['physical'] },
          { id: 'n2', position: [180, 50], layers: ['physical'] }
        ],
        regions: [
          { id: 'group', members: ['n1'], layers: ['physical'] }
        ]
      }
    };
    const currentNodes = [
      { id: 'region:group', type: 'region', position: { x: 30, y: 30 }, data: { id: 'group' } },
      { id: 'n1', type: 'network', position: { x: 40, y: 50 }, data: { id: 'n1' } },
      { id: 'n2', type: 'network', position: { x: 180, y: 50 }, data: { id: 'n2' } }
    ] as never[];
    const changes = [
      { id: 'region:group', type: 'position', dragging: true, position: { x: 50, y: 70 } }
    ] as NodeChange[];

    const changed = applyTopoNodeChanges({
      changes,
      currentNodes,
      document,
      selectedLayerIds: ['physical'],
      showRegions: true
    }) as unknown as Array<{ id: string; position?: { x: number; y: number } }>;

    expect(changed.find((changedNode) => changedNode.id === 'n1')?.position).toEqual({ x: 60, y: 90 });
    expect(changed.find((changedNode) => changedNode.id === 'n2')?.position).toEqual({ x: 180, y: 50 });
  });

  it('translates nested overlapping region members once per outer-region drag', () => {
    const document: TopoDocument = {
      graph: {
        layers: [{ id: 'physical' }],
        nodes: [
          { id: 'n1', position: [40, 50], layers: ['physical'] },
          { id: 'n2', position: [180, 50], layers: ['physical'] }
        ],
        regions: [
          { id: 'child-a', parent: 'outer', members: ['n1', 'n2'], layers: ['physical'] },
          { id: 'child-b', parent: 'outer', members: ['n2'], layers: ['physical'] },
          { id: 'outer', members: ['n1', 'n2'], layers: ['physical'] }
        ]
      }
    };
    const currentNodes = [
      { id: 'region:outer', type: 'region', position: { x: 20, y: 20 }, data: { id: 'outer' } },
      { id: 'region:child-a', type: 'region', position: { x: 30, y: 30 }, data: { id: 'child-a' } },
      { id: 'region:child-b', type: 'region', position: { x: 160, y: 30 }, data: { id: 'child-b' } },
      { id: 'n1', type: 'network', position: { x: 40, y: 50 }, data: { id: 'n1' } },
      { id: 'n2', type: 'network', position: { x: 180, y: 50 }, data: { id: 'n2' } }
    ] as never[];

    const changed = applyTopoNodeChanges({
      changes: [{ id: 'region:outer', type: 'position', dragging: true, position: { x: 50, y: 60 } }] as NodeChange[],
      currentNodes,
      document,
      selectedLayerIds: ['physical'],
      showRegions: true,
      deferRegionRebuild: true
    }) as unknown as Array<{ id: string; position?: { x: number; y: number } }>;

    expect(changed.find((node) => node.id === 'n1')?.position).toEqual({ x: 70, y: 90 });
    expect(changed.find((node) => node.id === 'n2')?.position).toEqual({ x: 210, y: 90 });
  });

  it('can defer region hull rebuilds during active drag frames', () => {
    const document: TopoDocument = {
      graph: {
        layers: [{ id: 'physical' }],
        nodes: [
          { id: 'n1', position: [40, 50], layers: ['physical'] },
          { id: 'n2', position: [180, 50], layers: ['physical'] }
        ],
        regions: [
          { id: 'group', members: ['n1'], layers: ['physical'], paddingX: 20, paddingY: 20 }
        ]
      }
    };
    const currentNodes = [
      { id: 'region:group', type: 'region', position: { x: 20, y: 20 }, data: { id: 'group' } },
      { id: 'n1', type: 'network', position: { x: 40, y: 50 }, data: { id: 'n1' } },
      { id: 'n2', type: 'network', position: { x: 180, y: 50 }, data: { id: 'n2' } }
    ] as never[];

    const activeFrame = applyTopoNodeChanges({
      changes: [{ id: 'n1', type: 'position', dragging: true, position: { x: 90, y: 70 } }] as NodeChange[],
      currentNodes,
      document,
      selectedLayerIds: ['physical'],
      showRegions: true,
      deferRegionRebuild: true
    }) as unknown as Array<{ id: string; position?: { x: number; y: number } }>;
    const stopFrame = applyTopoNodeChanges({
      changes: [{ id: 'n1', type: 'position', dragging: false, position: { x: 90, y: 70 } }] as NodeChange[],
      currentNodes,
      document,
      selectedLayerIds: ['physical'],
      showRegions: true
    }) as unknown as Array<{ id: string; position?: { x: number; y: number } }>;

    expect(activeFrame.find((changedNode) => changedNode.id === 'region:group')?.position).toEqual({ x: 20, y: 20 });
    expect(stopFrame.find((changedNode) => changedNode.id === 'region:group')?.position).not.toEqual({ x: 20, y: 20 });
  });

  it('preserves region selection while rebuilding its hull after drag stop', () => {
    const document: TopoDocument = {
      graph: {
        layers: [{ id: 'physical' }],
        nodes: [{ id: 'n1', position: [40, 50], layers: ['physical'] }],
        regions: [{ id: 'group', members: ['n1'], layers: ['physical'], paddingX: 20, paddingY: 20 }]
      }
    };
    const currentNodes = [
      { id: 'region:group', type: 'region', position: { x: 20, y: 20 }, selected: true, data: { id: 'group' } },
      { id: 'n1', type: 'network', position: { x: 40, y: 50 }, data: { id: 'n1' } }
    ] as never[];

    const changed = applyTopoNodeChanges({
      changes: [{ id: 'region:group', type: 'position', dragging: false, position: { x: 80, y: 70 } }] as NodeChange[],
      currentNodes,
      document,
      selectedLayerIds: ['physical'],
      showRegions: true
    }) as unknown as Array<{ id: string; selected?: boolean }>;

    expect(changed.find((node) => node.id === 'region:group')?.selected).toBe(true);
  });

  it('resolves drag-stop callback position from snapped drag-session state first', () => {
    const snappedPositions = new Map([['n1', { x: 100, y: 120 }]]);

    expect(resolveDragStopPosition({
      runtimeId: 'n1',
      eventPosition: { x: 96, y: 118 },
      nodes: [node('n1', 96, 118)],
      snappedPositions
    })).toEqual({ x: 100, y: 120 });
  });
});
