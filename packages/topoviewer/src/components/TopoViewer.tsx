import '@xyflow/react/dist/style.css';
import {
  Background,
  ConnectionMode,
  ReactFlow,
  ReactFlowProvider,
  applyNodeChanges,
  useReactFlow,
  useEdgesState,
  useNodesInitialized,
  useNodesState,
  type Connection,
  type OnSelectionChangeFunc,
  type ResizeParams,
  type NodeChange
} from '@xyflow/react';
import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import { compileTopoGraph } from '../core/compiler';
import { buildAttentionIndex, deriveAggregateGraph } from '../core/attention';
import { resolveAttentionPresentationCached } from '../core/attention/cache';
import { assertRendererLimits } from '../core/limits';
import { layerIds } from '../core/layers';
import { migrateTopoToggles } from '../core/migration';
import { defaultTopoViewerToggles } from '../core/toggles';
import type { AttentionPresentation, AttentionPresentationResult } from '../core/attention';
import type {
  CompiledEdge,
  CompiledEdgeData,
  CompiledGraph,
  CompiledNode,
  CompiledNodeData,
  TopoDocument,
  TopoViewerConnectionCreate,
  TopoViewerExtensionContext,
  TopoViewerNodeResizeChange,
  TopoViewerProps
} from '../core/types';
import { CalloutNode } from './CalloutNode';
import { FloatingEdge } from './FloatingEdge';
import { HelperLinesOverlay } from './HelperLinesOverlay';
import { LabelOverlay } from './LabelOverlay';
import { useEdgeEndpointInternals } from './edgeEndpointInternals';
import { NetworkNode } from './NetworkNode';
import { PinNode } from './PinNode';
import { RegionNode } from './RegionNode';
import { ShapeNode } from './ShapeNode';
import { ViewportControls } from './ViewportControls';
import {
  applyHelperLineSnapToChanges,
  emptyHelperLineState,
  helperLineBoxFromNode,
  helperLineStatesEqual,
  normalizeHelperLinesOptions,
  prepareHelperLineCandidateIndex,
  resolveDragStopPosition,
  type HelperLineCandidateIndex,
  type HelperLineNodeLike,
  type HelperLineState
} from './helperLines';
import { applyTopoNodeChanges } from './regionDrag';
import {
  hasRegionPositionChange,
  preserveRuntimeNodeMeasurements,
  preserveSourceOwnedEdges,
  regionDragGroupRuntimeIds,
  runtimeNodePosition,
  sameRuntimePosition,
  sourceObjectId
} from './runtimeGraph';
import '../styles.css';

const builtInNodeTypes = { network: NetworkNode, region: RegionNode, shape: ShapeNode, callout: CalloutNode, pin: PinNode };
const builtInEdgeTypes = { floating: FloatingEdge };
const emptyToggles: NonNullable<TopoViewerProps['toggles']> = {};
const emptyExtensions: NonNullable<TopoViewerProps['extensions']> = [];
function applyBeforeCompileExtensions(
  document: TopoDocument,
  context: TopoViewerExtensionContext,
  extensions: NonNullable<TopoViewerProps['extensions']>
) {
  return extensions.reduce((currentDocument, extension) => {
    if (!extension.beforeCompile) {
      return currentDocument;
    }
    return extension.beforeCompile(currentDocument, { ...context, document: currentDocument });
  }, document);
}

function applyAfterCompileExtensions(
  graph: CompiledGraph,
  context: TopoViewerExtensionContext,
  extensions: NonNullable<TopoViewerProps['extensions']>
) {
  return extensions.reduce((currentGraph, extension) => {
    if (!extension.afterCompile) {
      return currentGraph;
    }
    return extension.afterCompile(currentGraph, context);
  }, graph);
}

function resizableObjectKind(compiledNode: Record<string, unknown>): 'node' | 'region' | 'shape' | 'callout' | undefined {
  const data = (compiledNode.data || {}) as Record<string, unknown>;
  const objectKind = String(data.objectKind || '');
  if (objectKind === 'shape' || objectKind === 'callout') return objectKind;
  if (String(compiledNode.type || '') === 'region') return 'region';
  return String(compiledNode.type || '') === 'network' ? 'node' : undefined;
}

function decoratedAttentionData(data: Record<string, unknown>, attention: AttentionPresentation | undefined) {
  if (!attention) return data;
  return {
    ...data,
    attentionState: attention.state,
    attentionScore: attention.score,
    attentionReasons: attention.reasons,
    attentionLabelPriority: attention.labelPriority
  };
}

function attentionOpacity(state: string | undefined): number | undefined {
  if (state === 'dimmed') return 0.28;
  if (state === 'suppressed') return 0.12;
  return undefined;
}

