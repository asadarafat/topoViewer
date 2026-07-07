import { describe, expect, it } from 'vitest';
import { parseTopologyText } from '../../src/shared/topologyMutations';
import {
  applyCanvasAuthoringCommand,
  canRunCanvasMutation,
  canvasAuthoringCommandLabel,
  clientPointToTopologyPoint,
  defaultCanvasAuthoringState,
  isCanvasMutatingTool,
  isNodePresetTool,
  layersForCanvasCreation,
  reduceCanvasAuthoringState,
  snapTopologyPoint,
  type CanvasAuthoringTool
} from '../../src/webview/canvasAuthoring';

const baseTopology = [
  'layout:',
  '  mode: manual',
  '  width: 800',
  '  height: 480',
  'graph:',
  '  id: canvas-authoring',
  '  layers:',
  '    - id: physical',
  '      name: Physical',
  '    - id: service',
  '      name: Service',
  '  nodes:',
  '    - id: node-a',
  '      name: Node A',
  '      layers: [physical]',
  '      position: [100, 120]',
  '    - id: node-b',
  '      name: Node B',
  '      layers: [physical]',
  '      position: [300, 120]',
  '  links: []',
  '  paths: []',
  '  regions: []',
  'diagram:',
  '  shapes:',
  '    - id: shape-a',
  '      name: Shape A',
  '      type: rectangle',
  '      layers: [physical]',
  '      position: [160, 260]',
  '      size: [120, 80]',
  '  callouts: []',
  ''
].join('\n');

describe('canvas authoring tools', () => {
  it('classifies topology mutation tools separately from select and pan', () => {
    expect(isCanvasMutatingTool('select')).toBe(false);
    expect(isCanvasMutatingTool('pan')).toBe(false);
    expect(isCanvasMutatingTool('router')).toBe(true);
    expect(isCanvasMutatingTool('link')).toBe(true);
    expect(isCanvasMutatingTool('shape')).toBe(true);
  });

  it('classifies node preset tools', () => {
    const presetTools: CanvasAuthoringTool[] = ['node', 'router', 'service', 'controller', 'external'];
    const nonPresetTools: CanvasAuthoringTool[] = ['select', 'pan', 'link', 'path', 'region', 'callout', 'shape', 'text'];

    expect(presetTools.every(isNodePresetTool)).toBe(true);
    expect(nonPresetTools.some(isNodePresetTool)).toBe(false);
  });

  it('resets one-shot tools after completion and keeps sticky tools active', () => {
    const oneShot = reduceCanvasAuthoringState(defaultCanvasAuthoringState, {
      tool: 'router',
      type: 'selectTool'
    });
    expect(oneShot).toEqual({ activeTool: 'router', sticky: false });
    expect(reduceCanvasAuthoringState(oneShot, { type: 'completeAction' })).toEqual(defaultCanvasAuthoringState);

    const sticky = reduceCanvasAuthoringState(defaultCanvasAuthoringState, {
      sticky: true,
      tool: 'service',
      type: 'selectTool'
    });
    expect(reduceCanvasAuthoringState(sticky, { type: 'completeAction' })).toEqual(sticky);
  });

  it('cancels active tool state back to select', () => {
    const state = reduceCanvasAuthoringState(defaultCanvasAuthoringState, {
      sticky: true,
      tool: 'link',
      type: 'selectTool'
    });

    expect(reduceCanvasAuthoringState(state, { type: 'cancel' })).toEqual(defaultCanvasAuthoringState);
  });

  it('blocks mutating canvas tools while YAML draft is dirty', () => {
    expect(canRunCanvasMutation('select', true)).toBe(true);
    expect(canRunCanvasMutation('pan', true)).toBe(true);
    expect(canRunCanvasMutation('router', true)).toBe(false);
    expect(canRunCanvasMutation('link', true)).toBe(false);
    expect(canRunCanvasMutation('router', false)).toBe(true);
  });
});

describe('canvas authoring coordinates', () => {
  it('converts browser client coordinates into topology coordinates', () => {
    expect(clientPointToTopologyPoint(
      { x: 250, y: 140 },
      { left: 50, top: 40 },
      { x: -100, y: -60, zoom: 2 }
    )).toEqual({ x: 150, y: 80 });
  });

  it('falls back to zoom 1 for invalid viewport zoom', () => {
    expect(clientPointToTopologyPoint(
      { x: 140, y: 90 },
      { left: 40, top: 20 },
      { x: 10, y: -10, zoom: 0 }
    )).toEqual({ x: 90, y: 80 });
  });

  it('snaps topology coordinates to grid when requested', () => {
    expect(snapTopologyPoint({ x: 143, y: 87 }, 20)).toEqual({ x: 140, y: 80 });
    expect(snapTopologyPoint({ x: 143, y: 87 })).toEqual({ x: 143, y: 87 });
  });

  it('uses selected layers for creation with a deterministic fallback', () => {
    expect(layersForCanvasCreation(['service', ''], 'physical')).toEqual(['service']);
    expect(layersForCanvasCreation([], 'physical')).toEqual(['physical']);
  });
});

