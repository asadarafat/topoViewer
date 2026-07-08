import {
  deleteTopoObjects,
  findObject,
  insertTopoObject,
  mutateTopologyText,
  upsertGraphLink,
  upsertGraphPath,
  type MutationResult,
  type InsertObjectType,
  type TopoObjectPreset,
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
    members: string[];
    type: 'insertRegionFromSelection';
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

export function normalizedCanvasRect(start: CanvasAuthoringPoint, end: CanvasAuthoringPoint): CanvasAuthoringRect {
  const x = Math.min(start.x, end.x);
  const y = Math.min(start.y, end.y);
  return {
    height: Math.abs(end.y - start.y),
    width: Math.abs(end.x - start.x),
    x,
    y
  };
}

function numericPosition(value: unknown): CanvasAuthoringPoint | undefined {
  if (Array.isArray(value) && value.length >= 2) {
    const [x, y] = value;
    if (typeof x === 'number' && typeof y === 'number' && Number.isFinite(x) && Number.isFinite(y)) return { x, y };
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if (typeof record.x === 'number' && typeof record.y === 'number' && Number.isFinite(record.x) && Number.isFinite(record.y)) {
      return { x: record.x, y: record.y };
    }
  }
  return undefined;
}

function hasLayerIntersection(objectLayers: unknown, selectedLayerIds: string[]) {
  if (!selectedLayerIds.length) return true;
  if (!Array.isArray(objectLayers) || objectLayers.length === 0) return true;
  const selected = new Set(selectedLayerIds);
  return objectLayers.some((layerId) => selected.has(String(layerId)));
}

export function nodeIdsWithinCanvasBounds(
  document: Record<string, any> | undefined,
  bounds: CanvasAuthoringRect,
  selectedLayerIds: string[] = []
) {
  const maxX = bounds.x + bounds.width;
  const maxY = bounds.y + bounds.height;
  return (document?.graph?.nodes || [])
    .filter((node: any) => {
      if (!hasLayerIntersection(node.layers, selectedLayerIds)) return false;
      const position = numericPosition(node.position);
      if (!position) return false;
      return position.x >= bounds.x && position.x <= maxX && position.y >= bounds.y && position.y <= maxY;
    })
    .map((node: any) => String(node.id));
}

export function layersForCanvasCreation(selectedLayerIds: string[], fallbackLayerId: string) {
  const layers = selectedLayerIds.filter((layerId) => layerId.trim().length > 0);
  return layers.length ? [...layers] : [fallbackLayerId];
}

export type CanvasAuthoringLayerIntent = 'physical' | 'paths' | 'annotations';

const layerIdByAuthoringIntent: Record<CanvasAuthoringLayerIntent, string> = {
  annotations: 'annotations',
  paths: 'paths',
  physical: 'physical'
};

export function layersForAuthoringIntent(intent: CanvasAuthoringLayerIntent, selectedLayerIds: string[] = []) {
  const preferredLayerId = layerIdByAuthoringIntent[intent];
  return [
    preferredLayerId,
    ...selectedLayerIds.filter((layerId) => layerId.trim().length > 0 && layerId !== preferredLayerId)
  ];
}

export function layersForCanvasTool(tool: CanvasAuthoringTool, selectedLayerIds: string[] = []) {
  if (tool === 'path') return layersForAuthoringIntent('paths', selectedLayerIds);
  if (tool === 'shape' || tool === 'callout' || tool === 'text') return layersForAuthoringIntent('annotations', selectedLayerIds);
  return layersForAuthoringIntent('physical', selectedLayerIds);
}

export function layersForInsertObjectType(type: InsertObjectType, selectedLayerIds: string[] = []) {
  if (type === 'path') return layersForAuthoringIntent('paths', selectedLayerIds);
  if (type === 'callout') return layersForAuthoringIntent('annotations', selectedLayerIds);
  return layersForAuthoringIntent('physical', selectedLayerIds);
}

export function layersForPresetKind(kind: TopoObjectPreset['kind'], selectedLayerIds: string[] = []) {
  if (kind === 'path') return layersForAuthoringIntent('paths', selectedLayerIds);
  if (kind === 'shape' || kind === 'callout') return layersForAuthoringIntent('annotations', selectedLayerIds);
  return layersForAuthoringIntent('physical', selectedLayerIds);
}

export function canvasAuthoringCommandLabel(command: CanvasAuthoringCommand) {
  if (command.type === 'insertNodeAt') return `Place ${command.preset}`;
  if (command.type === 'insertLinkBetween') return 'Draw link';
  if (command.type === 'insertPathSequence') return 'Create path';
  if (command.type === 'insertRegionFromSelection') return 'Create region';
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

  if (command.type === 'insertRegionFromSelection') {
    return insertTopoObject(text, {
      selectedLayerIds: command.layers,
      selectedObjects: command.members.map((id) => ({ kind: 'node', id })),
      type: 'region'
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
    return insertTopoObject(text, {
      selectedLayerIds: command.layers,
      selectedObjects: command.members.map((id) => ({ kind: 'node', id })),
      type: 'region'
    });
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