function applyAttentionToCompiledGraph(graph: CompiledGraph, presentation: AttentionPresentationResult | undefined): CompiledGraph {
  if (!presentation) return graph;

  return {
    ...graph,
    nodes: graph.nodes.map((node) => {
      const attention = presentation.items.get(sourceObjectId(node));
      if (!attention) return node;
      const hidden = attention.state === 'hidden' || attention.state === 'suppressed';
      const opacity = attentionOpacity(attention.state);
      return {
        ...node,
        hidden,
        zIndex: attention.state === 'focused' ? 120 : attention.state === 'related' ? 90 : node.zIndex,
        data: decoratedAttentionData((node.data || {}) as Record<string, unknown>, attention),
        style: {
          ...((node.style || {}) as Record<string, unknown>),
          ...(opacity !== undefined ? { opacity } : {})
        }
      } as CompiledNode;
    }),
    edges: graph.edges.map((edge) => {
      const attention = presentation.items.get(sourceObjectId(edge));
      const data = (edge.data || {}) as CompiledEdgeData;
      const linkDirections = Array.isArray(data.linkDirections)
        ? data.linkDirections.map((direction) => {
          if (!direction || typeof direction !== 'object') return direction;
          const record = direction as Record<string, unknown>;
          const directionAttention = presentation.items.get(String(record.id || ''));
          return directionAttention ? {
            ...record,
            data: decoratedAttentionData((record.data || {}) as Record<string, unknown>, directionAttention)
          } : direction;
        })
        : undefined;
      if (!attention) {
        return linkDirections ? {
          ...edge,
          data: {
            ...data,
            linkDirections
          }
        } as CompiledEdge : edge;
      }
      const hidden = attention.state === 'hidden' || attention.state === 'suppressed';
      const opacity = attentionOpacity(attention.state);
      return {
        ...edge,
        hidden,
        zIndex: attention.state === 'focused' ? 110 : attention.state === 'related' ? 80 : edge.zIndex,
        data: {
          ...decoratedAttentionData(data, attention),
          ...(linkDirections ? { linkDirections } : {})
        },
        style: {
          ...((edge.style || {}) as Record<string, unknown>),
          ...(opacity !== undefined ? { opacity } : {})
        }
      } as CompiledEdge;
    })
  };
}

function applySelectionToCompiledGraph(graph: CompiledGraph, selectedObjectIds: string[] | undefined): CompiledGraph {
  if (!selectedObjectIds?.length) return graph;
  const selected = new Set(selectedObjectIds);
  return {
    ...graph,
    nodes: graph.nodes.map((node) => {
      const selectedNode = selected.has(sourceObjectId(node));
      return selectedNode ? {
        ...node,
        selected: true,
        data: {
          ...((node.data || {}) as CompiledNodeData),
          topoviewerSelected: true
        } as CompiledNodeData
      } as CompiledNode : node;
    }),
    edges: graph.edges.map((edge) => {
      const selectedEdge = selected.has(sourceObjectId(edge));
      const data = (edge.data || {}) as CompiledEdgeData;
      const linkDirections = Array.isArray(data.linkDirections)
        ? data.linkDirections.map((direction) => {
          if (!direction || typeof direction !== 'object') return direction;
          const record = direction as Record<string, unknown>;
          const selectedDirection = selected.has(String(record.id || ''));
          return selectedDirection ? {
            ...record,
            data: {
              ...((record.data || {}) as Record<string, unknown>),
              topoviewerSelected: true
            }
          } : direction;
        })
        : undefined;
      return selectedEdge ? {
        ...edge,
        selected: true,
        data: {
          ...data,
          ...(linkDirections ? { linkDirections } : {}),
          topoviewerSelected: true
        } as CompiledEdgeData
      } as CompiledEdge : linkDirections ? {
        ...edge,
        data: {
          ...data,
          linkDirections
        } as CompiledEdgeData
      } as CompiledEdge : edge;
    })
  };
}

function applyPreviewToCompiledGraph(graph: CompiledGraph, previewObjectIds: string[] | undefined): CompiledGraph {
  if (!previewObjectIds?.length) return graph;
  const previewed = new Set(previewObjectIds);
  return {
    ...graph,
    nodes: graph.nodes.map((node) => previewed.has(sourceObjectId(node)) ? {
      ...node,
      data: {
        ...((node.data || {}) as CompiledNodeData),
        topoviewerPreview: true
      } as CompiledNodeData
    } as CompiledNode : node)
  };
}

function withRuntimeDirectionHandlers(
  edges: ReturnType<typeof compileTopoGraph>['edges'],
  onObjectClick: TopoViewerProps['onObjectClick']
): ReturnType<typeof compileTopoGraph>['edges'] {
  if (!onObjectClick) return edges;
  return edges.map((edge) => {
    const data = (edge.data || {}) as CompiledEdgeData;
    if (!Array.isArray(data.linkDirections) || !data.linkDirections.length) return edge;
    return {
      ...edge,
      data: {
        ...data,
        __topoviewerOnLinkDirectionClick: (event: { stopPropagation: () => void; ctrlKey?: boolean; metaKey?: boolean; shiftKey?: boolean }, direction: Record<string, unknown>) => {
          event.stopPropagation();
          const directionData = (direction.data || {}) as Record<string, unknown>;
          if (data.interactive === false || directionData.interactive === false) return;
          onObjectClick({
            id: String(direction.id || directionData.id || ''),
            runtimeId: `${String(edge.id)}:${String(direction.id || directionData.id || '')}`,
            element: 'linkDirection',
            data: directionData,
            modifiers: {
              ctrlKey: !!event.ctrlKey,
              metaKey: !!event.metaKey,
              shiftKey: !!event.shiftKey
            }
          });
        }
      } as CompiledEdgeData
    } as CompiledEdge;
  });
}

