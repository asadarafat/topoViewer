export interface ViewportThresholdPolicy {
  readonly collapseBelowZoom?: number;
  readonly expandAboveZoom?: number;
  readonly hysteresis?: number;
}

export interface NormalizedViewportThresholds {
  readonly lower?: number;
  readonly upper?: number;
}

export type ViewportThresholdTransition = 'lower' | 'hold' | 'upper' | 'invalid-zoom';
export type ViewportExpansionReason = 'expanded' | 'collapsed' | 'unchanged' | 'invalid-zoom';

export interface ViewportExpansionInput {
  readonly expandedGroupIds: readonly string[];
  readonly eligibleGroupIds: readonly string[];
  readonly zoom: number;
  readonly policy?: ViewportThresholdPolicy;
}

export interface ViewportExpansionResult {
  readonly changed: boolean;
  readonly expandedGroupIds: readonly string[];
  readonly reason: ViewportExpansionReason;
}

function finiteNumber(value: number | undefined): number | undefined {
  return Number.isFinite(value) ? Number(value) : undefined;
}

function stableNumber(value: number): number {
  return Number(value.toPrecision(12));
}

export function normalizeViewportThresholds(policy: ViewportThresholdPolicy | undefined): NormalizedViewportThresholds {
  const hysteresis = Math.max(0, finiteNumber(policy?.hysteresis) ?? 0);
  let lower = finiteNumber(policy?.collapseBelowZoom);
  let upper = finiteNumber(policy?.expandAboveZoom);

  if (lower === undefined && upper !== undefined) lower = stableNumber(upper - hysteresis);
  if (upper === undefined && lower !== undefined) upper = stableNumber(lower + hysteresis);
  if (lower !== undefined && upper !== undefined && lower > upper) [lower, upper] = [upper, lower];

  return {
    ...(lower === undefined ? {} : { lower }),
    ...(upper === undefined ? {} : { upper })
  };
}

export function resolveViewportThresholdTransition(
  zoom: number,
  policy: ViewportThresholdPolicy | undefined
): ViewportThresholdTransition {
  if (!Number.isFinite(zoom)) return 'invalid-zoom';
  const { lower, upper } = normalizeViewportThresholds(policy);
  if (upper !== undefined && zoom >= upper) return 'upper';
  if (lower !== undefined && zoom <= lower) return 'lower';
  return 'hold';
}

function uniqueIds(ids: readonly string[]): string[] {
  return [...new Set(ids.filter((id) => id.length > 0))];
}

export function reduceViewportExpansion(input: ViewportExpansionInput): ViewportExpansionResult {
  const transition = resolveViewportThresholdTransition(input.zoom, input.policy);
  if (transition === 'invalid-zoom') {
    return { changed: false, expandedGroupIds: input.expandedGroupIds, reason: 'invalid-zoom' };
  }

  const eligible = uniqueIds(input.eligibleGroupIds);
  if (eligible.length === 0 || transition === 'hold') {
    return { changed: false, expandedGroupIds: input.expandedGroupIds, reason: 'unchanged' };
  }

  if (transition === 'upper') {
    const existing = new Set(input.expandedGroupIds);
    const additions = eligible.filter((id) => !existing.has(id));
    if (additions.length === 0) {
      return { changed: false, expandedGroupIds: input.expandedGroupIds, reason: 'unchanged' };
    }
    return {
      changed: true,
      expandedGroupIds: [...input.expandedGroupIds, ...additions],
      reason: 'expanded'
    };
  }

  const blocked = new Set(eligible);
  const collapsed = input.expandedGroupIds.filter((id) => !blocked.has(id));
  if (collapsed.length === input.expandedGroupIds.length) {
    return { changed: false, expandedGroupIds: input.expandedGroupIds, reason: 'unchanged' };
  }
  return { changed: true, expandedGroupIds: collapsed, reason: 'collapsed' };
}
