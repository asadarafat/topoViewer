import { describe, expect, it } from 'vitest';
import {
  parseTopologyText,
  releaseNodeFromRegion,
  setRegionAggregateExpanded,
  updateGraphNodePositionAndRegionMembership,
  updatePositionedObjectGeometry,
  updatePositionedObjectPosition,
  updateRegionMemberPositions
} from '../../src/shared/topologyMutations';
import {
  applyCanvasAuthoringCommand,
  canRunCanvasMutation,
  canvasAuthoringCommandLabel,
  clientPointToTopologyPoint,
  defaultCanvasAuthoringState,
  isCanvasMutatingTool,
  isNodePresetTool,
  layersForAuthoringIntent,
  layersForCanvasCreation,
  layersForCanvasTool,
  layersForInsertObjectType,
  nodeIdsWithinCanvasBounds,
  objectSelectionsWithinCanvasBounds,
  normalizedCanvasRect,
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
  '    - id: paths',
  '      name: Paths',
  '    - id: annotations',
  '      name: Annotations',
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
  '      layers: [annotations]',
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
    const nonPresetTools: CanvasAuthoringTool[] = ['select', 'pan', 'link', 'path', 'region', 'callout', 'shape'];

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

  it('normalizes drag rectangles regardless of pointer direction', () => {
    expect(normalizedCanvasRect({ x: 360, y: 240 }, { x: 120, y: 80 })).toEqual({
      height: 160,
      width: 240,
      x: 120,
      y: 80
    });
  });

  it('derives region members from node positions and selected layers', () => {
    const document = parseTopologyText(baseTopology);

    expect(nodeIdsWithinCanvasBounds(document, { height: 80, width: 260, x: 80, y: 90 }, ['physical'])).toEqual(['node-a', 'node-b']);
    expect(nodeIdsWithinCanvasBounds(document, { height: 80, width: 260, x: 80, y: 90 }, ['paths'])).toEqual([]);
    expect(nodeIdsWithinCanvasBounds(document, { height: 80, width: 80, x: 80, y: 90 }, ['physical'])).toEqual(['node-a']);
  });

  it('derives canvas marquee selections from positioned object families', () => {
    const topology = baseTopology.replace('  regions: []', [
      '  regions:',
      '    - id: region-a',
      '      members: [node-a]',
      '      position: [80, 80]',
      '      size: [220, 140]',
      '      layers: [physical]'
    ].join('\n')).replace('  callouts: []', [
      '  callouts:',
      '    - id: callout-a',
      '      title: Existing Callout',
      '      target: node-a',
      '      position: [340, 220]',
      '      layers: [annotations]'
    ].join('\n'));
    const document = parseTopologyText(topology);

    expect(objectSelectionsWithinCanvasBounds(document, { height: 260, width: 330, x: 70, y: 70 }, [])).toEqual([
      { kind: 'node', id: 'node-a' },
      { kind: 'node', id: 'node-b' },
      { kind: 'region', id: 'region-a' },
      { kind: 'shape', id: 'shape-a' },
      { kind: 'callout', id: 'callout-a' }
    ]);
    expect(objectSelectionsWithinCanvasBounds(document, { height: 260, width: 330, x: 70, y: 70 }, ['annotations'])).toEqual([
      { kind: 'shape', id: 'shape-a' },
      { kind: 'callout', id: 'callout-a' }
    ]);
  });

  it('uses selected layers for creation with a deterministic fallback', () => {
    expect(layersForCanvasCreation(['paths', ''], 'physical')).toEqual(['paths']);
    expect(layersForCanvasCreation([], 'physical')).toEqual(['physical']);
  });

  it('uses semantic default authoring layers before visible layer selection', () => {
    expect(layersForAuthoringIntent('physical', ['paths', 'annotations'])).toEqual(['physical', 'paths', 'annotations']);
    expect(layersForCanvasTool('node', ['paths'])).toEqual(['physical', 'paths']);
    expect(layersForCanvasTool('link', ['annotations'])).toEqual(['physical', 'annotations']);
    expect(layersForCanvasTool('path', ['physical'])).toEqual(['paths', 'physical']);
    expect(layersForCanvasTool('callout', ['physical'])).toEqual(['annotations', 'physical']);
    expect(layersForCanvasTool('shape', ['physical'])).toEqual(['annotations', 'physical']);
    expect(layersForInsertObjectType('path', ['physical'])).toEqual(['paths', 'physical']);
    expect(layersForInsertObjectType('callout', ['physical'])).toEqual(['annotations', 'physical']);
  });
});