function withRuntimeResizeHandlers(
  nodes: ReturnType<typeof compileTopoGraph>['nodes'],
  nodesResizable: boolean | undefined,
  onNodeResizeChange: TopoViewerProps['onNodeResizeChange']
): ReturnType<typeof compileTopoGraph>['nodes'] {
  if (!nodesResizable || !onNodeResizeChange) return nodes;
  return nodes.map((node) => {
    const runtimeNode = node as unknown as Record<string, unknown>;
    if (runtimeNode.selected !== true || !resizableObjectKind(runtimeNode)) return node;
    const data = (runtimeNode.data || {}) as Record<string, unknown>;
    return {
      ...node,
      data: {
        ...data,
        __topoviewerResizable: true,
        __topoviewerOnResizeEnd: (params: ResizeParams) => {
          const position = {
            x: Math.round(Number(params.x || 0)),
            y: Math.round(Number(params.y || 0))
          };
          const size = {
            width: Math.max(1, Math.round(Number(params.width || 0))),
            height: Math.max(1, Math.round(Number(params.height || 0)))
          };
          onNodeResizeChange({
            id: sourceObjectId(runtimeNode),
            runtimeId: String(runtimeNode.id || ''),
            position,
            size,
            data
          } satisfies TopoViewerNodeResizeChange);
        }
      } as unknown as CompiledNodeData
    } as typeof node;
  });
}

function withRuntimeRegionAggregateHandlers(
  nodes: ReturnType<typeof compileTopoGraph>['nodes'],
  onRegionAggregateToggle: TopoViewerProps['onRegionAggregateToggle']
): ReturnType<typeof compileTopoGraph>['nodes'] {
  if (!onRegionAggregateToggle) return nodes;
  return nodes.map((node) => {
    const runtimeNode = node as unknown as Record<string, unknown>;
    const data = (runtimeNode.data || {}) as Record<string, unknown>;
    const aggregateBy = String(data.aggregateBy || '');
    const aggregateSourceId = String(data.aggregateSourceId || '');
    const aggregateId = String(data.aggregateId || '');
    if (data.isAggregate === true && aggregateBy === 'region' && aggregateSourceId && aggregateId) {
      return {
        ...node,
        data: {
          ...data,
          __topoviewerAggregateExpandable: true,
          __topoviewerOnAggregateExpand: () => onRegionAggregateToggle({
            data,
            expanded: true,
            groupId: aggregateId,
            regionId: aggregateSourceId
          })
        } as unknown as CompiledNodeData
      } as typeof node;
    }
    const objectKind = String(data.objectKind || '');
    const regionId = objectKind === 'region' ? sourceObjectId(runtimeNode) : undefined;
    if (!regionId) return node;
    return {
      ...node,
      data: {
        ...data,
        __topoviewerRegionCollapsible: true,
        __topoviewerOnRegionCollapse: () => onRegionAggregateToggle({
          data,
          expanded: false,
          groupId: `summary-${regionId}`,
          regionId
        })
      } as unknown as CompiledNodeData
    } as typeof node;
  });
}

function resolveAttentionPresentation(document: TopoDocument, attention: TopoViewerProps['attention']): AttentionPresentationResult | undefined {
  return resolveAttentionPresentationCached(document, attention || document.attention);
}

function useHelperLineState() {
  const [state, setState] = useState<HelperLineState>(emptyHelperLineState);
  const stateRef = useRef<HelperLineState>(emptyHelperLineState);

  const setStateIfChanged = useCallback((nextState: HelperLineState) => {
    const current = stateRef.current;
    const unchanged = current.vertical?.value === nextState.vertical?.value
      && current.vertical?.kind === nextState.vertical?.kind
      && current.horizontal?.value === nextState.horizontal?.value
      && current.horizontal?.kind === nextState.horizontal?.kind;
    if (unchanged) return;
    stateRef.current = nextState;
    setState(nextState);
  }, []);

  const clearState = useCallback(() => setStateIfChanged(emptyHelperLineState), [setStateIfChanged]);

  return [state, setStateIfChanged, clearState] as const;
}

