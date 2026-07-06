import type { InsertObjectType, TopoObjectSelection } from '../shared/topologyMutations';

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
    preset: InsertObjectType;
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
