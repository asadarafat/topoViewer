export function withCompiledNodeAccessibility(nodes: Array<Record<string, unknown>>) {
  return nodes.map((node) => {
    const data = (node.data || {}) as Record<string, unknown>;
    if (node.selectable === false) return { ...node, focusable: false };
    const runtimeType = String(node.type || 'object');
    const kind = String(data.objectKind || (runtimeType === 'network' ? 'node' : runtimeType));
    const name = String(data.name || data.title || data.text || data.id || node.id || 'unnamed');
    return { ...node, ariaLabel: `${kind} ${name}` };
  });
}

export function withCompiledEdgeAccessibility(edges: Array<Record<string, unknown>>) {
  return edges.map((edge) => {
    const data = (edge.data || {}) as Record<string, unknown>;
    if (data.interactive === false || edge.selectable === false) return { ...edge, focusable: false };
    const kind = String(data.objectKind || 'link');
    const name = String(data.name || data.id || edge.id || 'unnamed');
    return {
      ...edge,
      ariaLabel: `${kind} ${name}, from ${String(edge.source || 'unknown')} to ${String(edge.target || 'unknown')}`
    };
  });
}