function TopoFlow({
  compiled,
  document,
  showRegions,
  controlPanelToggle,
  exportDisabled,
  exportTooltip,
  helperLines,
  previewObjectIds,
  initialViewport,
  nodesDraggable = true,
  nodesResizable = false,
  nodesConnectable = false,
  connectionHandleMode = 'full-node',
  onExport,
  onObjectClick,
  onPaneClick,
  onNodePositionChange,
  onNodePositionPreview,
  onNodeResizeChange,
  onRegionAggregateToggle,
  onConnectionCreate,
  isConnectionValid,
  onObjectContextMenu,
  onSelectionChange,
  onViewportChange,
  nodeTypes,
  edgeTypes
}: {
  compiled: ReturnType<typeof compileTopoGraph>;
  document: TopoViewerProps['document'];
  showRegions: boolean;
  controlPanelToggle?: TopoViewerProps['controlPanelToggle'];
  exportDisabled?: TopoViewerProps['exportDisabled'];
  exportTooltip?: TopoViewerProps['exportTooltip'];
  helperLines?: TopoViewerProps['helperLines'];
  previewObjectIds?: TopoViewerProps['previewObjectIds'];
  initialViewport?: TopoViewerProps['initialViewport'];
  nodesDraggable?: TopoViewerProps['nodesDraggable'];
  nodesResizable?: TopoViewerProps['nodesResizable'];
  nodesConnectable?: TopoViewerProps['nodesConnectable'];
  connectionHandleMode?: TopoViewerProps['connectionHandleMode'];
  onExport?: TopoViewerProps['onExport'];
  onObjectClick?: TopoViewerProps['onObjectClick'];
  onPaneClick?: TopoViewerProps['onPaneClick'];
  onNodePositionChange?: TopoViewerProps['onNodePositionChange'];
  onNodePositionPreview?: TopoViewerProps['onNodePositionPreview'];
  onNodeResizeChange?: TopoViewerProps['onNodeResizeChange'];
  onRegionAggregateToggle?: TopoViewerProps['onRegionAggregateToggle'];
  onConnectionCreate?: TopoViewerProps['onConnectionCreate'];
  isConnectionValid?: TopoViewerProps['isConnectionValid'];
  onObjectContextMenu?: TopoViewerProps['onObjectContextMenu'];
  onSelectionChange?: TopoViewerProps['onSelectionChange'];
  onViewportChange?: TopoViewerProps['onViewportChange'];
  nodeTypes: Record<string, unknown>;
  edgeTypes: Record<string, unknown>;
}) {
  const decorateRuntimeNodes = useCallback((sourceNodes: ReturnType<typeof compileTopoGraph>['nodes']) => (
    withRuntimeResizeHandlers(
      withRuntimeRegionAggregateHandlers(sourceNodes, onRegionAggregateToggle),
      nodesResizable,
      onNodeResizeChange
    )
  ), [nodesResizable, onNodeResizeChange, onRegionAggregateToggle]);
  const runtimeNodes = useMemo(() => decorateRuntimeNodes(compiled.nodes), [compiled.nodes, decorateRuntimeNodes]);
  const decorateRuntimeEdges = useCallback((sourceEdges: ReturnType<typeof compileTopoGraph>['edges']) => (
    withRuntimeDirectionHandlers(sourceEdges, onObjectClick)
  ), [onObjectClick]);
  const [nodes, setNodes] = useNodesState(runtimeNodes as never[]);
  const sourceEdgeIds = useMemo(() => new Set(compiled.edges.map((edge) => edge.id)), [compiled.edges]);
  const [edges, setEdges, applyRuntimeEdgeChanges] = useEdgesState(decorateRuntimeEdges(compiled.edges) as never[]);
  const onEdgesChange = useCallback((changes: Parameters<typeof applyRuntimeEdgeChanges>[0]) => (
    applyRuntimeEdgeChanges(preserveSourceOwnedEdges(changes, sourceEdgeIds))
  ), [applyRuntimeEdgeChanges, sourceEdgeIds]);
  useEdgeEndpointInternals(compiled.edges);
  const [nodesReadyForInteraction, setNodesReadyForInteraction] = useState(false);
  const reactFlow = useReactFlow();
  const nodesInitialized = useNodesInitialized({ includeHiddenNodes: true });
  const helperLineOptions = useMemo(() => normalizeHelperLinesOptions(helperLines), [helperLines]);
  const [helperLineState, scheduleHelperLineState, clearHelperLines] = useHelperLineState();
  const nodesRef = useRef<HelperLineNodeLike[]>(compiled.nodes as unknown as HelperLineNodeLike[]);
  const snappedPositionsRef = useRef(new Map<string, { x: number; y: number }>());
  const activeDragNodeIdRef = useRef<string | undefined>();
  const activeDragStartPositionRef = useRef<{ x: number; y: number } | undefined>();
  const activeDragLatestPositionRef = useRef<{ x: number; y: number } | undefined>();
  const activeHelperLineStateRef = useRef<HelperLineState>(emptyHelperLineState);
  const helperLineCandidateIndexRef = useRef<HelperLineCandidateIndex | undefined>();
  useEffect(() => {
    setEdges(decorateRuntimeEdges(compiled.edges) as never[]);
    if (activeDragNodeIdRef.current) return;
    setNodes((currentNodes) => {
      const nextNodes = preserveRuntimeNodeMeasurements(runtimeNodes, currentNodes);
      nodesRef.current = nextNodes as unknown as HelperLineNodeLike[];
      return nextNodes as never[];
    });
    snappedPositionsRef.current.clear();
    activeDragNodeIdRef.current = undefined;
    activeDragStartPositionRef.current = undefined;
    activeDragLatestPositionRef.current = undefined;
    activeHelperLineStateRef.current = emptyHelperLineState;
    helperLineCandidateIndexRef.current = undefined;
    clearHelperLines();
  }, [clearHelperLines, compiled, decorateRuntimeEdges, runtimeNodes, setEdges, setNodes]);
  useEffect(() => {
    setNodesReadyForInteraction(false);
    if (!nodesInitialized) return undefined;
    let firstFrame = 0;
    let secondFrame = 0;
    firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => setNodesReadyForInteraction(true));
    });
    return () => {
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
    };
  }, [compiled, nodesInitialized]);
  useEffect(() => {
    nodesRef.current = nodes as unknown as HelperLineNodeLike[];
  }, [nodes]);

  useEffect(() => {
    const previewed = new Set(previewObjectIds || []);
    setNodes((currentNodes) => {
      let changed = false;
      const nextNodes = (currentNodes as unknown as Array<Record<string, unknown>>).map((node) => {
        const data = (node.data || {}) as Record<string, unknown>;
        const nextPreview = previewed.has(sourceObjectId(node));
        if ((data.topoviewerPreview === true) === nextPreview) return node;
        changed = true;
        if (nextPreview) return { ...node, data: { ...data, topoviewerPreview: true } };
        const { topoviewerPreview: _preview, ...remainingData } = data;
        return { ...node, data: remainingData };
      });
      if (changed) nodesRef.current = nextNodes as unknown as HelperLineNodeLike[];
      return (changed ? nextNodes : currentNodes) as never[];
    });
  }, [previewObjectIds, setNodes]);

  useEffect(() => {
    if (!helperLineOptions.enabled) {
      snappedPositionsRef.current.clear();
      activeDragNodeIdRef.current = undefined;
      activeDragStartPositionRef.current = undefined;
      activeDragLatestPositionRef.current = undefined;
      activeHelperLineStateRef.current = emptyHelperLineState;
      helperLineCandidateIndexRef.current = undefined;
      clearHelperLines();
    }
  }, [clearHelperLines, helperLineOptions.enabled]);

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    let nextChanges = changes;
    const hasPositionChange = changes.some((change) => (
      change.type === 'position' && !!change.id && !!change.position
    ));
    const hasActivePositionDrag = changes.some((change) => (
      change.type === 'position' && change.dragging === true
    ));
    if (helperLineOptions.enabled && nodesDraggable !== false && hasPositionChange) {
      const previousLines = activeHelperLineStateRef.current;
      const helperResult = applyHelperLineSnapToChanges({
        changes,
        nodes: nodesRef.current,
        options: helperLineOptions,
        activeNodeId: activeDragNodeIdRef.current,
        candidateIndex: helperLineCandidateIndexRef.current,
        previousLines
      });
      nextChanges = helperResult.changes as NodeChange[];
      activeHelperLineStateRef.current = helperResult.lines;
      if (!helperLineStatesEqual(previousLines, helperResult.lines)) {
        scheduleHelperLineState(helperResult.lines);
      }
      if (activeDragNodeIdRef.current && !helperResult.snappedPositions.has(activeDragNodeIdRef.current)) {
        snappedPositionsRef.current.delete(activeDragNodeIdRef.current);
      }
      helperResult.snappedPositions.forEach((position, id) => {
        snappedPositionsRef.current.set(id, position);
      });
    }
    const activeDragChange = nextChanges.find((change) => (
      change.type === 'position'
      && change.id === activeDragNodeIdRef.current
      && change.dragging === true
      && !!change.position
    ));
    if (activeDragChange?.type === 'position' && activeDragChange.position) {
      activeDragLatestPositionRef.current = activeDragChange.position;
    }
    setNodes((currentNodes) => {
      const nextNodes = hasActivePositionDrag && !hasRegionPositionChange(nextChanges)
        ? applyNodeChanges(nextChanges, currentNodes) as never[]
        : applyTopoNodeChanges({
          changes: nextChanges,
          currentNodes,
          document,
          selectedLayerIds: compiled.selectedLayerIds,
          showRegions,
          deferRegionRebuild: hasActivePositionDrag
        });
      const decoratedNodes = hasActivePositionDrag
        ? nextNodes
        : decorateRuntimeNodes(nextNodes as ReturnType<typeof compileTopoGraph>['nodes']);
      nodesRef.current = decoratedNodes as unknown as HelperLineNodeLike[];
      return decoratedNodes as never[];
    });
  }, [compiled.selectedLayerIds, decorateRuntimeNodes, document, helperLineOptions, nodesDraggable, scheduleHelperLineState, setNodes, showRegions]);

  const onNodeDragStart = useCallback((_event: unknown, node: unknown) => {
    const runtimeNode = node as unknown as Record<string, unknown>;
    const runtimeId = String(runtimeNode.id || '');
    activeDragNodeIdRef.current = runtimeId;
    activeDragStartPositionRef.current = runtimeId ? runtimeNodePosition(runtimeNode) : undefined;
    activeDragLatestPositionRef.current = activeDragStartPositionRef.current;
    if (!helperLineOptions.enabled || !runtimeId) {
      helperLineCandidateIndexRef.current = undefined;
      return;
    }
    const excludedRuntimeIds = regionDragGroupRuntimeIds(document, runtimeId);
    const candidates = nodesRef.current.flatMap((candidateNode) => {
      if (excludedRuntimeIds.has(String(candidateNode.id || ''))) return [];
      const box = helperLineBoxFromNode(candidateNode);
      return box ? [box] : [];
    });
    helperLineCandidateIndexRef.current = prepareHelperLineCandidateIndex(candidates, runtimeId, helperLineOptions);
  }, [document, helperLineOptions]);

  const onNodeDragStop = useCallback((_event: unknown, node: unknown) => {
    clearHelperLines();
    activeHelperLineStateRef.current = emptyHelperLineState;
    const runtimeNode = node as unknown as Record<string, unknown>;
    const runtimeId = String(runtimeNode.id || '');
    const hasCommittedSnap = snappedPositionsRef.current.has(runtimeId);
    const shouldRebuildRegions = showRegions && !!document.graph?.regions?.length;
    const startPosition = activeDragStartPositionRef.current;
    const position = snappedPositionsRef.current.get(runtimeId)
      || activeDragLatestPositionRef.current
      || resolveDragStopPosition({
        runtimeId,
        eventPosition: (runtimeNode.position || {}) as { x?: number; y?: number },
        nodes: nodesRef.current,
        snappedPositions: snappedPositionsRef.current
      });
    if (hasCommittedSnap || shouldRebuildRegions) {
      setNodes((currentNodes) => {
        const currentNode = (currentNodes as unknown as Array<{ id?: string; position?: { x: number; y: number } }>)
          .find((candidate) => String(candidate.id || '') === runtimeId);
        const currentPosition = currentNode?.position;
        const nextNodes = applyTopoNodeChanges({
          changes: sameRuntimePosition(currentPosition, position)
            ? []
            : [{ id: runtimeId, type: 'position', dragging: false, position }] as NodeChange[],
          currentNodes,
          document,
          selectedLayerIds: compiled.selectedLayerIds,
          showRegions
        });
        const decoratedNodes = decorateRuntimeNodes(nextNodes as ReturnType<typeof compileTopoGraph>['nodes']);
        nodesRef.current = decoratedNodes as unknown as HelperLineNodeLike[];
        return decoratedNodes as never[];
      });
    }
    snappedPositionsRef.current.delete(runtimeId);
    activeDragNodeIdRef.current = undefined;
    activeDragStartPositionRef.current = undefined;
    activeDragLatestPositionRef.current = undefined;
    helperLineCandidateIndexRef.current = undefined;
    if (!onNodePositionChange) return undefined;
    return onNodePositionChange({
      ...(startPosition ? { delta: { x: position.x - startPosition.x, y: position.y - startPosition.y } } : {}),
      id: sourceObjectId(runtimeNode),
      runtimeId,
      position,
      data: (runtimeNode.data || {}) as Record<string, unknown>
    });
  }, [clearHelperLines, compiled.selectedLayerIds, decorateRuntimeNodes, document, onNodePositionChange, setNodes, showRegions]);

  const onNodeDrag = useCallback((_event: unknown, node: unknown) => {
    const runtimeNode = node as unknown as Record<string, unknown>;
    activeDragLatestPositionRef.current = runtimeNodePosition(runtimeNode);
    if (!onNodePositionPreview) return;
    onNodePositionPreview({
      id: sourceObjectId(runtimeNode),
      runtimeId: String(runtimeNode.id || ''),
      position: runtimeNodePosition(runtimeNode),
      data: (runtimeNode.data || {}) as Record<string, unknown>
    });
  }, [onNodePositionPreview]);

  const resolveConnection = useCallback((connection: Connection): TopoViewerConnectionCreate | undefined => {
    if (!connection.source || !connection.target) return undefined;
    const sourceNode = nodesRef.current.find((node) => String(node.id || '') === connection.source);
    const targetNode = nodesRef.current.find((node) => String(node.id || '') === connection.target);
    if (!sourceNode || !targetNode) return undefined;
    const sourceRuntime = sourceNode as unknown as Record<string, unknown>;
    const targetRuntime = targetNode as unknown as Record<string, unknown>;
    return {
      sourceId: sourceObjectId(sourceRuntime),
      sourceRuntimeId: connection.source,
      sourceHandleId: connection.sourceHandle || undefined,
      targetId: sourceObjectId(targetRuntime),
      targetRuntimeId: connection.target,
      targetHandleId: connection.targetHandle || undefined
    };
  }, []);

  const handleConnect = useCallback((connection: Connection) => {
    if (!onConnectionCreate) return;
    const resolved = resolveConnection(connection);
    if (resolved) onConnectionCreate(resolved);
  }, [onConnectionCreate, resolveConnection]);

  const handleConnectionValidation = useCallback((connection: Connection) => {
    const resolved = resolveConnection(connection);
    if (!resolved) return false;
    return isConnectionValid ? isConnectionValid(resolved) : true;
  }, [isConnectionValid, resolveConnection]);

  const handlePaneClick = useCallback((event: MouseEvent) => {
    if (!onPaneClick) return;
    onPaneClick({
      clientX: event.clientX,
      clientY: event.clientY,
      position: reactFlow.screenToFlowPosition({ x: event.clientX, y: event.clientY }),
      viewport: reactFlow.getViewport(),
      modifiers: {
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        shiftKey: event.shiftKey
      }
    });
  }, [onPaneClick, reactFlow]);

  const handleSelectionChange = useCallback<OnSelectionChangeFunc>(({ nodes: selectedNodes, edges: selectedEdges }) => {
    if (!onSelectionChange) return;
    onSelectionChange({
      objects: [
        ...selectedNodes.map((node) => {
          const runtimeNode = node as unknown as Record<string, unknown>;
          return {
            id: sourceObjectId(runtimeNode),
            runtimeId: String(runtimeNode.id),
            element: 'node' as const,
            data: (runtimeNode.data || {}) as Record<string, unknown>
          };
        }),
        ...selectedEdges.map((edge) => {
          const runtimeEdge = edge as unknown as Record<string, unknown>;
          return {
            id: sourceObjectId(runtimeEdge),
            runtimeId: String(runtimeEdge.id),
            element: 'edge' as const,
            data: (runtimeEdge.data || {}) as Record<string, unknown>
          };
        })
      ]
    });
  }, [onSelectionChange]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={onObjectClick ? (_event, node) => {
        const runtimeNode = node as unknown as Record<string, unknown>;
        return onObjectClick({
          id: sourceObjectId(runtimeNode),
          runtimeId: String(runtimeNode.id),
          element: 'node',
          data: (runtimeNode.data || {}) as Record<string, unknown>,
          modifiers: {
            ctrlKey: _event.ctrlKey,
            metaKey: _event.metaKey,
            shiftKey: _event.shiftKey
          }
        });
      } : undefined}
      onEdgeClick={onObjectClick ? (_event, edge) => {
        const runtimeEdge = edge as unknown as Record<string, unknown>;
        const data = (runtimeEdge.data || {}) as Record<string, unknown>;
        if (data.interactive === false) {
          return undefined;
        }
        return onObjectClick({
          id: sourceObjectId(runtimeEdge),
          runtimeId: String(runtimeEdge.id),
          element: 'edge',
          data,
          modifiers: {
            ctrlKey: _event.ctrlKey,
            metaKey: _event.metaKey,
            shiftKey: _event.shiftKey
          }
        });
      } : undefined}
      onNodeContextMenu={onObjectContextMenu ? (_event, node) => {
        _event.preventDefault();
        const runtimeNode = node as unknown as Record<string, unknown>;
        onObjectContextMenu({
          clientX: _event.clientX,
          clientY: _event.clientY,
          id: sourceObjectId(runtimeNode),
          runtimeId: String(runtimeNode.id),
          element: 'node',
          data: (runtimeNode.data || {}) as Record<string, unknown>,
          modifiers: {
            ctrlKey: _event.ctrlKey,
            metaKey: _event.metaKey,
            shiftKey: _event.shiftKey
          }
        });
      } : undefined}
      onEdgeContextMenu={onObjectContextMenu ? (_event, edge) => {
        _event.preventDefault();
        const runtimeEdge = edge as unknown as Record<string, unknown>;
        onObjectContextMenu({
          clientX: _event.clientX,
          clientY: _event.clientY,
          id: sourceObjectId(runtimeEdge),
          runtimeId: String(runtimeEdge.id),
          element: 'edge',
          data: (runtimeEdge.data || {}) as Record<string, unknown>,
          modifiers: {
            ctrlKey: _event.ctrlKey,
            metaKey: _event.metaKey,
            shiftKey: _event.shiftKey
          }
        });
      } : undefined}
      onSelectionChange={onSelectionChange ? handleSelectionChange : undefined}
      onConnect={onConnectionCreate ? handleConnect : undefined}
      isValidConnection={isConnectionValid ? handleConnectionValidation : undefined}
      onPaneClick={onPaneClick ? handlePaneClick : undefined}
      onNodeDragStop={helperLineOptions.enabled || onNodePositionChange ? onNodeDragStop : undefined}
      onNodeDragStart={helperLineOptions.enabled || onNodePositionChange ? onNodeDragStart : undefined}
      onNodeDrag={onNodePositionPreview ? onNodeDrag : undefined}
      onMoveEnd={onViewportChange ? (_event, viewport) => onViewportChange(viewport) : undefined}
      nodeTypes={nodeTypes as never}
      edgeTypes={edgeTypes as never}
      defaultViewport={initialViewport}
      fitView={!initialViewport}
      fitViewOptions={{ padding: 0.06, maxZoom: 1 }}
      minZoom={0.2}
      maxZoom={8}
      connectionMode={connectionHandleMode === 'handles' ? ConnectionMode.Strict : ConnectionMode.Loose}
      connectionRadius={28}
      nodesDraggable={nodesDraggable !== false && nodesInitialized && nodesReadyForInteraction}
      nodesConnectable={nodesConnectable === true && nodesInitialized}
      elementsSelectable
      proOptions={{ hideAttribution: true }}
    >
      <Background color="rgba(126, 139, 154, 0.20)" gap={24} />
      <LabelOverlay nodes={nodes as never[]} edges={edges as never[]} />
      <HelperLinesOverlay lines={helperLineState} />
      <ViewportControls
        controlPanelToggle={controlPanelToggle}
        exportDisabled={exportDisabled}
        exportTooltip={exportTooltip}
        onExport={onExport}
      />
    </ReactFlow>
  );
}

