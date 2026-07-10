import { describe, expect, it } from 'vitest';
import { missingEdgeEndpointIds } from '../../src/components/edgeEndpointInternals';

describe('edge endpoint internals', () => {
  it('returns each endpoint that still lacks measured handle geometry once', () => {
    const nodes = new Map<string, { handles?: unknown[]; internals?: { handleBounds?: unknown } }>([
      ['ready', { internals: { handleBounds: { source: [], target: [] } } }],
      ['declared', { handles: [{ id: 'port-1' }] }],
      ['missing', { internals: {} }]
    ]);

    expect(missingEdgeEndpointIds([
      { source: 'ready', target: 'missing' },
      { source: 'missing', target: 'declared' }
    ], (id) => nodes.get(id))).toEqual(['missing']);
  });
});
