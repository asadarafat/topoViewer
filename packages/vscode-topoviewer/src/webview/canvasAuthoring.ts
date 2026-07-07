import {
  deleteTopoObjects,
  findObject,
  insertTopoObject,
  mutateTopologyText,
  upsertGraphLink,
  upsertGraphPath,
  type MutationResult,
  type TopoObjectSelection
} from '../shared/topologyMutations';

export type CanvasAuthoringTool =
  | 'select'
  | 'pan'
  | 'node'
  | 'router'
  | 'service'
  | 'controller'
  | 'external'
  | 'link'
  | 'path'
  | 'region'
  | 'callout'
  | 'shape'
  | 'text';

export type CanvasNodePresetTool = Extract<CanvasAuthoringTool, 'node' | 'router' | 'service' | 'controller' | 'external'>;

export type CanvasAuthoringPoint = {
  x: number;
  y: number;
};

export type CanvasAuthoringRect = {
  height: number;
  width: number;
  x: number;
  y: number;
};

export type CanvasAuthoringViewport = {
  x: number;
  y: number;
  zoom: number;
};

export type CanvasEndpointRef = {
  handleId?: string;
  nodeId: string;
};

export type CanvasAuthoringCommand =
  | {
    layers: string[];
    position: CanvasAuthoringPoint;
    preset: CanvasNodePresetTool;
    type: 'insertNodeAt';
  }
  | {
    layers: string[];
    source: CanvasEndpointRef;
    target: CanvasEndpointRef;
    type: 'insertLinkBetween';
  }
  | {
    layers: string[];
    sequence: string[];
    type: 'insertPathSequence';
  }
  | {
    bounds: CanvasAuthoringRect;
    layers: string[];
    members: string[];
    type: 'insertRegionFromBounds';
  }
  | {
    layers: string[];
    position: CanvasAuthoringPoint;
    target?: TopoObjectSelection;
    type: 'insertCalloutAt';
  }
  | {
    delta: CanvasAuthoringPoint;
    selections: TopoObjectSelection[];
    type: 'moveSelection';
  }
  | {
    bounds: CanvasAuthoringRect;
    selection: TopoObjectSelection;
    type: 'resizeObject';
  }
  | {
    offset: CanvasAuthoringPoint;
    selections: TopoObjectSelection[];
    type: 'duplicateSelection';
  }
  | {
    selections: TopoObjectSelection[];
    type: 'deleteSelection';
  };

export type CanvasAuthoringState = {
  activeTool: CanvasAuthoringTool;
  sticky: boolean;
};

export type CanvasAuthoringAction =
  | { tool: CanvasAuthoringTool; type: 'selectTool'; sticky?: boolean }
  | { type: 'cancel' }
  | { type: 'completeAction' };

export const defaultCanvasAuthoringState: CanvasAuthoringState = {
  activeTool: 'select',
  sticky: false
};

const nodePresetTools = new Set<CanvasAuthoringTool>(['node', 'router', 'service', 'controller', 'external']);
const mutatingTools = new Set<CanvasAuthoringTool>([
  'node',
  'router',
  'service',
  'controller',
  'external',
  'link',
  'path',
  'region',
  'callout',
  'shape',
  'text'
]);

export function isNodePresetTool(tool: CanvasAuthoringTool): tool is CanvasNodePresetTool {
  return nodePresetTools.has(tool);
}

export function isCanvasMutatingTool(tool: CanvasAuthoringTool) {
  return mutatingTools.has(tool);
}

export function reduceCanvasAuthoringState(
  state: CanvasAuthoringState,
  action: CanvasAuthoringAction
): CanvasAuthoringState {
  if (action.type === 'selectTool') {
    return {
      activeTool: action.tool,
      sticky: action.sticky ?? false
    };
  }
  if (action.type === 'cancel') {
    return defaultCanvasAuthoringState;
  }
  if (state.sticky) return state;
  return defaultCanvasAuthoringState;
}

export function canRunCanvasMutation(tool: CanvasAuthoringTool, draftDirty: boolean) {
  return !draftDirty || !isCanvasMutatingTool(tool);
}

export function clientPointToTopologyPoint(
  clientPoint: CanvasAuthoringPoint,
  canvasBounds: Pick<DOMRect, 'left' | 'top'>,
  viewport: CanvasAuthoringViewport
): CanvasAuthoringPoint {
  const zoom = Number.isFinite(viewport.zoom) && viewport.zoom > 0 ? viewport.zoom : 1;
  return {
    x: (clientPoint.x - canvasBounds.left - viewport.x) / zoom,
    y: (clientPoint.y - canvasBounds.top - viewport.y) / zoom
  };
}

