import { describe, expect, it } from 'vitest';
import { composeTopoViewerDocument, type TopoDocument } from '../../src';

describe('composeTopoViewerDocument', () => {
  it('uses one precedence contract for overlapping topology and stylesheet keys', () => {
    const topology: TopoDocument = {
      version: 'topology-version',
      graph: {
        id: 'topology-graph',
        layers: [{ id: 'topology-layer' }],
        nodes: [{ id: 'node-a', layers: ['topology-layer'], position: [10, 20] }]
      },
      diagram: {
        shapes: [{ id: 'shape-a', layers: ['topology-layer'], position: [0, 0] }]
      },
      layout: { mode: 'manual', width: 900, height: 500 },
      limits: { maxNodes: 1000 },
      toggles: [{ id: 'topology-toggle', default: true }],
      attention: { query: { ids: ['node-a'], mode: 'highlight' } },
      icons: {
        router: { glyph: 'T' }
      },
      labelFields: ['topologyLabel'],
      stylesheet: [
        { selector: 'node', style: { backgroundColor: '#111111' } }
      ]
    };
    const stylesheet: TopoDocument = {
      version: 'stylesheet-version',
      graph: {
        id: 'stylesheet-graph',
        layers: [{ id: 'stylesheet-layer' }],
        nodes: [{ id: 'node-b', layers: ['stylesheet-layer'], position: [30, 40] }]
      },
      diagram: {
        callouts: [{ id: 'callout-a', layers: ['stylesheet-layer'], position: [0, 0], body: 'style' }]
      },
      layout: { mode: 'force', width: 300, height: 200 },
      limits: { maxNodes: 12 },
      toggles: [{ id: 'stylesheet-toggle', default: false }],
      attention: { query: { ids: ['node-b'], mode: 'dim-context' } },
      icons: {
        router: { glyph: 'S' },
        service: { glyph: 'VPN' }
      },
      labelFields: ['labels.name', 'role'],
      stylesheet: [
        { selector: 'node', style: { icon: 'router', width: 84 } }
      ]
    };

    const composed = composeTopoViewerDocument(topology, stylesheet);

    expect(composed.graph?.id).toBe('topology-graph');
    expect(composed.diagram?.shapes?.[0]?.id).toBe('shape-a');
    expect(composed.layout).toEqual(topology.layout);
    expect(composed.limits).toEqual(topology.limits);
    expect(composed.toggles).toEqual(topology.toggles);
    expect(composed.attention).toEqual(topology.attention);
    expect(composed.icons).toEqual(stylesheet.icons);
    expect(composed.labelFields).toEqual(stylesheet.labelFields);
    expect(composed.stylesheet).toEqual(stylesheet.stylesheet);
  });

  it('falls back to stylesheet-owned fields when topology omits them', () => {
    const stylesheet: TopoDocument = {
      layout: { mode: 'manual', width: 640, height: 360 },
      limits: { maxNodes: 24 },
      toggles: [{ id: 'showRegions', default: true }],
      icons: { router: { glyph: 'R' } },
      labelFields: ['labels.name'],
      stylesheet: [{ selector: 'node', style: { icon: 'router' } }]
    };

    const composed = composeTopoViewerDocument({
      graph: {
        id: 'fallback-graph',
        nodes: [{ id: 'node-a', position: [0, 0] }]
      }
    }, stylesheet);

    expect(composed.graph?.id).toBe('fallback-graph');
    expect(composed.layout).toEqual(stylesheet.layout);
    expect(composed.limits).toEqual(stylesheet.limits);
    expect(composed.toggles).toEqual(stylesheet.toggles);
    expect(composed.icons).toEqual(stylesheet.icons);
    expect(composed.labelFields).toEqual(stylesheet.labelFields);
    expect(composed.stylesheet).toEqual(stylesheet.stylesheet);
  });
});
