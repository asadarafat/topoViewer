import { describe, expect, it } from 'vitest';
import {
  classifyTopoRenderState,
  compileTopoGraph,
  compileTopoGraphResult,
  type TopoDocument
} from '../../src';

const validDocument: TopoDocument = {
  graph: {
    id: 'safe-compile',
    layers: [{ id: 'physical' }],
    nodes: [{ id: 'router-a', layers: ['physical'], position: [40, 40] }]
  },
  layout: { mode: 'manual' }
};

describe('safe rendering contract', () => {
  it('returns a discriminated success result for valid input', () => {
    const result = compileTopoGraphResult(validDocument, ['physical']);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.graph.nodes.map((node) => node.id)).toEqual(['router-a']);
      expect(result.diagnostics).toEqual([]);
    }
  });

  it('returns a stable validation diagnostic instead of throwing', () => {
    const result = compileTopoGraphResult({
      graph: { nodes: [{ id: '' }] }
    });

    expect(result).toMatchObject({
      ok: false,
      diagnostics: [{ code: 'validation-error', severity: 'error' }]
    });
  });

  it('returns renderer-limit diagnostics instead of throwing', () => {
    const result = compileTopoGraphResult({
      limits: { maxNodes: 1 },
      graph: {
        layers: [{ id: 'physical' }],
        nodes: [
          { id: 'router-a', layers: ['physical'] },
          { id: 'router-b', layers: ['physical'] }
        ]
      }
    });

    expect(result).toMatchObject({
      ok: false,
      diagnostics: [{ code: 'renderer-limit', severity: 'error' }]
    });
  });

  it('distinguishes source-empty and filtered-empty graphs', () => {
    expect(classifyTopoRenderState({ graph: { layers: [{ id: 'physical' }] } }, {
      nodes: [],
      edges: [],
      selectedLayerIds: ['physical']
    })).toBe('empty');

    expect(classifyTopoRenderState(validDocument, {
      nodes: [],
      edges: [],
      selectedLayerIds: ['logical']
    })).toBe('filtered-empty');

    expect(classifyTopoRenderState(validDocument, {
      nodes: [{ id: 'router-a' } as never],
      edges: [],
      selectedLayerIds: ['physical']
    })).toBe('ready');
  });

  it('keeps canonical identity, endpoint aliases, and status in accessible names', () => {
    const graph = compileTopoGraph({
      graph: {
        layers: [{ id: 'physical' }],
        nodes: [
          { id: 'router-a', labels: { name: 'Router Alpha', status: 'degraded' }, layers: ['physical'] },
          { id: 'router-b', labels: { name: 'Router Beta' }, layers: ['physical'] }
        ],
        links: [{
          id: 'router-a-router-b',
          labels: { name: 'Primary circuit', severity: 'critical' },
          source: 'router-a',
          target: 'router-b',
          layers: ['physical']
        }]
      }
    }, ['physical']);

    expect(graph.nodes.find((node) => node.id === 'router-a')?.ariaLabel)
      .toBe('node Router Alpha (router-a), status warning');
    expect(graph.edges[0]?.ariaLabel)
      .toBe('link Primary circuit (router-a-router-b), from Router Alpha (router-a) to Router Beta (router-b), status critical');
  });
});
