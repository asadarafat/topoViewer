import '@xyflow/react/dist/style.css';
import {
  Background,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  type NodeChange
} from '@xyflow/react';
import { useCallback, useEffect, useMemo } from 'react';
import { compileTopoGraph } from '../core/compiler';
import { resolveAttentionPresentationCached } from '../core/attention/cache';
import { assertRendererLimits } from '../core/limits';
import { migrateTopoToggles } from '../core/migration';
import type { AttentionPresentation, AttentionPresentationResult } from '../core/attention';
import type { CompiledGraph, TopoDocument, TopoViewerExtensionContext, TopoViewerProps } from '../core/types';
import { CalloutNode } from './CalloutNode';
import { FloatingEdge } from './FloatingEdge';
import { LabelOverlay } from './LabelOverlay';
import { NetworkNode } from './NetworkNode';
import { PinNode } from './PinNode';
import { RegionNode } from './RegionNode';
import { ShapeNode } from './ShapeNode';
import { ViewportControls } from './ViewportControls';
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
      };
    }),
    edges: graph.edges.map((edge) => {
      const attention = presentation.items.get(sourceObjectId(edge));
      if (!attention) return edge;
      const hidden = attention.state === 'hidden' || attention.state === 'suppressed';
      const opacity = attentionOpacity(attention.state);
      return {
        ...edge,
        hidden,
        zIndex: attention.state === 'focused' ? 110 : attention.state === 'related' ? 80 : edge.zIndex,
        data: decoratedAttentionData((edge.data || {}) as Record<string, unknown>, attention),
        style: {
          ...((edge.style || {}) as Record<string, unknown>),
          ...(opacity !== undefined ? { opacity } : {})
        }
      };
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
          ...((node.data || {}) as Record<string, unknown>),
          topoviewerSelected: true
        }
      } : node;
    }),
    edges: graph.edges.map((edge) => {
      const selectedEdge = selected.has(sourceObjectId(edge));
      return selectedEdge ? {
        ...edge,
        selected: true,
        data: {
          ...((edge.data || {}) as Record<string, unknown>),
          topoviewerSelected: true
        }
      } : edge;
    })
  };
}

function resolveAttentionPresentation(document: TopoDocument, attention: TopoViewerProps['attention']): AttentionPresentationResult | undefined {
  return resolveAttentionPresentationCached(document, attention || document.attention);
}

function TopoFlow({
  compiled,
  document,
  showRegions,
  controlPanelToggle,
  onExport,
  onObjectClick,
  onPaneClick,
  onNodePositionChange,
  onViewportChange,
  nodeTypes,
  edgeTypes
}: {
  compiled: ReturnType<typeof compileTopoGraph>;
  document: TopoViewerProps['document'];
  showRegions: boolean;
  controlPanelToggle?: TopoViewerProps['controlPanelToggle'];
  onExport?: TopoViewerProps['onExport'];
  onObjectClick?: TopoViewerProps['onObjectClick'];
  onPaneClick?: TopoViewerProps['onPaneClick'];
  onNodePositionChange?: TopoViewerProps['onNodePositionChange'];
  onViewportChange?: TopoViewerProps['onViewportChange'];
  nodeTypes: Record<string, unknown>;
  edgeTypes: Record<string, unknown>;
}) {
  const [nodes, setNodes] = useNodesState(compiled.nodes as never[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(compiled.edges as never[]);

  useEffect(() => {
    setNodes(compiled.nodes as never[]);
    setEdges(compiled.edges as never[]);
  }, [compiled, setEdges, setNodes]);

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((currentNodes) => applyTopoNodeChanges({
      changes,
      currentNodes,
      document,
      selectedLayerIds: compiled.selectedLayerIds,
      showRegions
    }));
  }, [compiled.selectedLayerIds, document, setNodes, showRegions]);

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
      onPaneClick={onPaneClick}
      onNodeDragStop={onNodePositionChange ? (_event, node) => {
        const runtimeNode = node as unknown as Record<string, unknown>;
        const position = (runtimeNode.position || {}) as { x?: number; y?: number };
        return onNodePositionChange({
          id: sourceObjectId(runtimeNode),
          runtimeId: String(runtimeNode.id),
          position: {
            x: Number(position.x || 0),
            y: Number(position.y || 0)
          },
          data: (runtimeNode.data || {}) as Record<string, unknown>
        });
      } : undefined}
      onMoveEnd={onViewportChange ? (_event, viewport) => onViewportChange(viewport) : undefined}
      nodeTypes={nodeTypes as never}
      edgeTypes={edgeTypes as never}
      fitView
      fitViewOptions={{ padding: 0.06 }}
      minZoom={0.2}
      maxZoom={8}
      nodesDraggable
      elementsSelectable
      proOptions={{ hideAttribution: true }}
    >
      <Background color="rgba(126, 139, 154, 0.20)" gap={24} />
      <LabelOverlay nodes={nodes as never[]} />
      <ViewportControls
        controlPanelToggle={controlPanelToggle}
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
  onObjectClick,
  onPaneClick,
  onNodePositionChange,
  onViewportChange,
  onExport,
  className = '',
  style
}: TopoViewerProps) {
  const effectiveToggles = migrateTopoToggles(toggles || emptyToggles) || emptyToggles;
  const effectiveExtensions = extensions || emptyExtensions;
  const effectiveLayers = useMemo(() => {
    return selectedLayerIds || document.graph?.layers?.map((layer) => layer.id) || [];
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

  return (
    <div className={`topoviewer ${className}`} style={style} role="img" aria-label={document.graph?.id || 'TopoViewer diagram'}>
      <ReactFlowProvider>
        <TopoFlow
          compiled={compiled}
          document={preparedDocument}
          showRegions={effectiveToggles.showRegions !== false}
          controlPanelToggle={controlPanelToggle}
          onExport={onExport}
          onObjectClick={onObjectClick}
          onPaneClick={onPaneClick}
          onNodePositionChange={onNodePositionChange}
          onViewportChange={onViewportChange}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
        />
      </ReactFlowProvider>
    </div>
  );
}
