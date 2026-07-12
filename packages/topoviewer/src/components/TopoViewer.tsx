import '@xyflow/react/dist/style.css';
import {
  applyNodeChanges,
  Background,
  ConnectionMode,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  useEdgesState,
  useNodesInitialized,
  useNodesState,
  type Connection,
  type OnSelectionChangeFunc,
  type NodeChange
} from '@xyflow/react';
import { startTransition, useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import { compileTopoGraph } from '../core/compiler';
import { buildAttentionIndex, deriveAggregateGraph } from '../core/attention';
import { assertRendererLimits } from '../core/limits';
import { layerIds } from '../core/layers';
import {
  assertValidPositionOnlyFields,
  patchCompiledPositions,
  positionInsensitiveDocumentSignature,
  supportsPositionOnlyCompile
} from '../core/incrementalCompile';
import { migrateTopoToggles } from '../core/migration';
import { defaultTopoViewerToggles } from '../core/toggles';
import type {
  CompiledGraph,
  TopoDocument,
  TopoViewerConnectionCreate,
  TopoViewerProps
} from '../core/types';
import { CalloutNode } from './CalloutNode';
import { FloatingEdge } from './FloatingEdge';
import { createHelperLineStore, HelperLinesOverlay, type HelperLineStore } from './HelperLinesOverlay';
import { LabelOverlay } from './LabelOverlay';
import { useEdgeEndpointInternals } from './edgeEndpointInternals';
import {
  applyAfterCompileExtensions,
  applyAttentionToCompiledGraph,
  applyBeforeCompileExtensions,
  resolveAttentionPresentation,
  withRuntimeDirectionHandlers,
  withRuntimeRegionAggregateHandlers,
  withRuntimeResizeHandlers
} from './graphDecorators';
import { NetworkNode } from './NetworkNode';
import { PinNode } from './PinNode';
import { RegionNode } from './RegionNode';
import { ShapeNode } from './ShapeNode';
import { TextNode } from './TextNode';
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
  runtimeObjectInteraction,
  sameRuntimePosition,
  sourceObjectId
} from './runtimeGraph';
import '../styles.css';

const builtInNodeTypes = { network: NetworkNode, region: RegionNode, shape: ShapeNode, callout: CalloutNode, text: TextNode, pin: PinNode };
const builtInEdgeTypes = { floating: FloatingEdge };
const emptyToggles: NonNullable<TopoViewerProps['toggles']> = {};
const emptyExtensions: NonNullable<TopoViewerProps['extensions']> = [];