describe('canvas authoring command mutations', () => {
  it('places node presets at explicit topology coordinates', () => {
    const result = applyCanvasAuthoringCommand(baseTopology, {
      layers: ['physical'],
      position: { x: 438.7, y: 221.2 },
      preset: 'router',
      type: 'insertNodeAt'
    });
    const document = parseTopologyText(result.text);
    const router = document.graph.nodes.find((node: any) => node.id === 'router-1');

    expect(canvasAuthoringCommandLabel({
      layers: ['physical'],
      position: { x: 438.7, y: 221.2 },
      preset: 'router',
      type: 'insertNodeAt'
    })).toBe('Place router');
    expect(router).toMatchObject({
      name: 'New Router',
      labels: { role: 'router' },
      layers: ['physical'],
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

  it('normalizes default canvas links to topology node order', () => {
    const result = applyCanvasAuthoringCommand(baseTopology, {
      layers: ['physical'],
      source: { nodeId: 'node-b' },
      target: { nodeId: 'node-a' },
      type: 'insertLinkBetween'
    });
    const document = parseTopologyText(result.text);

    expect(document.graph.links).toEqual([{
      id: 'link-1',
      name: 'New Link',
      source: 'node-a',
      target: 'node-b',
      labels: { layer: 'physical' },
      layers: ['physical']
    }]);
  });

  it('preserves explicit handle direction for canvas links', () => {
    const result = applyCanvasAuthoringCommand(baseTopology, {
      layers: ['physical'],
      source: { handleId: 'e1-2', nodeId: 'node-b' },
      target: { handleId: 'e1-1', nodeId: 'node-a' },
      type: 'insertLinkBetween'
    });
    const document = parseTopologyText(result.text);

    expect(document.graph.links).toEqual([{
      id: 'link-1',
      name: 'New Link',
      source: 'node-b',
      sourceHandle: 'e1-2',
      target: 'node-a',
      targetHandle: 'e1-1',
      labels: { layer: 'physical' },
      layers: ['physical']
    }]);
  });

  it('rejects canvas path commands when nodes have no link reachability', () => {
    expect(() => applyCanvasAuthoringCommand(baseTopology, {
      layers: ['paths'],
      sequence: ['node-a', 'node-b'],
      type: 'insertPathSequence'
    })).toThrow('Path segment "node-a" -> "node-b" requires graph reachability through existing links.');
  });

  it('maps loose reachable canvas paths without creating phantom links', () => {
    const topologyWithReachability = baseTopology
      .replace('    - id: node-b', [
        '    - id: node-c',
        '      name: Node C',
        '      layers: [physical]',
        '      position: [500, 120]',
        '    - id: node-b'
      ].join('\n'))
      .replace('  links: []', [
        '  links:',
        '    - id: link-a-b',
        '      source: node-a',
        '      target: node-b',
        '    - id: link-b-c',
        '      source: node-b',
        '      target: node-c'
      ].join('\n'));
    const result = applyCanvasAuthoringCommand(topologyWithReachability, {
      layers: ['paths'],
      sequence: ['node-a', 'node-c'],
      type: 'insertPathSequence'
    });
    const document = parseTopologyText(result.text);

    expect(document.graph.paths).toEqual([{
      id: 'path-1',
      name: 'New Path',
      labels: { path: 'paths' },
      layers: ['paths'],
      sequence: ['node-a', 'node-c']
    }]);
    expect(document.graph.links).toEqual([
      { id: 'link-a-b', source: 'node-a', target: 'node-b' },
      { id: 'link-b-c', source: 'node-b', target: 'node-c' }
    ]);
  });

  it('maps canvas paths over existing links without mutating link YAML', () => {
    const topologyWithLink = baseTopology.replace('  links: []', [
      '  links:',
      '    - id: link-ab',
      '      source: node-a',
      '      target: node-b'
    ].join('\n'));
    const result = applyCanvasAuthoringCommand(topologyWithLink, {
      layers: ['paths'],
      sequence: ['node-a', 'node-b'],
      type: 'insertPathSequence'
    });
    const document = parseTopologyText(result.text);

    expect(document.graph.links).toEqual([{
      id: 'link-ab',
      source: 'node-a',
      target: 'node-b'
    }]);
    expect(document.graph.paths).toEqual([{
      id: 'path-1',
      name: 'New Path',
      labels: { path: 'paths' },
      layers: ['paths'],
      sequence: ['node-a', 'node-b']
    }]);
  });

  it('maps canvas region commands to selected node members', () => {
    const result = applyCanvasAuthoringCommand(baseTopology, {
      layers: ['physical'],
      members: ['node-a', 'node-b'],
      type: 'insertRegionFromSelection'
    });
    const document = parseTopologyText(result.text);

    expect(document.graph.regions).toEqual([{
      id: 'region-1',
      name: 'New Region',
      labels: { scope: 'physical' },
      members: ['node-a', 'node-b'],
      layers: ['physical'],
      paddingX: 34,
      paddingY: 28,
      headerPadding: 34,
      style: {
        draggable: true,
        selectable: true
      }
    }]);
  });

  it('creates empty placed canvas regions as persistent containers', () => {
    const result = applyCanvasAuthoringCommand(baseTopology, {
      bounds: { height: 150, width: 280, x: 210, y: 180 },
      layers: ['physical'],
      members: [],
      type: 'insertRegionFromBounds'
    });
    const document = parseTopologyText(result.text);

    expect(document.graph.regions).toEqual([{
      id: 'region-1',
      name: 'New Region',
      labels: { scope: 'physical' },
      members: [],
      position: [210, 180],
      size: [280, 150],
      layers: ['physical'],
      paddingX: 34,
      paddingY: 28,
      headerPadding: 34,
      style: {
        draggable: true,
        selectable: true
      }
    }]);
  });

  it('maps canvas region bounds commands to region YAML', () => {
    const result = applyCanvasAuthoringCommand(baseTopology, {
      bounds: { height: 120, width: 260, x: 80, y: 80 },
      layers: ['physical'],
      members: ['node-a', 'node-b'],
      type: 'insertRegionFromBounds'
    });
    const document = parseTopologyText(result.text);

    expect(document.graph.regions).toEqual([{
      id: 'region-1',
      name: 'New Region',
      labels: { scope: 'physical' },
      members: ['node-a', 'node-b'],
      position: [80, 80],
      size: [260, 120],
      layers: ['physical'],
      paddingX: 34,
      paddingY: 28,
      headerPadding: 34,
      style: {
        draggable: true,
        selectable: true
      }
    }]);
  });

  it('keeps canvas-created regions exclusive at the sibling level', () => {
    const first = applyCanvasAuthoringCommand(baseTopology, {
      layers: ['physical'],
      members: ['node-a', 'node-b'],
      type: 'insertRegionFromSelection'
    });
    const second = applyCanvasAuthoringCommand(first.text, {
      layers: ['physical'],
      members: ['node-b'],
      type: 'insertRegionFromSelection'
    });
    const document = parseTopologyText(second.text);

    expect(document.graph.regions.map((region: any) => ({
      id: region.id,
      members: region.members
    }))).toEqual([
      { id: 'region-1', members: ['node-a'] },
      { id: 'region-2', members: ['node-b'] }
    ]);
  });

  it('assigns moved nodes to containing explicit regions without implicit release', () => {
    const topology = baseTopology.replace('  regions: []', [
      '  regions:',
      '    - id: region-a',
      '      members: []',
      '      position: [180, 80]',
      '      size: [260, 180]',
      '      layers: [physical]',
      '    - id: region-b',
      '      members: []',
      '      position: [500, 80]',
      '      size: [220, 180]',
      '      layers: [physical]'
    ].join('\n'));
    const movedIntoA = updateGraphNodePositionAndRegionMembership(topology, {
      nodeId: 'node-a',
      position: { x: 210, y: 120 }
    });
    const movedOutside = updateGraphNodePositionAndRegionMembership(movedIntoA.text, {
      nodeId: 'node-a',
      position: { x: 20, y: 20 }
    });
    const movedIntoB = updateGraphNodePositionAndRegionMembership(movedOutside.text, {
      nodeId: 'node-a',
      position: { x: 540, y: 120 }
    });
    const document = parseTopologyText(movedIntoB.text);

    expect(document.graph.nodes.find((node: any) => node.id === 'node-a').position).toEqual([540, 120]);
    expect(document.graph.regions.find((region: any) => region.id === 'region-a').members).toEqual([]);
    expect(document.graph.regions.find((region: any) => region.id === 'region-b').members).toEqual(['node-a']);
  });

  it('releases nodes from explicit regions without deleting the empty container', () => {
    const topology = baseTopology.replace('  regions: []', [
      '  regions:',
      '    - id: region-a',
      '      members: [node-a]',
      '      position: [80, 80]',
      '      size: [260, 180]',
      '      layers: [physical]'
    ].join('\n'));
    const released = releaseNodeFromRegion(topology, {
      nodeId: 'node-a',
      regionId: 'region-a'
    });
    const document = parseTopologyText(released.text);

    expect(document.graph.regions).toEqual([{
      id: 'region-a',
      members: [],
      position: [80, 80],
      size: [260, 180],
      layers: ['physical']
    }]);
  });

  it('persists region group movement by translating member node positions', () => {
    const withRegion = applyCanvasAuthoringCommand(baseTopology, {
      layers: ['physical'],
      members: ['node-a', 'node-b'],
      type: 'insertRegionFromSelection'
    });
    const moved = updateRegionMemberPositions(withRegion.text, {
      delta: { x: 40, y: -30 },
      regionId: 'region-1'
    });
    const document = parseTopologyText(moved.text);

    expect(document.graph.nodes.find((node: any) => node.id === 'node-a').position).toEqual([140, 90]);
    expect(document.graph.nodes.find((node: any) => node.id === 'node-b').position).toEqual([340, 90]);
  });

  it('persists parent region movement through child region members', () => {
    const nestedRegions = baseTopology.replace('  regions: []', [
      '  regions:',
      '    - id: region-parent',
      '      members: [node-a]',
      '      layers: [physical]',
      '    - id: region-child',
      '      parent: region-parent',
      '      members: [node-b]',
      '      layers: [physical]'
    ].join('\n'));
    const moved = updateRegionMemberPositions(nestedRegions, {
      delta: { x: -25, y: 45 },
      regionId: 'region-parent'
    });
    const document = parseTopologyText(moved.text);

    expect(document.graph.nodes.find((node: any) => node.id === 'node-a').position).toEqual([75, 165]);
    expect(document.graph.nodes.find((node: any) => node.id === 'node-b').position).toEqual([275, 165]);
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

  it('aligns positioned selections by shared bounds', () => {
    const result = applyCanvasAuthoringCommand(baseTopology, {
      alignment: 'bottom',
      selections: [
        { kind: 'node', id: 'node-a' },
        { kind: 'node', id: 'node-b' },
        { kind: 'shape', id: 'shape-a' }
      ],
      type: 'alignSelection'
    });
    const document = parseTopologyText(result.text);

    expect(document.graph.nodes.find((node: any) => node.id === 'node-a').position).toEqual([100, 266]);
    expect(document.graph.nodes.find((node: any) => node.id === 'node-b').position).toEqual([300, 266]);
    expect(document.diagram.shapes.find((shape: any) => shape.id === 'shape-a').position).toEqual([160, 260]);
  });

  it('distributes positioned selections horizontally without moving the outer anchors', () => {
    const topology = baseTopology.replace('  links: []', [
      '    - id: node-c',
      '      name: Node C',
      '      layers: [physical]',
      '      position: [600, 180]',
      '  links: []'
    ].join('\n'));
    const result = applyCanvasAuthoringCommand(topology, {
      axis: 'horizontal',
      selections: [
        { kind: 'node', id: 'node-a' },
        { kind: 'node', id: 'node-b' },
        { kind: 'node', id: 'node-c' }
      ],
      type: 'distributeSelection'
    });
    const document = parseTopologyText(result.text);

    expect(document.graph.nodes.find((node: any) => node.id === 'node-a').position).toEqual([100, 120]);
    expect(document.graph.nodes.find((node: any) => node.id === 'node-b').position).toEqual([350, 120]);
    expect(document.graph.nodes.find((node: any) => node.id === 'node-c').position).toEqual([600, 180]);
  });

  it('snaps positioned selections to a configurable grid', () => {
    const topology = baseTopology
      .replace('position: [100, 120]', 'position: [107, 129]')
      .replace('position: [160, 260]', 'position: [171, 253]');
    const result = applyCanvasAuthoringCommand(topology, {
      gridSize: 20,
      selections: [
        { kind: 'node', id: 'node-a' },
        { kind: 'shape', id: 'shape-a' }
      ],
      type: 'snapSelectionToGrid'
    });
    const document = parseTopologyText(result.text);

    expect(document.graph.nodes.find((node: any) => node.id === 'node-a').position).toEqual([100, 120]);
    expect(document.diagram.shapes.find((shape: any) => shape.id === 'shape-a').position).toEqual([180, 260]);
  });

  it('rejects arrange commands that do not have enough positioned objects', () => {
    expect(() => applyCanvasAuthoringCommand(baseTopology, {
      alignment: 'left',
      selections: [{ kind: 'node', id: 'node-a' }],
      type: 'alignSelection'
    })).toThrow('Align selection requires at least two positioned objects.');
    expect(() => applyCanvasAuthoringCommand(baseTopology, {
      axis: 'horizontal',
      selections: [
        { kind: 'node', id: 'node-a' },
        { kind: 'node', id: 'node-b' }
      ],
      type: 'distributeSelection'
    })).toThrow('Distribute selection requires at least three positioned objects.');
  });

  it('places targeted callouts with explicit placement coordinates', () => {
    const result = applyCanvasAuthoringCommand(baseTopology, {
      layers: ['annotations'],
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
      layers: ['annotations']
    }]);
  });

  it('places canvas shapes as annotation-layer diagram objects', () => {
    const result = applyCanvasAuthoringCommand(baseTopology, {
      layers: ['annotations'],
      position: { x: 260, y: 180 },
      size: { width: 210, height: 110 },
      type: 'insertShapeAt'
    });
    const document = parseTopologyText(result.text);

    expect(document.diagram.shapes.find((shape: any) => shape.id === 'shape-1')).toEqual({
      id: 'shape-1',
      name: 'New Shape',
      type: 'rectangle',
      position: [260, 180],
      size: [210, 110],
      layers: ['annotations']
    });
  });

  it('persists direct shape and callout movement through shared positioned-object updates', () => {
    const withShape = applyCanvasAuthoringCommand(baseTopology, {
      layers: ['annotations'],
      position: { x: 260, y: 180 },
      type: 'insertShapeAt'
    });
    const withCallout = applyCanvasAuthoringCommand(withShape.text, {
      layers: ['annotations'],
      position: { x: 120, y: 80 },
      type: 'insertCalloutAt'
    });
    const movedShape = updatePositionedObjectPosition(withCallout.text, {
      position: { x: 300, y: 220 },
      selection: { kind: 'shape', id: 'shape-1' }
    });
    const movedCallout = updatePositionedObjectPosition(movedShape.text, {
      position: { x: 180, y: 130 },
      selection: { kind: 'callout', id: 'callout-1' }
    });
    const document = parseTopologyText(movedCallout.text);

    expect(document.diagram.shapes.find((shape: any) => shape.id === 'shape-1').position).toEqual([300, 220]);
    expect(document.diagram.callouts.find((callout: any) => callout.id === 'callout-1').position).toEqual([180, 130]);
  });

  it('persists shape, callout, and region resize geometry through shared positioned-object updates', () => {
    const withRegion = baseTopology.replace('  regions: []', [
      '  regions:',
      '    - id: region-a',
      '      members: [node-a]',
      '      position: [80, 70]',
      '      size: [220, 140]',
      '      layers: [physical]'
    ].join('\n')).replace('  callouts: []', [
      '  callouts:',
      '    - id: callout-a',
      '      title: Existing Callout',
      '      position: [340, 220]',
      '      size: [160, 88]',
      '      layers: [annotations]'
    ].join('\n'));
    const resizedShape = updatePositionedObjectGeometry(withRegion, {
      position: { x: 170, y: 250 },
      selection: { kind: 'shape', id: 'shape-a' },
      size: { width: 240, height: 130 }
    });
    const resizedCallout = updatePositionedObjectGeometry(resizedShape.text, {
      position: { x: 360, y: 230 },
      selection: { kind: 'callout', id: 'callout-a' },
      size: { width: 220, height: 110 }
    });
    const resizedRegion = updatePositionedObjectGeometry(resizedCallout.text, {
      position: { x: 60, y: 50 },
      selection: { kind: 'region', id: 'region-a' },
      size: { width: 320, height: 180 }
    });
    const document = parseTopologyText(resizedRegion.text);

    expect(document.diagram.shapes.find((shape: any) => shape.id === 'shape-a')).toMatchObject({
      position: [170, 250],
      size: [240, 130]
    });
    expect(document.diagram.callouts.find((callout: any) => callout.id === 'callout-a')).toMatchObject({
      position: [360, 230],
      size: [220, 110]
    });
    expect(document.graph.regions.find((region: any) => region.id === 'region-a')).toMatchObject({
      position: [60, 50],
      size: [320, 180]
    });
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

  it('duplicates positioned canvas selections with deterministic IDs and rewritten references', () => {
    const topology = baseTopology.replace('  regions: []', [
      '  regions:',
      '    - id: region-a',
      '      members: [node-a, node-b]',
      '      position: [72, 84]',
      '      size: [320, 140]',
      '      layers: [physical]'
    ].join('\n')).replace('  callouts: []', [
      '  callouts:',
      '    - id: callout-a',
      '      title: Existing Callout',
      '      target: node-a',
      '      position: [340, 220]',
      '      layers: [annotations]'
    ].join('\n'));
    const result = applyCanvasAuthoringCommand(topology, {
      offset: { x: 32, y: 32 },
      selections: [
        { kind: 'node', id: 'node-a' },
        { kind: 'region', id: 'region-a' },
        { kind: 'shape', id: 'shape-a' },
        { kind: 'callout', id: 'callout-a' }
      ],
      type: 'duplicateSelection'
    });
    const document = parseTopologyText(result.text);

    expect(document.graph.nodes.find((node: any) => node.id === 'node-a-1')).toMatchObject({
      name: 'Node A Copy',
      position: [132, 152]
    });
    expect(document.graph.regions.find((region: any) => region.id === 'region-a-1')).toMatchObject({
      members: ['node-a-1'],
      position: [104, 116],
      size: [320, 140]
    });
    expect(document.diagram.shapes.find((shape: any) => shape.id === 'shape-a-1')).toMatchObject({
      name: 'Shape A Copy',
      position: [192, 292]
    });
    expect(document.diagram.callouts.find((callout: any) => callout.id === 'callout-a-1')).toMatchObject({
      target: 'node-a-1',
      position: [372, 252]
    });
  });

  it('rejects duplicate commands when no supported positioned objects are selected', () => {
    expect(() => applyCanvasAuthoringCommand(baseTopology, {
      offset: { x: 32, y: 32 },
      selections: [{ kind: 'link', id: 'link-a' }],
      type: 'duplicateSelection'
    })).toThrow('Duplicate selection requires a node, region, shape, or callout.');
  });

  it('persists region collapse and expand through attention aggregate groups', () => {
    const withRegion = applyCanvasAuthoringCommand(baseTopology, {
      bounds: { x: 72, y: 84, width: 320, height: 140 },
      layers: ['physical'],
      members: ['node-a', 'node-b'],
      type: 'insertRegionFromBounds'
    });
    const collapsed = setRegionAggregateExpanded(withRegion.text, {
      expanded: false,
      regionId: 'region-1'
    });
    const collapsedDocument = parseTopologyText(collapsed.text);

    expect(collapsedDocument.attention.aggregate.groups).toEqual([{
      id: 'summary-region-1',
      by: 'region',
      regionId: 'region-1'
    }]);
    expect(collapsedDocument.attention.aggregate.expandedGroupIds).toEqual([]);
    expect(collapsedDocument.attention.aggregate.expandOnClick).toBe(true);

    const expanded = setRegionAggregateExpanded(collapsed.text, {
      expanded: true,
      groupId: 'summary-region-1',
      regionId: 'region-1'
    });
    const expandedDocument = parseTopologyText(expanded.text);
    expect(expandedDocument.attention.aggregate.groups).toHaveLength(1);
    expect(expandedDocument.attention.aggregate.expandedGroupIds).toEqual(['summary-region-1']);
  });
});
