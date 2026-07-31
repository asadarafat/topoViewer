import type { StudioSelection } from '../../contracts/project';

const semanticClickSelectionKinds = new Set<StudioSelection['kind']>([
  'callout',
  'linkDirection',
  'region',
  'shape'
]);

export function requiresSemanticClickSelection(kind: StudioSelection['kind']) {
  return semanticClickSelectionKinds.has(kind);
}

export function sameSelection(left: StudioSelection[], right: StudioSelection[]) {
  if (left.length !== right.length) return false;
  const leftKeys = new Set(left.map((selection) => `${selection.kind}:${selection.id}`));
  const rightKeys = new Set(right.map((selection) => `${selection.kind}:${selection.id}`));
  return leftKeys.size === rightKeys.size && [...leftKeys].every((key) => rightKeys.has(key));
}

export function uniqueSelection(selection: StudioSelection[]) {
  const unique = new Map<string, StudioSelection>();
  selection.forEach((item) => {
    const key = `${item.kind}:${item.id}`;
    if (!unique.has(key)) unique.set(key, item);
  });
  return [...unique.values()];
}

export function reconcileCanvasSelection(
  incoming: StudioSelection[],
  pendingSemanticSelection?: StudioSelection[]
): { accepted: boolean; pendingSemanticSelection?: StudioSelection[]; selection: StudioSelection[] } {
  if (!pendingSemanticSelection) return { accepted: true, selection: incoming };
  if (sameSelection(incoming, pendingSemanticSelection)) {
    return { accepted: true, selection: pendingSemanticSelection };
  }
  return {
    accepted: false,
    pendingSemanticSelection,
    selection: pendingSemanticSelection
  };
}
