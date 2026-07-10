import { describe, expect, it } from 'vitest';
import type { EdgeChange } from '@xyflow/react';
import { preserveRuntimeNodeMeasurements, preserveSourceOwnedEdges } from '../../src/components/runtimeGraph';

describe('runtime graph ownership', () => {
  it('keeps compiled edges authoritative while allowing transient edge changes', () => {
    const changes: EdgeChange[] = [
      { id: 'source-edge', type: 'remove' },
      { id: 'stale-edge', type: 'remove' },
      { id: 'source-edge', type: 'select', selected: true }
    ];

    expect(preserveSourceOwnedEdges(changes, new Set(['source-edge']))).toEqual([
      { id: 'stale-edge', type: 'remove' },
      { id: 'source-edge', type: 'select', selected: true }
    ]);
  });

  it('retains runtime node identity when the source definition is unchanged', () => {
    const data = { id: 'node-a' };
    const style = { width: 84 };
    const position = { x: 20, y: 40 };
    const current = { id: 'node-a', data, measured: { width: 84, height: 60 }, position, style };

    const [preserved] = preserveRuntimeNodeMeasurements([
      { id: 'node-a', data, position, style }
    ], [current]);

    expect(preserved).toBe(current);
  });

  it('updates changed source fields without dropping runtime measurements', () => {
    const current = {
      id: 'node-a',
      data: { id: 'node-a' },
      measured: { width: 84, height: 60 },
      position: { x: 20, y: 40 },
      selected: false,
      style: { width: 84 }
    };

    const [preserved] = preserveRuntimeNodeMeasurements([
      { ...current, measured: undefined, selected: true }
    ], [current]) as Array<Record<string, unknown>>;

    expect(preserved).not.toBe(current);
    expect(preserved.selected).toBe(true);
    expect(preserved.measured).toEqual({ width: 84, height: 60 });
  });
});
