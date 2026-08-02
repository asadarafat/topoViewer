import type { AttentionGraphIndex } from 'topoviewer';
import type { StudioSelection } from '../../contracts/project';

const focusableKinds = new Set<StudioSelection['kind']>([
  'node',
  'link',
  'linkDirection',
  'path',
  'region'
]);

export interface StudioAttentionAggregateCandidate {
  by: 'parent' | 'region';
  sourceId: string;
}

export interface StudioAttentionSelectionProjection {
  aggregateCandidate?: StudioAttentionAggregateCandidate;
  focusIds: string[];
  unsupportedCount: number;
}

export function projectStudioAttentionSelection(
  index: AttentionGraphIndex,
  selection: readonly StudioSelection[]
): StudioAttentionSelectionProjection {
  const focusIds: string[] = [];
  let unsupportedCount = 0;

  selection.forEach((item) => {
    if (!focusableKinds.has(item.kind) || !index.getObject(item.id)) {
      unsupportedCount += 1;
      return;
    }
    if (!focusIds.includes(item.id)) focusIds.push(item.id);
  });

  if (selection.length !== 1) return { focusIds, unsupportedCount };
  const [item] = selection;
  if (item.kind === 'region' && index.getRegion(item.id)) {
    return {
      aggregateCandidate: { by: 'region', sourceId: item.id },
      focusIds,
      unsupportedCount
    };
  }
  if (item.kind === 'node' && index.getChildren(item.id).length) {
    return {
      aggregateCandidate: { by: 'parent', sourceId: item.id },
      focusIds,
      unsupportedCount
    };
  }
  return { focusIds, unsupportedCount };
}
