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
import { assertRendererLimits } from '../core/limits';
import { migrateTopoToggles } from '../core/migration';
import type { CompiledGraph, TopoDocument, TopoViewerExtensionContext, TopoViewerProps } from '../core/types';
import { CalloutNode } from './CalloutNode';
import { FloatingEdge } from './FloatingEdge';
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

function TopoFlow({
  compiled,
  document,
  showRegions,
  controlPanelToggle,
  nodeTypes,
  edgeTypes
}: {
  compiled: ReturnType<typeof compileTopoGraph>;
  document: TopoViewerProps['document'];
  showRegions: boolean;
  controlPanelToggle?: TopoViewerProps['controlPanelToggle'];
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
      <ViewportControls controlPanelToggle={controlPanelToggle} />
    </ReactFlow>
  );
}

export function TopoViewer({
  document,
  selectedLayerIds,
  toggles,
  layout,
  extensions,
  controlPanelToggle,
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
    const compiledGraph = compileTopoGraph(nextDocument, effectiveLayers, effectiveToggles, layout);
    const nextContext = { ...extensionContext, document: nextDocument };
    return {
      preparedDocument: nextDocument,
      compiled: applyAfterCompileExtensions(compiledGraph, nextContext, effectiveExtensions)
    };
  }, [document, effectiveExtensions, effectiveLayers, effectiveToggles, extensionContext, layout]);

  return (
    <div className={`topoviewer ${className}`} style={style} role="img" aria-label={document.graph?.id || 'TopoViewer diagram'}>
      <ReactFlowProvider>
        <TopoFlow
          compiled={compiled}
          document={preparedDocument}
          showRegions={effectiveToggles.showRegions !== false}
          controlPanelToggle={controlPanelToggle}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
        />
      </ReactFlowProvider>
    </div>
  );
}
