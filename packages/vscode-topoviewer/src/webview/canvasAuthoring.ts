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
  | 'shape';

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

export type CanvasSelectionAlignment = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom';
export type CanvasSelectionDistributionAxis = 'horizontal' | 'vertical';

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
    layers: string[];
    position: CanvasAuthoringPoint;
    size?: { width: number; height: number };
    type: 'insertShapeAt';
  }
  | {
    bounds: CanvasAuthoringRect;
    layers: string[];
    members?: string[];
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
    alignment: CanvasSelectionAlignment;
    gridSize?: number;
    selections: TopoObjectSelection[];
    type: 'alignSelection';
  }
  | {
    axis: CanvasSelectionDistributionAxis;
    gridSize?: number;
    selections: TopoObjectSelection[];
    type: 'distributeSelection';
  }
  | {
    gridSize: number;
    selections: TopoObjectSelection[];
    type: 'snapSelectionToGrid';
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
  'shape'
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

export function objectSelectionsWithinCanvasBounds(
  document: Record<string, any> | undefined,
  bounds: CanvasAuthoringRect,
  selectedLayerIds: string[] = []
): TopoObjectSelection[] {
  const maxX = bounds.x + bounds.width;
  const maxY = bounds.y + bounds.height;
  const containsPosition = (value: unknown) => {
    const position = numericPosition(value);
    return !!position && position.x >= bounds.x && position.x <= maxX && position.y >= bounds.y && position.y <= maxY;
  };
  const graph = document?.graph || {};
  const diagram = document?.diagram || {};
  const selections: TopoObjectSelection[] = [];

  (graph.nodes || []).forEach((node: any) => {
    if (!hasLayerIntersection(node.layers, selectedLayerIds)) return;
    if (containsPosition(node.position)) selections.push({ kind: 'node', id: String(node.id) });
  });
  (graph.regions || []).forEach((region: any) => {
    if (!hasLayerIntersection(region.layers, selectedLayerIds)) return;
    if (containsPosition(region.position)) selections.push({ kind: 'region', id: String(region.id) });
  });
  (diagram.shapes || []).forEach((shape: any) => {
    if (!hasLayerIntersection(shape.layers, selectedLayerIds)) return;
    if (containsPosition(shape.position)) selections.push({ kind: 'shape', id: String(shape.id) });
  });
  (diagram.callouts || []).forEach((callout: any) => {
    if (!hasLayerIntersection(callout.layers, selectedLayerIds)) return;
    if (containsPosition(callout.position)) selections.push({ kind: 'callout', id: String(callout.id) });
  });

  return selections.filter((selection) => selection.id.trim().length > 0);
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
  if (tool === 'shape' || tool === 'callout') return layersForAuthoringIntent('annotations', selectedLayerIds);
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
  if (command.type === 'insertShapeAt') return 'Place shape';
  if (command.type === 'moveSelection') return 'Move selection';
  if (command.type === 'alignSelection') return 'Align selection';
  if (command.type === 'distributeSelection') return 'Distribute selection';
  if (command.type === 'snapSelectionToGrid') return 'Snap selection';
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

  if (command.type === 'insertShapeAt') {
    return insertTopoObject(text, {
      position: command.position,
      selectedLayerIds: command.layers,
      selectedObjects: [],
      size: command.size,
      type: 'shape'
    });
  }

  if (command.type === 'moveSelection') {
    return movePositionedSelection(text, command.selections, command.delta);
  }

  if (command.type === 'alignSelection') {
    return alignPositionedSelection(text, command.selections, command.alignment, command.gridSize);
  }

  if (command.type === 'distributeSelection') {
    return distributePositionedSelection(text, command.selections, command.axis, command.gridSize);
  }

  if (command.type === 'snapSelectionToGrid') {
    return snapPositionedSelectionToGrid(text, command.selections, command.gridSize);
  }

  if (command.type === 'deleteSelection') {
    return deleteTopoObjects(text, command.selections);
  }

  if (command.type === 'insertRegionFromBounds') {
    return insertTopoObject(text, {
      position: { x: command.bounds.x, y: command.bounds.y },
      selectedLayerIds: command.layers,
      selectedObjects: (command.members || []).map((id) => ({ kind: 'node', id })),
      size: { width: command.bounds.width, height: command.bounds.height },
      type: 'region'
    });
  }

  if (command.type === 'resizeObject') {
    throw new Error('Canvas resize is not implemented yet.');
  }

  return duplicatePositionedSelection(text, command.selections, command.offset);
}

function movePositionedSelection(
  text: string,
  selections: TopoObjectSelection[],
  delta: CanvasAuthoringPoint
): MutationResult {
  return mutateTopologyText(text, (document) => {
    let moved = 0;
    selections.forEach((selection) => {
      if (selection.kind !== 'node' && selection.kind !== 'shape' && selection.kind !== 'callout' && selection.kind !== 'region') return;
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

function duplicatePositionedSelection(
  text: string,
  selections: TopoObjectSelection[],
  offset: CanvasAuthoringPoint
): MutationResult {
  return mutateTopologyText(text, (document) => {
    const supportedKinds = new Set<TopoObjectSelection['kind']>(['node', 'region', 'shape', 'callout']);
    const normalizedSelections = uniqueSelections(selections).filter((selection) => supportedKinds.has(selection.kind));
    if (!normalizedSelections.length) {
      throw new Error('Duplicate selection requires a node, region, shape, or callout.');
    }

    const idBySelection = new Map<string, string>();
    const idBySourceId = new Map<string, string>();
    const reservedIds = allCanvasObjectIds(document);
    normalizedSelections.forEach((selection) => {
      const object = findObject(document, selection);
      if (!object) throw new Error(`Selected ${selection.kind} "${selection.id}" no longer exists.`);
      const position = objectPosition(object.position);
      if (!position) throw new Error(`Selected ${selection.kind} "${selection.id}" does not have an editable position.`);
      const id = nextDuplicateId(document, duplicatePrefix(selection), reservedIds);
      reservedIds.add(id);
      idBySelection.set(selectionKey(selection), id);
      idBySourceId.set(selection.id, id);
    });

    const graph = document.graph && typeof document.graph === 'object' ? document.graph : (document.graph = {});
    const diagram = document.diagram && typeof document.diagram === 'object' ? document.diagram : (document.diagram = {});
    graph.nodes = Array.isArray(graph.nodes) ? graph.nodes : [];
    graph.regions = Array.isArray(graph.regions) ? graph.regions : [];
    diagram.shapes = Array.isArray(diagram.shapes) ? diagram.shapes : [];
    diagram.callouts = Array.isArray(diagram.callouts) ? diagram.callouts : [];

    normalizedSelections.forEach((selection) => {
      const source = findObject(document, selection);
      const id = idBySelection.get(selectionKey(selection));
      if (!source || !id) return;
      const duplicate = cloneCanvasObject(source);
      duplicate.id = id;
      duplicate.position = translateCanvasPosition(source.position, offset);
      duplicate.name = duplicate.name ? `${duplicate.name} Copy` : duplicate.name;

      if (selection.kind === 'node') {
        graph.nodes.push(duplicate);
        return;
      }

      if (selection.kind === 'region') {
        const rewrittenMembers = Array.isArray(duplicate.members)
          ? duplicate.members.map((memberId: unknown) => idBySourceId.get(String(memberId || ''))).filter(Boolean)
          : [];
        duplicate.members = rewrittenMembers;
        if (duplicate.parent) {
          const rewrittenParentId = idBySourceId.get(String(duplicate.parent));
          if (rewrittenParentId) duplicate.parent = rewrittenParentId;
          else delete duplicate.parent;
        }
        graph.regions.push(duplicate);
        return;
      }

      if (selection.kind === 'shape') {
        diagram.shapes.push(duplicate);
        return;
      }

      if (duplicate.target) {
        duplicate.target = idBySourceId.get(String(duplicate.target)) || duplicate.target;
      }
      if (duplicate.source) {
        duplicate.source = idBySourceId.get(String(duplicate.source)) || duplicate.source;
      }
      diagram.callouts.push(duplicate);
    });
  });
}

function alignPositionedSelection(
  text: string,
  selections: TopoObjectSelection[],
  alignment: CanvasSelectionAlignment,
  gridSize?: number
): MutationResult {
  return mutateTopologyText(text, (document) => {
    const boxes = positionedSelectionBoxes(document, selections);
    if (boxes.length < 2) throw new Error('Align selection requires at least two positioned objects.');
    const bounds = selectionBounds(boxes);
    boxes.forEach((box) => {
      const next = { x: box.x, y: box.y };
      if (alignment === 'left') next.x = bounds.x;
      if (alignment === 'center') next.x = bounds.x + bounds.width / 2 - box.width / 2;
      if (alignment === 'right') next.x = bounds.x + bounds.width - box.width;
      if (alignment === 'top') next.y = bounds.y;
      if (alignment === 'middle') next.y = bounds.y + bounds.height / 2 - box.height / 2;
      if (alignment === 'bottom') next.y = bounds.y + bounds.height - box.height;
      setCanvasObjectPosition(box.object, maybeSnapPoint(next, gridSize));
    });
  });
}

function distributePositionedSelection(
  text: string,
  selections: TopoObjectSelection[],
  axis: CanvasSelectionDistributionAxis,
  gridSize?: number
): MutationResult {
  return mutateTopologyText(text, (document) => {
    const boxes = positionedSelectionBoxes(document, selections);
    if (boxes.length < 3) throw new Error('Distribute selection requires at least three positioned objects.');
    const sorted = [...boxes].sort((a, b) => axis === 'horizontal'
      ? a.x + a.width / 2 - (b.x + b.width / 2)
      : a.y + a.height / 2 - (b.y + b.height / 2));
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const firstCenter = axis === 'horizontal' ? first.x + first.width / 2 : first.y + first.height / 2;
    const lastCenter = axis === 'horizontal' ? last.x + last.width / 2 : last.y + last.height / 2;
    const step = (lastCenter - firstCenter) / (sorted.length - 1);

    sorted.forEach((box, index) => {
      const targetCenter = firstCenter + step * index;
      const next = {
        x: axis === 'horizontal' ? targetCenter - box.width / 2 : box.x,
        y: axis === 'vertical' ? targetCenter - box.height / 2 : box.y
      };
      setCanvasObjectPosition(box.object, maybeSnapPoint(next, gridSize));
    });
  });
}

function snapPositionedSelectionToGrid(
  text: string,
  selections: TopoObjectSelection[],
  gridSize: number
): MutationResult {
  return mutateTopologyText(text, (document) => {
    const boxes = positionedSelectionBoxes(document, selections);
    if (!boxes.length) throw new Error('Snap selection requires at least one positioned object.');
    const validGridSize = normalizedGridSize(gridSize);
    boxes.forEach((box) => {
      setCanvasObjectPosition(box.object, snapTopologyPoint({ x: box.x, y: box.y }, validGridSize));
    });
  });
}

type PositionedSelectionBox = {
  height: number;
  object: any;
  width: number;
  x: number;
  y: number;
};

function positionedSelectionBoxes(document: Record<string, any>, selections: TopoObjectSelection[]): PositionedSelectionBox[] {
  return uniqueSelections(selections).flatMap((selection) => {
    if (selection.kind !== 'node' && selection.kind !== 'shape' && selection.kind !== 'callout' && selection.kind !== 'region') return [];
    const object = findObject(document, selection);
    if (!object) throw new Error(`Selected ${selection.kind} "${selection.id}" no longer exists.`);
    const position = objectPosition(object.position);
    if (!position) throw new Error(`Selected ${selection.kind} "${selection.id}" does not have an editable position.`);
    const size = objectSize(selection, object);
    return [{
      height: size.height,
      object,
      width: size.width,
      x: position.x,
      y: position.y
    }];
  });
}

function selectionBounds(boxes: PositionedSelectionBox[]): CanvasAuthoringRect {
  const minX = Math.min(...boxes.map((box) => box.x));
  const minY = Math.min(...boxes.map((box) => box.y));
  const maxX = Math.max(...boxes.map((box) => box.x + box.width));
  const maxY = Math.max(...boxes.map((box) => box.y + box.height));
  return {
    height: maxY - minY,
    width: maxX - minX,
    x: minX,
    y: minY
  };
}

function objectSize(selection: TopoObjectSelection, object: any): { height: number; width: number } {
  const explicit = sizeFromUnknown(object.size);
  if (explicit) return explicit;
  const width = numberFromUnknown(object.width) ?? numberFromUnknown(object.style?.width);
  const height = numberFromUnknown(object.height) ?? numberFromUnknown(object.style?.height);
  if (width && height) return { width, height };
  if (selection.kind === 'node') return { width: 88, height: 74 };
  if (selection.kind === 'callout') return { width: 160, height: 88 };
  if (selection.kind === 'shape' || selection.kind === 'region') return { width: 0, height: 0 };
  return { width: 0, height: 0 };
}

function sizeFromUnknown(value: unknown): { height: number; width: number } | undefined {
  if (Array.isArray(value)) {
    const width = numberFromUnknown(value[0]);
    const height = numberFromUnknown(value[1]);
    return width && height ? { width, height } : undefined;
  }
  if (!value || typeof value !== 'object') return undefined;
  const record = value as Record<string, unknown>;
  const width = numberFromUnknown(record.width);
  const height = numberFromUnknown(record.height);
  return width && height ? { width, height } : undefined;
}

function numberFromUnknown(value: unknown): number | undefined {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : undefined;
}

function maybeSnapPoint(point: CanvasAuthoringPoint, gridSize?: number): CanvasAuthoringPoint {
  return gridSize ? snapTopologyPoint(point, normalizedGridSize(gridSize)) : point;
}

function normalizedGridSize(gridSize: number): number {
  return Number.isFinite(gridSize) && gridSize > 0 ? gridSize : 20;
}

function setCanvasObjectPosition(object: any, point: CanvasAuthoringPoint) {
  object.position = object.position && typeof object.position === 'object' && !Array.isArray(object.position)
    ? { x: Math.round(point.x), y: Math.round(point.y) }
    : [Math.round(point.x), Math.round(point.y)];
}

function cloneCanvasObject<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function allCanvasObjectIds(document: Record<string, any>): Set<string> {
  const graph = document.graph || {};
  const diagram = document.diagram || {};
  return new Set([
    ...(graph.nodes || []),
    ...(graph.links || []),
    ...(graph.paths || []),
    ...(graph.regions || []),
    ...(diagram.shapes || []),
    ...(diagram.callouts || [])
  ].map((item: any) => String(item.id || '')).filter(Boolean));
}

function duplicatePrefix(selection: TopoObjectSelection): string {
  const normalized = selection.id
    .replace(/-\d+$/, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .toLowerCase();
  return normalized || selection.kind;
}

function nextDuplicateId(document: Record<string, any>, prefix: string, reservedIds: Set<string>) {
  const existingIds = allCanvasObjectIds(document);
  let index = 1;
  while (existingIds.has(`${prefix}-${index}`) || reservedIds.has(`${prefix}-${index}`)) index += 1;
  return `${prefix}-${index}`;
}

function selectionKey(selection: TopoObjectSelection) {
  return `${selection.kind}:${selection.id}`;
}

function uniqueSelections(selections: TopoObjectSelection[]) {
  const seen = new Set<string>();
  return selections.filter((selection) => {
    const key = selectionKey(selection);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function translateCanvasPosition(value: unknown, delta: CanvasAuthoringPoint): [number, number] | { x: number; y: number } {
  const position = objectPosition(value);
  if (!position) throw new Error('Cannot translate an object without an editable position.');
  const next = {
    x: Math.round(position.x + delta.x),
    y: Math.round(position.y + delta.y)
  };
  return value && typeof value === 'object' && !Array.isArray(value) ? next : [next.x, next.y];
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
