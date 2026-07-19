import type { CompiledGraph, TopoViewerObjectClick, TopoViewerProps } from '../core/types';
import { sourceObjectId } from './runtimeGraph';

export type RuntimeObject = Record<string, unknown>;

export interface TopoFlowProps {
  compiled: CompiledGraph;
  compileToken: object;
  document: TopoViewerProps['document'];
  positionOnlyCompile: boolean;
  showRegions: boolean;
  controlPanelToggle?: TopoViewerProps['controlPanelToggle'];
  fitViewOnInit?: TopoViewerProps['fitViewOnInit'];
  fitViewRequestId?: TopoViewerProps['fitViewRequestId'];
  grid?: TopoViewerProps['grid'];
  miniMap?: TopoViewerProps['miniMap'];
  viewportControls?: TopoViewerProps['viewportControls'];
  exportDisabled?: TopoViewerProps['exportDisabled'];
  exportTooltip?: TopoViewerProps['exportTooltip'];
  helperLines?: TopoViewerProps['helperLines'];
  selectedObjectIds?: TopoViewerProps['selectedObjectIds'];
  previewObjectIds?: TopoViewerProps['previewObjectIds'];
  initialViewport?: TopoViewerProps['initialViewport'];
  nodesDraggable?: TopoViewerProps['nodesDraggable'];
  nodesResizable?: TopoViewerProps['nodesResizable'];
  nodesConnectable?: TopoViewerProps['nodesConnectable'];
  onlyRenderVisibleElements?: TopoViewerProps['onlyRenderVisibleElements'];
  panOnDrag?: TopoViewerProps['panOnDrag'];
  selectionOnDrag?: TopoViewerProps['selectionOnDrag'];
  selectionMode?: TopoViewerProps['selectionMode'];
  connectionHandleMode?: TopoViewerProps['connectionHandleMode'];
  onExport?: TopoViewerProps['onExport'];
  onObjectClick?: TopoViewerProps['onObjectClick'];
  onObjectDoubleClick?: TopoViewerProps['onObjectDoubleClick'];
  onPaneClick?: TopoViewerProps['onPaneClick'];
  onNodePositionChange?: TopoViewerProps['onNodePositionChange'];
  onNodesPositionChange?: TopoViewerProps['onNodesPositionChange'];
  onNodePositionPreview?: TopoViewerProps['onNodePositionPreview'];
  onNodeResizeChange?: TopoViewerProps['onNodeResizeChange'];
  onRegionAggregateToggle?: TopoViewerProps['onRegionAggregateToggle'];
  onLinkAggregateToggle?: TopoViewerProps['onLinkAggregateToggle'];
  onConnectionCreate?: TopoViewerProps['onConnectionCreate'];
  isConnectionValid?: TopoViewerProps['isConnectionValid'];
  onObjectContextMenu?: TopoViewerProps['onObjectContextMenu'];
  onSelectionContextMenu?: TopoViewerProps['onSelectionContextMenu'];
  onSelectionChange?: TopoViewerProps['onSelectionChange'];
  onViewportChange?: TopoViewerProps['onViewportChange'];
  nodeTypes: Record<string, unknown>;
  edgeTypes: Record<string, unknown>;
}

export function runtimeSelectionObject(object: unknown, element: 'edge' | 'node'): TopoViewerObjectClick {
  const runtimeObject = object as RuntimeObject;
  return {
    data: (runtimeObject.data || {}) as RuntimeObject,
    element,
    id: sourceObjectId(runtimeObject),
    runtimeId: String(runtimeObject.id)
  };
}

export function preserveActiveDragNodes(
  nextNodes: RuntimeObject[],
  currentNodes: RuntimeObject[],
  activeRuntimeIds: ReadonlySet<string>
) {
  if (!activeRuntimeIds.size) return nextNodes;
  const currentById = new Map(currentNodes.map((node) => [String(node.id || ''), node]));
  return nextNodes.map((node) => (
    activeRuntimeIds.has(String(node.id || ''))
      ? currentById.get(String(node.id || '')) || node
      : node
  ));
}

export function uniqueRuntimeNodes(nodes: RuntimeObject[]) {
  const byId = new Map<string, RuntimeObject>();
  nodes.forEach((node) => {
    const id = String(node.id || '');
    if (id && !byId.has(id)) byId.set(id, node);
  });
  return [...byId.values()];
}

export function applyRuntimeNodeSelection(
  nodes: RuntimeObject[],
  selected: ReadonlySet<string>,
  activeRuntimeIds: ReadonlySet<string>,
  decorate: (node: RuntimeObject, selected: boolean) => RuntimeObject
) {
  let changed = false;
  const values = nodes.map((node) => {
    const nextSelected = selected.has(sourceObjectId(node));
    if ((node.selected === true) === nextSelected) return node;
    changed = true;
    return activeRuntimeIds.has(String(node.id || ''))
      ? { ...node, selected: nextSelected }
      : decorate(node, nextSelected);
  });
  return { changed, values };
}

export function applyRuntimeEdgeSelection(edges: RuntimeObject[], selected: ReadonlySet<string>) {
  let changed = false;
  const values = edges.map((edge) => {
    const data = (edge.data || {}) as RuntimeObject;
    let directionChanged = false;
    const linkDirections = Array.isArray(data.linkDirections)
      ? data.linkDirections.map((direction) => {
          if (!direction || typeof direction !== 'object') return direction;
          const record = direction as RuntimeObject;
          const directionData = (record.data || {}) as RuntimeObject;
          const nextSelected = selected.has(String(record.id || directionData.id || ''));
          if ((directionData.topoviewerSelected === true) === nextSelected) return direction;
          directionChanged = true;
          if (nextSelected) return { ...record, data: { ...directionData, topoviewerSelected: true } };
          const { topoviewerSelected: _selected, ...remainingData } = directionData;
          return { ...record, data: remainingData };
        })
      : undefined;
    const nextSelected = selected.has(sourceObjectId(edge));
    if ((edge.selected === true) === nextSelected && !directionChanged) return edge;
    changed = true;
    return {
      ...edge,
      selected: nextSelected,
      ...(directionChanged ? { data: { ...data, linkDirections } } : {})
    };
  });
  return { changed, values };
}

export function applyRuntimePreview(objects: RuntimeObject[], previewed: ReadonlySet<string>) {
  let changed = false;
  const values = objects.map((object) => {
    const data = (object.data || {}) as RuntimeObject;
    const nextPreview = previewed.has(sourceObjectId(object));
    if ((data.topoviewerPreview === true) === nextPreview) return object;
    changed = true;
    if (nextPreview) return { ...object, data: { ...data, topoviewerPreview: true } };
    const { topoviewerPreview: _preview, ...remainingData } = data;
    return { ...object, data: remainingData };
  });
  return { changed, values };
}
