import { describe, expect, it } from 'vitest';
import type { EdgeChange } from '@xyflow/react';
import { preserveSourceOwnedEdges } from '../../src/components/runtimeGraph';

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
});
