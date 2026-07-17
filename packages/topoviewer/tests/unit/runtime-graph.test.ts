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

  it('drops stale resize measurements when a source dimension returns to auto sizing', () => {
    const current = {
      height: 96,
      id: 'text-1',
      measured: { height: 96, width: 280 },
      position: { x: 20, y: 40 },
      style: { height: 96, width: 280 },
      width: 280
    };

    const [restored] = preserveRuntimeNodeMeasurements([{
      id: 'text-1',
      position: current.position,
      style: { height: 'max-content', maxWidth: 520, width: 'max-content' }
    }], [current]) as Array<Record<string, unknown>>;

    expect(restored).not.toHaveProperty('measured');
    expect(restored).not.toHaveProperty('width');
    expect(restored.style).toMatchObject({ height: 'max-content', width: 'max-content' });
  });
});