function preserveActiveDragNodes(
  nextNodes: Array<Record<string, unknown>>,
  currentNodes: Array<Record<string, unknown>>,
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

function TopoFlow({
  compiled,
  compileToken,
  document,
  positionOnlyCompile,
  showRegions,
  controlPanelToggle,
  exportDisabled,
  exportTooltip,
  helperLines,
  selectedObjectIds,
  previewObjectIds,
  initialViewport,
  nodesDraggable = true,
  nodesResizable = false,
  nodesConnectable = false,
  onlyRenderVisibleElements = false,
  connectionHandleMode = 'full-node',
  onExport,
  onObjectClick,
  onObjectDoubleClick,
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
  compileToken: object;
  document: TopoViewerProps['document'];
  positionOnlyCompile: boolean;
  showRegions: boolean;
  controlPanelToggle?: TopoViewerProps['controlPanelToggle'];
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
  connectionHandleMode?: TopoViewerProps['connectionHandleMode'];
  onExport?: TopoViewerProps['onExport'];
  onObjectClick?: TopoViewerProps['onObjectClick'];
  onObjectDoubleClick?: TopoViewerProps['onObjectDoubleClick'];
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
  const compiledNodeByRuntimeId = useMemo(() => new Map(
    compiled.nodes.map((node) => [String(node.id || ''), node])
  ), [compiled.nodes]);
  const decorateRuntimeEdges = useCallback((sourceEdges: ReturnType<typeof compileTopoGraph>['edges']) => (
    withRuntimeDirectionHandlers(sourceEdges, onObjectClick, onObjectDoubleClick)
  ), [onObjectClick, onObjectDoubleClick]);
  const [nodes, setNodes] = useNodesState(runtimeNodes as never[]);
  const sourceEdgeIds = useMemo(() => new Set(compiled.edges.map((edge) => edge.id)), [compiled.edges]);
  const [edges, setEdges, applyRuntimeEdgeChanges] = useEdgesState(decorateRuntimeEdges(compiled.edges) as never[]);
  const onEdgesChange = useCallback((changes: Parameters<typeof applyRuntimeEdgeChanges>[0]) => (
    applyRuntimeEdgeChanges(preserveSourceOwnedEdges(changes, sourceEdgeIds))
  ), [applyRuntimeEdgeChanges, sourceEdgeIds]);
  useEdgeEndpointInternals(compiled.edges);
  const [nodesReadyForInteraction, setNodesReadyForInteraction] = useState(false);
  const [labelsFrozen, setLabelsFrozen] = useState(false);
  const reactFlow = useReactFlow();
  const nodesInitialized = useNodesInitialized({ includeHiddenNodes: true });
  const helperLineOptions = useMemo(() => normalizeHelperLinesOptions(helperLines), [helperLines]);
  const helperLineStoreRef = useRef<HelperLineStore>();
  if (!helperLineStoreRef.current) helperLineStoreRef.current = createHelperLineStore();
  const helperLineStore = helperLineStoreRef.current;
  const scheduleHelperLineState = helperLineStore.set;
  const clearHelperLines = helperLineStore.clear;
  const nodesRef = useRef<HelperLineNodeLike[]>(compiled.nodes as unknown as HelperLineNodeLike[]);
  const snappedPositionsRef = useRef(new Map<string, { x: number; y: number }>());
  const activeDragNodeIdRef = useRef<string | undefined>();
  const activeDragRuntimeIdsRef = useRef<ReadonlySet<string>>(new Set());
  const activeDragStartPositionRef = useRef<{ x: number; y: number } | undefined>();
  const activeDragLatestPositionRef = useRef<{ x: number; y: number } | undefined>();
  const activeHelperLineStateRef = useRef<HelperLineState>(emptyHelperLineState);
  const helperLineCandidateIndexRef = useRef<HelperLineCandidateIndex | undefined>();
  const labelThawFrameRef = useRef<number>();
  useEffect(() => () => {
    if (labelThawFrameRef.current !== undefined) cancelAnimationFrame(labelThawFrameRef.current);
  }, []);
  const appliedCompileTokenRef = useRef<object>();
  useEffect(() => {
    const activeDragRuntimeIds = activeDragRuntimeIdsRef.current;
    if (positionOnlyCompile && appliedCompileTokenRef.current === compileToken) {
      const nextById = new Map(runtimeNodes.map((node) => [String(node.id || ''), node]));
      setNodes((currentNodes) => {
        let changed = false;
        const nextNodes = (currentNodes as unknown as Array<Record<string, unknown>>).map((currentNode) => {
          if (activeDragRuntimeIds.has(String(currentNode.id || ''))) return currentNode;
          const nextNode = nextById.get(String(currentNode.id || '')) as unknown as Record<string, unknown> | undefined;
          if (!nextNode) return currentNode;
          const currentPosition = runtimeNodePosition(currentNode);
          const nextPosition = runtimeNodePosition(nextNode);
          if (sameRuntimePosition(currentPosition, nextPosition)) return currentNode;
          changed = true;
          return { ...currentNode, position: nextPosition };
        });
        if (changed) nodesRef.current = nextNodes as unknown as HelperLineNodeLike[];
        return (changed ? nextNodes : currentNodes) as never[];
      });
      return;
    }
    appliedCompileTokenRef.current = compileToken;
    setEdges(decorateRuntimeEdges(compiled.edges) as never[]);
    setNodes((currentNodes) => {
      const nextNodes = preserveActiveDragNodes(
        preserveRuntimeNodeMeasurements(runtimeNodes, currentNodes) as Array<Record<string, unknown>>,
        currentNodes as unknown as Array<Record<string, unknown>>,
        activeDragRuntimeIds
      );
      nodesRef.current = nextNodes as unknown as HelperLineNodeLike[];
      return nextNodes as never[];
    });
    if (activeDragRuntimeIds.size) return;
    snappedPositionsRef.current.clear();
    activeDragNodeIdRef.current = undefined;
    activeDragRuntimeIdsRef.current = new Set();
    activeDragStartPositionRef.current = undefined;
    activeDragLatestPositionRef.current = undefined;
    activeHelperLineStateRef.current = emptyHelperLineState;
    helperLineCandidateIndexRef.current = undefined;
    clearHelperLines();
  }, [clearHelperLines, compiled, compileToken, decorateRuntimeEdges, positionOnlyCompile, runtimeNodes, setEdges, setNodes]);
  useEffect(() => {
    if (activeDragRuntimeIdsRef.current.size) return undefined;
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
  }, [compileToken, nodesInitialized]);
  useEffect(() => {
    nodesRef.current = nodes as unknown as HelperLineNodeLike[];
  }, [nodes]);

  useEffect(() => {
    const selected = new Set(selectedObjectIds || []);
    setNodes((currentNodes) => {
      let changed = false;
      const nextNodes = (currentNodes as unknown as Array<Record<string, unknown>>).map((node) => {
        const nextSelected = selected.has(sourceObjectId(node));
        if ((node.selected === true) === nextSelected) return node;
        changed = true;
        if (activeDragRuntimeIdsRef.current.has(String(node.id || ''))) {
          return { ...node, selected: nextSelected };
        }
        const sourceNode = compiledNodeByRuntimeId.get(String(node.id || '')) || node;
        const decorated = decorateRuntimeNodes([
          { ...sourceNode, selected: nextSelected } as never
        ])[0];
        return preserveRuntimeNodeMeasurements([decorated], [node])[0] as Record<string, unknown>;
      });
      if (changed) nodesRef.current = nextNodes as unknown as HelperLineNodeLike[];
      return (changed ? nextNodes : currentNodes) as never[];
    });
    setEdges((currentEdges) => {
      let changed = false;
      const nextEdges = (currentEdges as unknown as Array<Record<string, unknown>>).map((edge) => {
        const data = (edge.data || {}) as Record<string, unknown>;
        let directionChanged = false;
        const linkDirections = Array.isArray(data.linkDirections)
          ? data.linkDirections.map((direction) => {
            if (!direction || typeof direction !== 'object') return direction;
            const record = direction as Record<string, unknown>;
            const directionData = (record.data || {}) as Record<string, unknown>;
            const nextSelected = selected.has(String(record.id || directionData.id || ''));
            if ((directionData.topoviewerSelected === true) === nextSelected) return direction;
            directionChanged = true;
            if (nextSelected) {
              return { ...record, data: { ...directionData, topoviewerSelected: true } };
            }
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
      return (changed ? nextEdges : currentEdges) as never[];
    });
  }, [compiledNodeByRuntimeId, decorateRuntimeNodes, selectedObjectIds, setEdges, setNodes]);

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
      activeDragRuntimeIdsRef.current = new Set();
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
    if (hasActivePositionDrag && !hasRegionPositionChange(nextChanges)) {
      setNodes((currentNodes) => {
        const nextNodes = applyNodeChanges(nextChanges, currentNodes) as never[];
        nodesRef.current = nextNodes as unknown as HelperLineNodeLike[];
        return nextNodes;
      });
      return;
    }
    setNodes((currentNodes) => {
      const nextNodes = applyTopoNodeChanges({
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
    if (labelThawFrameRef.current !== undefined) {
      cancelAnimationFrame(labelThawFrameRef.current);
      labelThawFrameRef.current = undefined;
    }
    setLabelsFrozen(true);
    const runtimeNode = node as unknown as Record<string, unknown>;
    const runtimeId = String(runtimeNode.id || '');
    activeDragNodeIdRef.current = runtimeId;
    const activeDragRuntimeIds = runtimeId
      ? regionDragGroupRuntimeIds(document, runtimeId)
      : new Set<string>();
    activeDragRuntimeIdsRef.current = activeDragRuntimeIds;
    activeDragStartPositionRef.current = runtimeId ? runtimeNodePosition(runtimeNode) : undefined;
    activeDragLatestPositionRef.current = activeDragStartPositionRef.current;
    if (!helperLineOptions.enabled || !runtimeId) {
      helperLineCandidateIndexRef.current = undefined;
      return;
    }
    const candidates = nodesRef.current.flatMap((candidateNode) => {
      if (activeDragRuntimeIds.has(String(candidateNode.id || ''))) return [];
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
        if (!shouldRebuildRegions && sameRuntimePosition(currentPosition, position)) {
          nodesRef.current = currentNodes as unknown as HelperLineNodeLike[];
          return currentNodes;
        }
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
    activeDragRuntimeIdsRef.current = new Set();
    activeDragStartPositionRef.current = undefined;
    activeDragLatestPositionRef.current = undefined;
    helperLineCandidateIndexRef.current = undefined;
    if (!onNodePositionChange) {
      setLabelsFrozen(false);
      return undefined;
    }
    const result = onNodePositionChange({
      ...(startPosition ? { delta: { x: position.x - startPosition.x, y: position.y - startPosition.y } } : {}),
      id: sourceObjectId(runtimeNode),
      runtimeId,
      position,
      data: (runtimeNode.data || {}) as Record<string, unknown>
    });
    labelThawFrameRef.current = requestAnimationFrame(() => {
      labelThawFrameRef.current = undefined;
      startTransition(() => setLabelsFrozen(false));
    });
    return result;
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
      onNodeDoubleClick={onObjectDoubleClick ? (_event, node) => {
        onObjectDoubleClick(runtimeObjectInteraction(
          node as unknown as Record<string, unknown>,
          'node',
          _event
        ));
      } : undefined}
      onEdgeDoubleClick={onObjectDoubleClick ? (_event, edge) => {
        const runtimeEdge = edge as unknown as Record<string, unknown>;
        const data = (runtimeEdge.data || {}) as Record<string, unknown>;
        if (data.interactive === false) return;
        onObjectDoubleClick(runtimeObjectInteraction(runtimeEdge, 'edge', _event));
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
      onlyRenderVisibleElements={onlyRenderVisibleElements}
      elementsSelectable
      proOptions={{ hideAttribution: true }}
    >
      <Background color="rgba(126, 139, 154, 0.20)" gap={24} />
      <LabelOverlay
        nodes={nodes as never[]}
        edges={edges as never[]}
        frozen={labelsFrozen}
        onlyRenderVisibleElements={onlyRenderVisibleElements}
      />
      <HelperLinesOverlay store={helperLineStore} />
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
  onlyRenderVisibleElements,
  connectionHandleMode = 'full-node',
  onObjectClick,
  onObjectDoubleClick,
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
  const documentCompileSignature = useMemo(
    () => positionInsensitiveDocumentSignature(document),
    [document]
  );
  const renderCompileSignature = useMemo(() => JSON.stringify({
    layout,
    selectedLayerIds: effectiveLayers,
    toggles: effectiveToggles
  }), [effectiveLayers, effectiveToggles, layout]);
  const positionCompileCacheRef = useRef<{
    baseCompiled: CompiledGraph;
    compileToken: object;
    documentSignature: string;
    positionOnlyEligible: boolean;
    preparedDocument: TopoDocument;
    renderSignature: string;
  }>();
  const { baseCompiled, compileToken, positionOnlyCompile, preparedDocument } = useMemo(() => {
    const previous = positionCompileCacheRef.current;
    if (
      previous
      && previous.positionOnlyEligible
      && attention === undefined
      && previous.documentSignature === documentCompileSignature
      && previous.renderSignature === renderCompileSignature
      && supportsPositionOnlyCompile({
        document,
        hasExtensions: effectiveExtensions.length > 0,
        layoutOverride: layout
      })
    ) {
      assertValidPositionOnlyFields(document);
      const result = {
        preparedDocument: document,
        baseCompiled: patchCompiledPositions(previous.baseCompiled, document),
        compileToken: previous.compileToken,
        positionOnlyCompile: true
      };
      positionCompileCacheRef.current = {
        baseCompiled: result.baseCompiled,
        compileToken: result.compileToken,
        preparedDocument: result.preparedDocument,
        documentSignature: documentCompileSignature,
        positionOnlyEligible: true,
        renderSignature: renderCompileSignature
      };
      return result;
    }
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
    const positionOnlyEligible = attention === undefined && supportsPositionOnlyCompile({
      document,
      hasExtensions: effectiveExtensions.length > 0,
      layoutOverride: layout
    });
    const result = {
      preparedDocument: reducedDocument,
      baseCompiled: applyAfterCompileExtensions(compiledGraph, nextContext, effectiveExtensions),
      compileToken: {},
      positionOnlyCompile: false
    };
    positionCompileCacheRef.current = {
      baseCompiled: result.baseCompiled,
      compileToken: result.compileToken,
      preparedDocument: result.preparedDocument,
      documentSignature: documentCompileSignature,
      positionOnlyEligible,
      renderSignature: renderCompileSignature
    };
    return result;
  }, [
    attention,
    document,
    documentCompileSignature,
    effectiveExtensions,
    effectiveLayers,
    effectiveToggles,
    extensionContext,
    layout,
    renderCompileSignature
  ]);
  const compiled = baseCompiled;

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
          compileToken={compileToken}
          document={preparedDocument}
          positionOnlyCompile={positionOnlyCompile}
          showRegions={effectiveToggles.showRegions !== false}
          controlPanelToggle={controlPanelToggle}
          exportDisabled={exportDisabled}
          exportTooltip={exportTooltip}
          helperLines={helperLines}
          selectedObjectIds={selectedObjectIds}
          previewObjectIds={previewObjectIds}
          initialViewport={initialViewport}
          nodesDraggable={nodesDraggable}
          nodesResizable={nodesResizable}
          nodesConnectable={nodesConnectable}
          onlyRenderVisibleElements={onlyRenderVisibleElements}
          connectionHandleMode={connectionHandleMode}
          onExport={onExport}
          onObjectClick={onObjectClick}
          onObjectDoubleClick={onObjectDoubleClick}
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
