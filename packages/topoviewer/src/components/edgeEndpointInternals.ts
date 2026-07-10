import { useEffect } from 'react';
import { useReactFlow, useUpdateNodeInternals } from '@xyflow/react';

type EdgeEndpoint = { source: string; target: string };
type EndpointNode = { handles?: unknown[]; internals?: { handleBounds?: unknown } } | undefined;

export function missingEdgeEndpointIds(
  edges: readonly EdgeEndpoint[],
  getNode: (id: string) => EndpointNode
): string[] {
  const missing = new Set<string>();
  edges.forEach((edge) => {
    [edge.source, edge.target].forEach((id) => {
      const node = getNode(id);
      if (!node?.internals?.handleBounds && !node?.handles?.length) missing.add(id);
    });
  });
  return [...missing];
}

export function useEdgeEndpointInternals(edges: readonly EdgeEndpoint[]) {
  const reactFlow = useReactFlow();
  const updateNodeInternals = useUpdateNodeInternals();

  useEffect(() => {
    const missing = missingEdgeEndpointIds(edges, reactFlow.getInternalNode);
    if (missing.length) updateNodeInternals(missing);
  }, [edges, reactFlow, updateNodeInternals]);
}