export function snapTopologyPoint(point: CanvasAuthoringPoint, gridSize?: number): CanvasAuthoringPoint {
  if (!gridSize || !Number.isFinite(gridSize) || gridSize <= 0) return point;
  return {
    x: Math.round(point.x / gridSize) * gridSize,
    y: Math.round(point.y / gridSize) * gridSize
  };
}

export function layersForCanvasCreation(selectedLayerIds: string[], fallbackLayerId: string) {
  const layers = selectedLayerIds.filter((layerId) => layerId.trim().length > 0);
  return layers.length ? [...layers] : [fallbackLayerId];
}

export function canvasAuthoringCommandLabel(command: CanvasAuthoringCommand) {
  if (command.type === 'insertNodeAt') return `Place ${command.preset}`;
  if (command.type === 'insertLinkBetween') return 'Draw link';
  if (command.type === 'insertPathSequence') return 'Create path';
  if (command.type === 'insertRegionFromBounds') return 'Create region';
  if (command.type === 'insertCalloutAt') return 'Place callout';
  if (command.type === 'moveSelection') return 'Move selection';
  if (command.type === 'resizeObject') return 'Resize object';
  if (command.type === 'duplicateSelection') return 'Duplicate selection';
  return 'Delete selection';
}

export function applyCanvasAuthoringCommand(text: string, command: CanvasAuthoringCommand): MutationResult {
  if (command.type === 'insertNodeAt') {
    return insertTopoObject(text, {
      position: command.position,
      selectedLayerIds: command.layers,
      selectedObjects: [],
      type: command.preset
    });
  }

  if (command.type === 'insertLinkBetween') {
    return upsertGraphLink(text, {
      normalizeByNodeOrder: true,
      selectedLayerIds: command.layers,
      source: command.source.nodeId,
      sourceHandle: command.source.handleId,
      target: command.target.nodeId,
      targetHandle: command.target.handleId
    });
  }

  if (command.type === 'insertPathSequence') {
    return upsertGraphPath(text, {
      selectedLayerIds: command.layers,
      sequence: command.sequence
    });
  }

  if (command.type === 'insertCalloutAt') {
    return insertTopoObject(text, {
      position: command.position,
      selectedLayerIds: command.layers,
      selectedObjects: command.target ? [command.target] : [],
      type: 'callout'
    });
  }

  if (command.type === 'moveSelection') {
    return movePositionedSelection(text, command.selections, command.delta);
  }

  if (command.type === 'deleteSelection') {
    return deleteTopoObjects(text, command.selections);
  }

  if (command.type === 'insertRegionFromBounds') {
    throw new Error('Canvas region bounds creation is not implemented yet.');
  }

  if (command.type === 'resizeObject') {
    throw new Error('Canvas resize is not implemented yet.');
  }

  throw new Error('Canvas duplicate is not implemented yet.');
}

function movePositionedSelection(
  text: string,
  selections: TopoObjectSelection[],
  delta: CanvasAuthoringPoint
): MutationResult {
  return mutateTopologyText(text, (document) => {
    let moved = 0;
    selections.forEach((selection) => {
      if (selection.kind !== 'node' && selection.kind !== 'shape' && selection.kind !== 'callout') return;
      const object = findObject(document, selection);
      if (!object) throw new Error(`Selected ${selection.kind} "${selection.id}" no longer exists.`);
      const position = objectPosition(object.position);
      if (!position) throw new Error(`Selected ${selection.kind} "${selection.id}" does not have an editable position.`);
      object.position = [
        Math.round(position.x + delta.x),
        Math.round(position.y + delta.y)
      ];
      moved += 1;
    });
    if (!moved) throw new Error('Move selection requires at least one positioned object.');
  });
}

function objectPosition(value: unknown): CanvasAuthoringPoint | undefined {
  if (Array.isArray(value)) {
    const x = Number(value[0]);
    const y = Number(value[1]);
    return Number.isFinite(x) && Number.isFinite(y) ? { x, y } : undefined;
  }
  if (!value || typeof value !== 'object') return undefined;
  const candidate = value as { x?: unknown; y?: unknown };
  const x = Number(candidate.x);
  const y = Number(candidate.y);
  return Number.isFinite(x) && Number.isFinite(y) ? { x, y } : undefined;
}
