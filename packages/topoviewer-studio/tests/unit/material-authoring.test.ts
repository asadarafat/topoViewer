import { describe, expect, it } from 'vitest';
import type { TopoDocument } from 'topoviewer';
import { resolveStudioQuickEditTarget } from '../../src/app/controllerAuthoring';
import { colorPickerValue, isValidCssColor } from '../../src/ui/StudioColorField';
import {
  mapperCoveragePreviewLimit,
  projectMapperCoverageForStudio
} from '../../src/features/mapper/mapperAnalysisProjection';

const document: TopoDocument = {
  graph: {
    layers: [{ id: 'physical' }],
    nodes: [{ id: 'node-1', name: 'Node one' }, { id: 'node-2', name: 'Node two' }],
    links: [{
      directions: { sourceToTarget: { label: '3 Gbps' } },
      id: 'link-1',
      name: 'Link one',
      source: 'node-1',
      target: 'node-2'
    }],
    paths: [{ id: 'path-1', name: 'Path one', sequence: ['node-1', 'node-2'] }],
    regions: [{ id: 'region-1', name: 'Region one', members: ['node-1'] }]
  },
  diagram: {
    callouts: [{ id: 'callout-1', title: 'Callout title' }],
    shapes: [{ id: 'shape-1', label: 'Shape label' }],
    texts: [{ id: 'text-1', text: 'Standalone text' }]
  }
};

describe('Studio Material authoring contracts', () => {
  it.each([
    [{ id: 'node-1', kind: 'node' }, 'name', 'Node one'],
    [{ id: 'link-1', kind: 'link' }, 'name', 'Link one'],
    [{ id: 'link-1:sourceToTarget', kind: 'linkDirection' }, 'label', '3 Gbps'],
    [{ id: 'path-1', kind: 'path' }, 'name', 'Path one'],
    [{ id: 'region-1', kind: 'region' }, 'name', 'Region one'],
    [{ id: 'shape-1', kind: 'shape' }, 'label', 'Shape label'],
    [{ id: 'callout-1', kind: 'callout' }, 'title', 'Callout title'],
    [{ id: 'text-1', kind: 'text' }, 'text', 'Standalone text']
  ] as const)('resolves %s to its canonical quick-edit field', (selection, field, value) => {
    expect(resolveStudioQuickEditTarget(document, selection)).toMatchObject({ field, value });
  });

  it('preserves CSS text while deriving a deterministic native picker color', () => {
    expect(colorPickerValue('#abc')).toBe('#aabbcc');
    expect(colorPickerValue('rgba(10, 20, 30, 0.5)')).toBe('#0a141e');
    expect(colorPickerValue('var(--topoviewer-accent)')).toBe('#000000');
    expect(isValidCssColor('var(--topoviewer-accent)')).toBe(true);
    expect(isValidCssColor('not a color value')).toBe(false);
  });

  it('bounds mapper detail transfer without changing aggregate coverage', () => {
    const items = Array.from({ length: 100 }, (_, sampleIndex) => ({
      message: `Resolved sample ${sampleIndex}`,
      metric: 'health',
      objectIds: ['node-1'],
      sampleIndex,
      status: 'resolved' as const
    }));
    const summary = { ambiguous: 0, duplicate: 0, ignored: 0, invalid: 0, resolved: 100, unresolved: 0 };

    const projected = projectMapperCoverageForStudio({ items, summary });

    expect(projected.totalItems).toBe(100);
    expect(projected.coverage.items).toHaveLength(mapperCoveragePreviewLimit);
    expect(projected.coverage.summary).toBe(summary);
  });
});
