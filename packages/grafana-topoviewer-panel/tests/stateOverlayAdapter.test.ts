import { describe, expect, it } from 'vitest';
import type { TopoDocument } from 'topoviewer';
import { createTelemetryOverlay, createTelemetryOverlayExtension } from '../src/stateOverlayAdapter';

const document: TopoDocument = {
  graph: {
    id: 'test',
    nodes: [
      { id: 'a', name: 'A' },
      { id: 'b', name: 'B' }
    ],
    links: [
      { id: 'a-b', source: 'a', target: 'b' }
    ]
  }
};

describe('telemetry overlay adapter', () => {
  it('matches telemetry by link ID and generates link plus endpoint style overlays', () => {
    const overlay = createTelemetryOverlay(document, [
      {
        sourceId: 'layered-network',
        linkId: 'a-b',
        source: 'a',
        target: 'b',
        up: false,
        utilizationPercent: 100
      }
    ], { sourceId: 'layered-network' });

    expect(overlay.diagnostics).toEqual([]);
    expect(overlay.linksById['a-b']?.style).toMatchObject({
      lineColor: '#d32f2f',
      lineStyle: 'dashed',
      label: 'DOWN'
    });
    expect(overlay.nodeStylesById.a).toMatchObject({
      statusColor: '#d32f2f',
      statusPlacement: 'topLeft'
    });
  });

  it('matches telemetry by source and target when link ID is absent', () => {
    const overlay = createTelemetryOverlay(document, [
      {
        sourceId: 'layered-network',
        source: 'a',
        target: 'b',
        up: true,
        utilizationPercent: 84
      }
    ], { sourceId: 'layered-network' });

    expect(overlay.linksById['a-b']?.severity).toBe('warning');
    expect(overlay.linksById['a-b']?.style.lineColor).toBe('#ff9800');
  });

  it('creates a TopoViewer extension that does not mutate the source document', () => {
    const overlay = createTelemetryOverlay(document, [
      { linkId: 'a-b', up: true, utilizationPercent: 93 }
    ]);
    const extension = createTelemetryOverlayExtension(overlay);
    const renderedDocument = extension?.beforeCompile?.(document, {
      document,
      selectedLayerIds: [],
      toggles: {}
    });

    expect(document.graph?.links?.[0]?.style).toBeUndefined();
    expect(renderedDocument?.graph?.links?.[0]?.style).toMatchObject({
      lineColor: '#d32f2f',
      lineWidth: 6
    });
  });
});