describe('canvas authoring command mutations', () => {
  it('places node presets at explicit topology coordinates', () => {
    const result = applyCanvasAuthoringCommand(baseTopology, {
      layers: ['service'],
      position: { x: 438.7, y: 221.2 },
      preset: 'router',
      type: 'insertNodeAt'
    });
    const document = parseTopologyText(result.text);
    const router = document.graph.nodes.find((node: any) => node.id === 'router-1');

    expect(canvasAuthoringCommandLabel({
      layers: ['service'],
      position: { x: 438.7, y: 221.2 },
      preset: 'router',
      type: 'insertNodeAt'
    })).toBe('Place router');
    expect(router).toMatchObject({
      name: 'New Router',
      labels: { role: 'router' },
      layers: ['service'],
      position: [439, 221]
    });
  });

  it('maps drag-to-connect commands to graph link YAML', () => {
    const result = applyCanvasAuthoringCommand(baseTopology, {
      layers: ['physical'],
      source: { handleId: 'e1-1', nodeId: 'node-a' },
      target: { handleId: 'e1-2', nodeId: 'node-b' },
      type: 'insertLinkBetween'
    });
    const document = parseTopologyText(result.text);

    expect(document.graph.links).toEqual([{
      id: 'link-1',
      name: 'New Link',
      source: 'node-a',
      sourceHandle: 'e1-1',
      target: 'node-b',
      targetHandle: 'e1-2',
      labels: { layer: 'physical' },
      layers: ['physical']
    }]);
  });

  it('maps canvas path commands to path sequence YAML', () => {
    const result = applyCanvasAuthoringCommand(baseTopology, {
      layers: ['service'],
      sequence: ['node-a', 'node-b'],
      type: 'insertPathSequence'
    });
    const document = parseTopologyText(result.text);

    expect(document.graph.paths).toEqual([{
      id: 'path-1',
      name: 'New Path',
      labels: { path: 'service' },
      layers: ['service'],
      sequence: ['node-a', 'node-b']
    }]);
  });

  it('moves positioned selections in one YAML mutation', () => {
    const result = applyCanvasAuthoringCommand(baseTopology, {
      delta: { x: 25, y: -15 },
      selections: [
        { kind: 'node', id: 'node-a' },
        { kind: 'shape', id: 'shape-a' },
        { kind: 'link', id: 'link-a' }
      ],
      type: 'moveSelection'
    });
    const document = parseTopologyText(result.text);

    expect(document.graph.nodes.find((node: any) => node.id === 'node-a').position).toEqual([125, 105]);
    expect(document.diagram.shapes.find((shape: any) => shape.id === 'shape-a').position).toEqual([185, 245]);
  });

  it('places targeted callouts with explicit placement coordinates', () => {
    const result = applyCanvasAuthoringCommand(baseTopology, {
      layers: ['physical'],
      position: { x: 210, y: 90 },
      target: { kind: 'node', id: 'node-a' },
      type: 'insertCalloutAt'
    });
    const document = parseTopologyText(result.text);

    expect(document.diagram.callouts).toEqual([{
      id: 'callout-1',
      title: 'New Callout',
      body: 'Add context',
      target: 'node-a',
      position: [210, 90],
      size: [160, 88],
      layers: ['physical']
    }]);
  });

  it('deletes selected objects through the shared command boundary', () => {
    const topologyWithDependencies = baseTopology
      .replace('  links: []', [
        '  links:',
        '    - id: link-ab',
        '      source: node-a',
        '      target: node-b'
      ].join('\n'))
      .replace('  paths: []', [
        '  paths:',
        '    - id: path-ab',
        '      sequence: [node-a, node-b]'
      ].join('\n'))
      .replace('  regions: []', [
        '  regions:',
        '    - id: region-a',
        '      members: [node-a, node-b]'
      ].join('\n'))
      .replace('  callouts: []', [
        '  callouts:',
        '    - id: callout-b',
        '      title: Node B note',
        '      target: node-b',
        '      position: [340, 220]'
      ].join('\n'));
    const result = applyCanvasAuthoringCommand(topologyWithDependencies, {
      selections: [
        { kind: 'node', id: 'node-b' },
        { kind: 'shape', id: 'shape-a' }
      ],
      type: 'deleteSelection'
    });
    const document = parseTopologyText(result.text);

    expect(document.graph.nodes.map((node: any) => node.id)).toEqual(['node-a']);
    expect(document.graph.links).toEqual([]);
    expect(document.graph.paths).toEqual([]);
    expect(document.graph.regions).toEqual([{
      id: 'region-a',
      members: ['node-a']
    }]);
    expect(document.diagram.shapes).toEqual([]);
    expect(document.diagram.callouts).toEqual([]);
  });

  it('fails explicitly for command families that are not implemented yet', () => {
    expect(() => applyCanvasAuthoringCommand(baseTopology, {
      bounds: { height: 100, width: 200, x: 80, y: 80 },
      layers: ['physical'],
      members: ['node-a'],
      type: 'insertRegionFromBounds'
    })).toThrow('Canvas region bounds creation is not implemented yet.');

    expect(() => applyCanvasAuthoringCommand(baseTopology, {
      offset: { x: 32, y: 32 },
      selections: [{ kind: 'node', id: 'node-a' }],
      type: 'duplicateSelection'
    })).toThrow('Canvas duplicate is not implemented yet.');
  });
});