export function TopoViewer({
  document,
  selectedLayerIds,
  selectedObjectIds,
  previewObjectIds,
  toggles,
  layout,
  attention,
  extensions,
  controlPanelToggle,
  exportDisabled,
  exportTooltip,
  helperLines,
  initialViewport,
  nodesDraggable,
  nodesResizable,
  nodesConnectable,
  connectionHandleMode = 'full-node',
  onObjectClick,
  onPaneClick,
  onNodePositionChange,
  onNodePositionPreview,
  onNodeResizeChange,
  onRegionAggregateToggle,
  onConnectionCreate,
  isConnectionValid,
  onObjectContextMenu,
  onSelectionChange,
  onViewportChange,
  onExport,
  className = '',
  style
}: TopoViewerProps) {
  const effectiveToggles = useMemo(() => {
    const documentDefaults = defaultTopoViewerToggles(document);
    return migrateTopoToggles({ ...documentDefaults, ...(toggles || emptyToggles) }) || emptyToggles;
  }, [document, toggles]);
  const effectiveExtensions = extensions || emptyExtensions;
  const effectiveLayers = useMemo(() => {
    return selectedLayerIds || layerIds(document.graph?.layers);
  }, [document, selectedLayerIds]);
  const extensionContext = useMemo(() => ({
    document,
    selectedLayerIds: effectiveLayers,
    toggles: effectiveToggles
  }), [document, effectiveLayers, effectiveToggles]);
  const nodeTypes = useMemo(() => {
    return effectiveExtensions.reduce((types, extension) => ({
      ...types,
      ...(extension.nodeTypes || {})
    }), builtInNodeTypes as Record<string, unknown>);
  }, [effectiveExtensions]);
  const edgeTypes = useMemo(() => {
    return effectiveExtensions.reduce((types, extension) => ({
      ...types,
      ...(extension.edgeTypes || {})
    }), builtInEdgeTypes as Record<string, unknown>);
  }, [effectiveExtensions]);
  const { compiled, preparedDocument } = useMemo(() => {
    const nextDocument = applyBeforeCompileExtensions(document, extensionContext, effectiveExtensions);
    const aggregateConfig = nextDocument.attention?.aggregate;
    const linkGroupingConfig = nextDocument.attention?.links?.grouping;
    const reducedDocument = (aggregateConfig?.groups?.length || linkGroupingConfig)
      ? deriveAggregateGraph(nextDocument, buildAttentionIndex(nextDocument), {
        groups: aggregateConfig?.groups || [],
        expandedGroupIds: aggregateConfig?.expandedGroupIds || [],
        linkGrouping: linkGroupingConfig
      }).document
      : nextDocument;
    assertRendererLimits(reducedDocument);
    const attentionPresentation = resolveAttentionPresentation(reducedDocument, attention);
    const compiledGraph = applyAttentionToCompiledGraph(
      compileTopoGraph(reducedDocument, effectiveLayers, effectiveToggles, layout),
      attentionPresentation
    );
    const nextContext = { ...extensionContext, document: reducedDocument };
    return {
      preparedDocument: reducedDocument,
      compiled: applyPreviewToCompiledGraph(
        applySelectionToCompiledGraph(applyAfterCompileExtensions(compiledGraph, nextContext, effectiveExtensions), selectedObjectIds),
        previewObjectIds
      )
    };
  }, [attention, document, effectiveExtensions, effectiveLayers, effectiveToggles, extensionContext, layout, previewObjectIds, selectedObjectIds]);

  const rootClassName = [
    'topoviewer',
    nodesConnectable ? 'topoviewer--connectable' : '',
    nodesConnectable ? `topoviewer--connection-${connectionHandleMode}` : '',
    className
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <div className={rootClassName} style={style} role="region" aria-label={document.graph?.id || 'TopoViewer diagram'}>
      <ReactFlowProvider>
        <TopoFlow
          compiled={compiled}
          document={preparedDocument}
          showRegions={effectiveToggles.showRegions !== false}
          controlPanelToggle={controlPanelToggle}
          exportDisabled={exportDisabled}
          exportTooltip={exportTooltip}
          helperLines={helperLines}
          previewObjectIds={previewObjectIds}
          initialViewport={initialViewport}
          nodesDraggable={nodesDraggable}
          nodesResizable={nodesResizable}
          nodesConnectable={nodesConnectable}
          connectionHandleMode={connectionHandleMode}
          onExport={onExport}
          onObjectClick={onObjectClick}
          onPaneClick={onPaneClick}
          onNodePositionChange={onNodePositionChange}
          onNodePositionPreview={onNodePositionPreview}
          onNodeResizeChange={onNodeResizeChange}
          onRegionAggregateToggle={onRegionAggregateToggle}
          onConnectionCreate={onConnectionCreate}
          isConnectionValid={isConnectionValid}
          onObjectContextMenu={onObjectContextMenu}
          onSelectionChange={onSelectionChange}
          onViewportChange={onViewportChange}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
        />
      </ReactFlowProvider>
    </div>
  );
}
