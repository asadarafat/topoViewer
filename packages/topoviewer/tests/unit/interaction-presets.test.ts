import { describe, expect, it } from 'vitest';
import {
  TOPOVIEWER_GUIDED_AUTHORING_INTERACTIONS,
  TOPOVIEWER_RAPID_AUTHORING_INTERACTIONS,
  TOPOVIEWER_RUNTIME_INTERACTIONS,
  type TopoViewerInteractionPreset
} from '../../src';

function expectFrozenPreset(preset: TopoViewerInteractionPreset) {
  expect(Object.isFrozen(preset)).toBe(true);
  if (Array.isArray(preset.panOnDrag)) expect(Object.isFrozen(preset.panOnDrag)).toBe(true);
  expect(Object.keys(preset).sort()).toEqual([
    'connectionHandleMode',
    'nodesConnectable',
    'nodesDraggable',
    'nodesResizable',
    'panOnDrag',
    'selectionMode',
    'selectionOnDrag'
  ]);
}

describe('TopoViewer interaction presets', () => {
  it('publishes a non-authoring runtime contract', () => {
    expectFrozenPreset(TOPOVIEWER_RUNTIME_INTERACTIONS);
    expect(TOPOVIEWER_RUNTIME_INTERACTIONS).toEqual({
      connectionHandleMode: 'full-node',
      nodesConnectable: false,
      nodesDraggable: false,
      nodesResizable: false,
      panOnDrag: true,
      selectionMode: 'full',
      selectionOnDrag: false
    });
  });

  it('publishes guided shape-handle authoring with drag selection', () => {
    expectFrozenPreset(TOPOVIEWER_GUIDED_AUTHORING_INTERACTIONS);
    expect(TOPOVIEWER_GUIDED_AUTHORING_INTERACTIONS).toEqual({
      connectionHandleMode: 'shape-handles',
      nodesConnectable: true,
      nodesDraggable: true,
      nodesResizable: true,
      panOnDrag: [1, 2],
      selectionMode: 'partial',
      selectionOnDrag: true
    });
  });

  it('limits rapid authoring divergence to full-node connection targets', () => {
    expectFrozenPreset(TOPOVIEWER_RAPID_AUTHORING_INTERACTIONS);
    expect(TOPOVIEWER_RAPID_AUTHORING_INTERACTIONS).toEqual({
      ...TOPOVIEWER_GUIDED_AUTHORING_INTERACTIONS,
      connectionHandleMode: 'full-node'
    });
  });
});
