function compiledDisplayName(data: Record<string, unknown>, fallback: unknown): string {
  const labels = data.labels && typeof data.labels === 'object' && !Array.isArray(data.labels)
    ? data.labels as Record<string, unknown>
    : undefined;
  return String(data.title ?? data.text ?? labels?.name ?? data.id ?? fallback ?? 'unnamed');
}

export function withCompiledNodeAccessibility(nodes: Array<Record<string, unknown>>) {
  return nodes.map((node) => {
    const data = (node.data || {}) as Record<string, unknown>;
    if (node.selectable === false) return { ...node, focusable: false };
    const runtimeType = String(node.type || 'object');
    const kind = String(data.objectKind || (runtimeType === 'network' ? 'node' : runtimeType));
    const name = compiledDisplayName(data, node.id);
    return { ...node, ariaLabel: `${kind} ${name}` };
  });
}

export function withCompiledEdgeAccessibility(edges: Array<Record<string, unknown>>) {
  return edges.map((edge) => {
    const data = (edge.data || {}) as Record<string, unknown>;
    if (data.interactive === false || edge.selectable === false) return { ...edge, focusable: false };
    const kind = String(data.objectKind || 'link');
    const name = compiledDisplayName(data, edge.id);
    return {
      ...edge,
      ariaLabel: `${kind} ${name}, from ${String(edge.source || 'unknown')} to ${String(edge.target || 'unknown')}`
    };
  });
}
