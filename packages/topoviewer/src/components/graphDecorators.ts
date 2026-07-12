import type { ResizeParams } from '@xyflow/react';
import { resolveAttentionPresentationCached } from '../core/attention/cache';
import type { AttentionPresentation, AttentionPresentationResult } from '../core/attention';
import type {
  CompiledEdge,
  CompiledEdgeData,
  CompiledGraph,
  CompiledNode,
  CompiledNodeData,
  TopoDocument,
  TopoViewerExtensionContext,
  TopoViewerNodeResizeChange,
  TopoViewerProps
} from '../core/types';
import { sourceObjectId } from './runtimeGraph';

export function applyBeforeCompileExtensions(
  document: TopoDocument,
  context: TopoViewerExtensionContext,
  extensions: NonNullable<TopoViewerProps['extensions']>
) {
  return extensions.reduce((currentDocument, extension) => {
    if (!extension.beforeCompile) return currentDocument;
    return extension.beforeCompile(currentDocument, { ...context, document: currentDocument });
  }, document);
}

export function applyAfterCompileExtensions(
  graph: CompiledGraph,
  context: TopoViewerExtensionContext,
  extensions: NonNullable<TopoViewerProps['extensions']>
) {
  return extensions.reduce((currentGraph, extension) => {
    if (!extension.afterCompile) return currentGraph;
    return extension.afterCompile(currentGraph, context);
  }, graph);
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

export function applyAttentionToCompiledGraph(
  graph: CompiledGraph,
  presentation: AttentionPresentationResult | undefined
): CompiledGraph {
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

export function withRuntimeDirectionHandlers(
  edges: CompiledGraph['edges'],
  onObjectClick: TopoViewerProps['onObjectClick'],
  onObjectDoubleClick?: TopoViewerProps['onObjectDoubleClick']
): CompiledGraph['edges'] {
  if (!onObjectClick && !onObjectDoubleClick) return edges;
  return edges.map((edge) => {
    const data = (edge.data || {}) as CompiledEdgeData;
    if (!Array.isArray(data.linkDirections) || !data.linkDirections.length) return edge;
    return {
      ...edge,
      data: {
        ...data,
        ...(onObjectClick ? {
          __topoviewerOnLinkDirectionClick: (
            event: { stopPropagation: () => void; ctrlKey?: boolean; metaKey?: boolean; shiftKey?: boolean },
            direction: Record<string, unknown>
          ) => {
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
        } : {}),
        ...(onObjectDoubleClick ? {
          __topoviewerOnLinkDirectionDoubleClick: (
            event: { clientX: number; clientY: number; stopPropagation: () => void; ctrlKey?: boolean; metaKey?: boolean; shiftKey?: boolean },
            direction: Record<string, unknown>
          ) => {
            event.stopPropagation();
            const directionData = (direction.data || {}) as Record<string, unknown>;
            if (data.interactive === false || directionData.interactive === false) return;
            onObjectDoubleClick({
              clientX: event.clientX,
              clientY: event.clientY,
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
        } : {})
      } as CompiledEdgeData
    } as CompiledEdge;
  });
}

function resizableObjectKind(compiledNode: Record<string, unknown>): 'node' | 'region' | 'shape' | 'callout' | 'text' | undefined {
  const data = (compiledNode.data || {}) as Record<string, unknown>;
  const objectKind = String(data.objectKind || '');
  if (objectKind === 'shape' || objectKind === 'callout' || objectKind === 'text') return objectKind;
  if (String(compiledNode.type || '') === 'region') return 'region';
  return String(compiledNode.type || '') === 'network' ? 'node' : undefined;
}

export function withRuntimeResizeHandlers(
  nodes: CompiledGraph['nodes'],
  nodesResizable: boolean | undefined,
  onNodeResizeChange: TopoViewerProps['onNodeResizeChange']
): CompiledGraph['nodes'] {
  if (!nodesResizable || !onNodeResizeChange) return nodes;
  return nodes.map((node) => {
    const runtimeNode = node as unknown as Record<string, unknown>;
    const data = (runtimeNode.data || {}) as Record<string, unknown>;
    if (runtimeNode.selected !== true || !resizableObjectKind(runtimeNode)) {
      if (!('__topoviewerResizable' in data) && !('__topoviewerOnResizeEnd' in data)) return node;
      const {
        __topoviewerOnResizeEnd: _onResizeEnd,
        __topoviewerResizable: _resizable,
        ...remainingData
      } = data;
      return { ...node, data: remainingData as unknown as CompiledNodeData } as typeof node;
    }
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

export function withRuntimeRegionAggregateHandlers(
  nodes: CompiledGraph['nodes'],
  onRegionAggregateToggle: TopoViewerProps['onRegionAggregateToggle']
): CompiledGraph['nodes'] {
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

export function withRuntimeLinkAggregateHandlers(
  edges: CompiledGraph['edges'],
  onLinkAggregateToggle: TopoViewerProps['onLinkAggregateToggle']
): CompiledGraph['edges'] {
  if (!onLinkAggregateToggle) return edges;
  return edges.map((edge) => {
    const runtimeEdge = edge as unknown as Record<string, unknown>;
    const data = (runtimeEdge.data || {}) as Record<string, unknown>;
    const aggregateGroupId = String(data.aggregateId || '');
    const aggregateMemberIds = Array.isArray(data.members) ? data.members.map(String) : [];
    if ((data.isLinkAggregate === true || data.isLinkAggregate === 'true') && aggregateGroupId) {
      return {
        ...edge,
        data: {
          ...data,
          __topoviewerLinkGroupExpandable: true,
          __topoviewerOnLinkGroupExpand: () => onLinkAggregateToggle({
            data,
            expanded: true,
            groupId: aggregateGroupId,
            memberIds: aggregateMemberIds
          })
        } as unknown as CompiledEdgeData
      } as typeof edge;
    }
    const groupId = String(data.linkAggregateGroupId || '');
    const memberIds = Array.isArray(data.linkAggregateMemberIds)
      ? data.linkAggregateMemberIds.map(String)
      : [];
    if (!groupId || data.linkAggregateCollapseControl !== true) return edge;
    return {
      ...edge,
      data: {
        ...data,
        __topoviewerLinkGroupCollapsible: true,
        __topoviewerOnLinkGroupCollapse: () => onLinkAggregateToggle({
          data,
          expanded: false,
          groupId,
          memberIds
        })
      } as unknown as CompiledEdgeData
    } as typeof edge;
  });
}

export function resolveAttentionPresentation(
  document: TopoDocument,
  attention: TopoViewerProps['attention']
): AttentionPresentationResult | undefined {
  return resolveAttentionPresentationCached(document, attention || document.attention);
}
