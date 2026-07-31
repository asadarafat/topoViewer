import { resolveTopoStatus } from './status';

function compiledDisplayName(data: Record<string, unknown>, fallback: unknown): string {
  const labels = data.labels && typeof data.labels === 'object' && !Array.isArray(data.labels)
    ? data.labels as Record<string, unknown>
    : undefined;
  const value = [data.title, data.text, labels?.name, data.id, fallback]
    .find((candidate) => candidate !== undefined && candidate !== null && String(candidate).trim() !== '');
  return String(value ?? 'unnamed');
}

function accessibleIdentity(data: Record<string, unknown>, fallback: unknown): string {
  const id = String(data.id || fallback || 'unnamed');
  const name = compiledDisplayName(data, id);
  return name === id ? id : `${name} (${id})`;
}

function withStatus(label: string, data: Record<string, unknown>): string {
  const status = resolveTopoStatus(data);
  return status ? `${label}, status ${status}` : label;
}

export function withCompiledNodeAccessibility(nodes: Array<Record<string, unknown>>) {
  return nodes.map((node) => {
    const data = (node.data || {}) as Record<string, unknown>;
    if (node.selectable === false) return { ...node, focusable: false };
    const runtimeType = String(node.type || 'object');
    const kind = String(data.objectKind || (runtimeType === 'network' ? 'node' : runtimeType));
    const ariaLabel = withStatus(`${kind} ${accessibleIdentity(data, node.id)}`, data);
    return { ...node, ariaLabel, data: { ...data, accessibleLabel: ariaLabel } };
  });
}

export function withCompiledEdgeAccessibility(
  edges: Array<Record<string, unknown>>,
  nodes: Array<Record<string, unknown>> = []
) {
  const nodeDataById = new Map(nodes.map((node) => [String(node.id), (node.data || {}) as Record<string, unknown>]));
  return edges.map((edge) => {
    const data = (edge.data || {}) as Record<string, unknown>;
    if (data.interactive === false || edge.selectable === false) return { ...edge, focusable: false };
    const kind = String(data.objectKind || 'link');
    const source = String(edge.source || 'unknown');
    const target = String(edge.target || 'unknown');
    const sourceIdentity = accessibleIdentity(nodeDataById.get(source) || { id: source }, source);
    const targetIdentity = accessibleIdentity(nodeDataById.get(target) || { id: target }, target);
    const ariaLabel = withStatus(
      `${kind} ${accessibleIdentity(data, edge.id)}, from ${sourceIdentity} to ${targetIdentity}`,
      data
    );
    return {
      ...edge,
      ariaLabel,
      data: { ...data, accessibleLabel: ariaLabel }
    };
  });
}
