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
  type NodeChange
} from '@xyflow/react';
import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import { compileTopoGraph } from '../core/compiler';
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
  TopoViewerExtensionContext,
  TopoViewerProps
} from '../core/types';
import { CalloutNode } from './CalloutNode';
import { FloatingEdge } from './FloatingEdge';
import { HelperLinesOverlay } from './HelperLinesOverlay';
import { LabelOverlay } from './LabelOverlay';
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

function sourceObjectId(compiledObject: Record<string, unknown>): string {
  const data = (compiledObject.data || {}) as Record<string, unknown>;
  return String(data.id || compiledObject.id || '');
}

function samePosition(first: { x: number; y: number } | undefined, second: { x: number; y: number } | undefined) {
  if (!first || !second) return false;
  return Math.abs(first.x - second.x) < 0.5 && Math.abs(first.y - second.y) < 0.5;
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

function preserveRuntimeNodeMeasurements(nextNodes: unknown[], currentNodes: unknown[]) {
  const currentById = new Map(currentNodes.map((node) => [String((node as { id?: unknown }).id || ''), node as Record<string, unknown>]));
  return nextNodes.map((node) => {
    const current = currentById.get(String((node as { id?: unknown }).id || ''));
    if (!current) return node;
    const runtimeMeasurements: Record<string, unknown> = {};
    if (current.height !== undefined) runtimeMeasurements.height = current.height;
    if (current.measured !== undefined) runtimeMeasurements.measured = current.measured;
    if (current.width !== undefined) runtimeMeasurements.width = current.width;
    return {
      ...(node as Record<string, unknown>),
      ...runtimeMeasurements
    };
  });
}

function hasRegionPositionChange(changes: NodeChange[]) {
  return changes.some((change) => (
    change.type === 'position' && String(change.id || '').startsWith('region:')
  ));
}

function TopoFlow({
  compiled,
  document,
  showRegions,
  controlPanelToggle,
  exportDisabled,
  exportTooltip,
  helperLines,
  initialViewport,
  nodesDraggable = true,
  nodesConnectable = false,
  onExport,
  onObjectClick,
  onPaneClick,
  onNodePositionChange,
  onConnectionCreate,
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
  initialViewport?: TopoViewerProps['initialViewport'];
  nodesDraggable?: TopoViewerProps['nodesDraggable'];
  nodesConnectable?: TopoViewerProps['nodesConnectable'];
  onExport?: TopoViewerProps['onExport'];
  onObjectClick?: TopoViewerProps['onObjectClick'];
  onPaneClick?: TopoViewerProps['onPaneClick'];
  onNodePositionChange?: TopoViewerProps['onNodePositionChange'];
  onConnectionCreate?: TopoViewerProps['onConnectionCreate'];
  onViewportChange?: TopoViewerProps['onViewportChange'];
  nodeTypes: Record<string, unknown>;
  edgeTypes: Record<string, unknown>;
}) {
  const [nodes, setNodes] = useNodesState(compiled.nodes as never[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(withRuntimeDirectionHandlers(compiled.edges, onObjectClick) as never[]);
  const reactFlow = useReactFlow();
  const nodesInitialized = useNodesInitialized({ includeHiddenNodes: true });
  const helperLineOptions = useMemo(() => normalizeHelperLinesOptions(helperLines), [helperLines]);
  const [helperLineState, scheduleHelperLineState, clearHelperLines] = useHelperLineState();
  const nodesRef = useRef<HelperLineNodeLike[]>(compiled.nodes as unknown as HelperLineNodeLike[]);
  const snappedPositionsRef = useRef(new Map<string, { x: number; y: number }>());
  const activeDragNodeIdRef = useRef<string | undefined>();
  const activeHelperLineStateRef = useRef<HelperLineState>(emptyHelperLineState);
  const helperLineCandidateIndexRef = useRef<HelperLineCandidateIndex | undefined>();

  useEffect(() => {
    if (activeDragNodeIdRef.current) return;
    setNodes((currentNodes) => {
      const nextNodes = preserveRuntimeNodeMeasurements(compiled.nodes, currentNodes);
      nodesRef.current = nextNodes as unknown as HelperLineNodeLike[];
      return nextNodes as never[];
    });
    setEdges(withRuntimeDirectionHandlers(compiled.edges, onObjectClick) as never[]);
    snappedPositionsRef.current.clear();
    activeDragNodeIdRef.current = undefined;
    activeHelperLineStateRef.current = emptyHelperLineState;
    helperLineCandidateIndexRef.current = undefined;
    clearHelperLines();
  }, [clearHelperLines, compiled, onObjectClick, setEdges, setNodes]);

  useEffect(() => {
    nodesRef.current = nodes as unknown as HelperLineNodeLike[];
  }, [nodes]);

  useEffect(() => {
    if (!helperLineOptions.enabled) {
      snappedPositionsRef.current.clear();
      activeDragNodeIdRef.current = undefined;
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
      nodesRef.current = nextNodes as unknown as HelperLineNodeLike[];
      return nextNodes;
    });
  }, [compiled.selectedLayerIds, document, helperLineOptions, nodesDraggable, scheduleHelperLineState, setNodes, showRegions]);

  const onNodeDragStart = useCallback((_event: unknown, node: unknown) => {
    const runtimeNode = node as unknown as Record<string, unknown>;
    const runtimeId = String(runtimeNode.id || '');
    activeDragNodeIdRef.current = runtimeId;
    if (!helperLineOptions.enabled || !runtimeId) {
      helperLineCandidateIndexRef.current = undefined;
      return;
    }
    const candidates = nodesRef.current.flatMap((candidateNode) => {
      const box = helperLineBoxFromNode(candidateNode);
      return box ? [box] : [];
    });
    helperLineCandidateIndexRef.current = prepareHelperLineCandidateIndex(candidates, runtimeId, helperLineOptions);
  }, [helperLineOptions]);

  const onNodeDragStop = useCallback((_event: unknown, node: unknown) => {
    clearHelperLines();
    activeHelperLineStateRef.current = emptyHelperLineState;
    const runtimeNode = node as unknown as Record<string, unknown>;
    const runtimeId = String(runtimeNode.id || '');
    const hasCommittedSnap = snappedPositionsRef.current.has(runtimeId);
    const shouldRebuildRegions = showRegions && !!document.graph?.regions?.length;
    const position = resolveDragStopPosition({
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
          changes: samePosition(currentPosition, position)
            ? []
            : [{ id: runtimeId, type: 'position', dragging: false, position }] as NodeChange[],
          currentNodes,
          document,
          selectedLayerIds: compiled.selectedLayerIds,
          showRegions
        });
        nodesRef.current = nextNodes as unknown as HelperLineNodeLike[];
        return nextNodes;
      });
    }
    snappedPositionsRef.current.delete(runtimeId);
    activeDragNodeIdRef.current = undefined;
    helperLineCandidateIndexRef.current = undefined;
    if (!onNodePositionChange) return undefined;
    return onNodePositionChange({
      id: sourceObjectId(runtimeNode),
      runtimeId,
      position,
      data: (runtimeNode.data || {}) as Record<string, unknown>
    });
  }, [clearHelperLines, compiled.selectedLayerIds, document, onNodePositionChange, setNodes, showRegions]);

  const handleConnect = useCallback((connection: Connection) => {
    if (!onConnectionCreate || !connection.source || !connection.target) return;
    const sourceNode = nodesRef.current.find((node) => String(node.id || '') === connection.source);
    const targetNode = nodesRef.current.find((node) => String(node.id || '') === connection.target);
    if (!sourceNode || !targetNode) return;
    const sourceRuntime = sourceNode as unknown as Record<string, unknown>;
    const targetRuntime = targetNode as unknown as Record<string, unknown>;
    onConnectionCreate({
      sourceId: sourceObjectId(sourceRuntime),
      sourceRuntimeId: connection.source,
      sourceHandleId: connection.sourceHandle || undefined,
      targetId: sourceObjectId(targetRuntime),
      targetRuntimeId: connection.target,
      targetHandleId: connection.targetHandle || undefined
    });
  }, [onConnectionCreate]);

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
      onConnect={onConnectionCreate ? handleConnect : undefined}
      onPaneClick={onPaneClick ? handlePaneClick : undefined}
      onNodeDragStop={helperLineOptions.enabled || onNodePositionChange ? onNodeDragStop : undefined}
      onNodeDragStart={helperLineOptions.enabled ? onNodeDragStart : undefined}
      onMoveEnd={onViewportChange ? (_event, viewport) => onViewportChange(viewport) : undefined}
      nodeTypes={nodeTypes as never}
      edgeTypes={edgeTypes as never}
      defaultViewport={initialViewport}
      fitView={!initialViewport}
      fitViewOptions={{ padding: 0.06, maxZoom: 1 }}
      minZoom={0.2}
      maxZoom={8}
      connectionMode={nodesConnectable ? ConnectionMode.Loose : ConnectionMode.Strict}
      connectionRadius={28}
      nodesDraggable={nodesDraggable !== false && nodesInitialized}
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
  nodesConnectable,
  onObjectClick,
  onPaneClick,
  onNodePositionChange,
  onConnectionCreate,
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
    assertRendererLimits(nextDocument);
    const attentionPresentation = resolveAttentionPresentation(nextDocument, attention);
    const compiledGraph = applyAttentionToCompiledGraph(
      compileTopoGraph(nextDocument, effectiveLayers, effectiveToggles, layout),
      attentionPresentation
    );
    const nextContext = { ...extensionContext, document: nextDocument };
    return {
      preparedDocument: nextDocument,
      compiled: applySelectionToCompiledGraph(applyAfterCompileExtensions(compiledGraph, nextContext, effectiveExtensions), selectedObjectIds)
    };
  }, [attention, document, effectiveExtensions, effectiveLayers, effectiveToggles, extensionContext, layout, selectedObjectIds]);

  const rootClassName = ['topoviewer', nodesConnectable ? 'topoviewer--connectable' : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootClassName} style={style} role="img" aria-label={document.graph?.id || 'TopoViewer diagram'}>
      <ReactFlowProvider>
        <TopoFlow
          compiled={compiled}
          document={preparedDocument}
          showRegions={effectiveToggles.showRegions !== false}
          controlPanelToggle={controlPanelToggle}
          exportDisabled={exportDisabled}
          exportTooltip={exportTooltip}
          helperLines={helperLines}
          initialViewport={initialViewport}
          nodesDraggable={nodesDraggable}
          nodesConnectable={nodesConnectable}
          onExport={onExport}
          onObjectClick={onObjectClick}
          onPaneClick={onPaneClick}
          onNodePositionChange={onNodePositionChange}
          onConnectionCreate={onConnectionCreate}
          onViewportChange={onViewportChange}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
        />
      </ReactFlowProvider>
    </div>
  );
}
