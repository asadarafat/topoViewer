import type {
  AttentionGraphIndex,
  AttentionIndexedObject,
  AttentionLabelPriority,
  AttentionPresentation,
  AttentionPresentationResult,
  AttentionPresentationState,
  AttentionScore,
  AttentionScoreResult,
  AttentionScoringOptions,
  FocusResult
} from './types';

const DEFAULT_SEVERITY_WEIGHTS: Record<string, number> = {
  critical: 70,
  down: 65,
  major: 50,
  degraded: 45,
  warning: 30,
  minor: 25,
  maintenance: 15,
  changed: 20,
  normal: 0,
  up: 0,
  ok: 0
};

const SEVERITY_FIELDS = [
  'severity',
  'status',
  'health',
  'alarmSeverity',
  'operState',
  'adminState'
];

function dataValue(object: AttentionIndexedObject, path: string): unknown {
  return path.split('.').reduce<unknown>((value, key) => {
    if (value && typeof value === 'object') return (value as Record<string, unknown>)[key];
    return undefined;
  }, object.entity.data || {});
}

function addScore(reasons: string[], amount: number, reason: string): number {
  if (amount === 0) return 0;
  reasons.push(`${reason}:+${amount}`);
  return amount;
}

function severityScore(object: AttentionIndexedObject, options: AttentionScoringOptions, reasons: string[]): number {
  const weights = { ...DEFAULT_SEVERITY_WEIGHTS, ...(options.severityWeights || {}) };
  let score = 0;
  SEVERITY_FIELDS.forEach((field) => {
    const raw = dataValue(object, field);
    if (raw === undefined) return;
    const key = String(raw).toLowerCase();
    score += addScore(reasons, weights[key] || 0, `severity:${field}=${key}`);
  });
  return score;
}

function recentChangeScore(object: AttentionIndexedObject, reasons: string[]): number {
  const data = object.entity.data || {};
  if (data.changed === true || data.changedAt || data.revision) {
    return addScore(reasons, 20, 'recent-change');
  }
  return 0;
}

function pathMembershipScore(index: AttentionGraphIndex, id: string, reasons: string[]): number {
  const paths = index.getPathsByMember(id);
  if (!paths.length) return 0;
  return addScore(reasons, Math.min(30, paths.length * 15), `path-membership:${paths.join(',')}`);
}

function fanoutScore(index: AttentionGraphIndex, id: string, reasons: string[]): number {
  const fanout = index.getIncoming(id).length + index.getOutgoing(id).length;
  if (!fanout) return 0;
  return addScore(reasons, Math.min(30, fanout * 6), `dependency-fanout:${fanout}`);
}

function contextProximityScore(index: AttentionGraphIndex, focus: FocusResult, id: string, reasons: string[]): number {
  if (!focus.contextIds.has(id)) return 0;
  const nearFocused = index.getAdjacent(id).some((neighborId) => focus.focusedIds.has(neighborId));
  return nearFocused ? addScore(reasons, 12, 'context-proximity:focused-neighbor') : 0;
}

function scoreObject(index: AttentionGraphIndex, focus: FocusResult, id: string, options: AttentionScoringOptions): AttentionScore {
  const object = index.getObject(id);
  const reasons: string[] = [];
  let score = 0;

  if (focus.focusedIds.has(id)) score += addScore(reasons, 100, 'focus-match');
  if (focus.relatedIds.has(id)) score += addScore(reasons, 60, 'related-match');
  if (focus.contextIds.has(id)) score += addScore(reasons, 5, 'context');
  if (!object) return Object.freeze({ id, score, reasons: Object.freeze(reasons) });

  score += pathMembershipScore(index, id, reasons);
  score += severityScore(object, options, reasons);
  score += fanoutScore(index, id, reasons);
  score += recentChangeScore(object, reasons);
  score += contextProximityScore(index, focus, id, reasons);

  return Object.freeze({
    id,
    score,
    reasons: Object.freeze(reasons)
  });
}

function presentationState(index: AttentionGraphIndex, focus: FocusResult, score: AttentionScore, options: AttentionScoringOptions): AttentionPresentationState {
  const object = index.getObject(score.id);
  if (focus.hiddenIds.has(score.id)) return 'hidden';
  if (options.suppressBelowScore !== undefined && score.score < options.suppressBelowScore) return 'suppressed';
  if (focus.focusedIds.has(score.id)) return 'focused';
  if (focus.relatedIds.has(score.id)) return 'related';
  if (object?.entity.data?.isAggregate === true) return 'aggregate';
  if (focus.mode === 'dim-context' && focus.contextIds.has(score.id)) return 'dimmed';
  return 'context';
}

function labelPriority(state: AttentionPresentationState, score: number): AttentionLabelPriority {
  if (state === 'focused') return 'focused';
  if (state === 'aggregate') return 'aggregate';
  if (state === 'hidden' || state === 'suppressed') return 'hidden';
  if (score >= 80) return 'high';
  if (state === 'related' || score >= 45) return 'medium';
  return 'low';
}

export function scoreAttention(index: AttentionGraphIndex, focus: FocusResult, options: AttentionScoringOptions = {}): AttentionScoreResult {
  const scores = new Map<string, AttentionScore>();
  index.objectIds.forEach((id) => {
    scores.set(id, scoreObject(index, focus, id, options));
  });

  return Object.freeze({
    scores,
    ordered: Object.freeze(index.objectIds.map((id) => scores.get(id)!))
  });
}

export function deriveAttentionPresentation(
  index: AttentionGraphIndex,
  focus: FocusResult,
  scoreResult: AttentionScoreResult = scoreAttention(index, focus),
  options: AttentionScoringOptions = {}
): AttentionPresentationResult {
  const items = new Map<string, AttentionPresentation>();
  index.objectIds.forEach((id) => {
    const score = scoreResult.scores.get(id) || { id, score: 0, reasons: [] };
    const state = presentationState(index, focus, score, options);
    items.set(id, Object.freeze({
      id,
      state,
      score: score.score,
      labelPriority: labelPriority(state, score.score),
      reasons: score.reasons
    }));
  });

  return Object.freeze({
    items,
    ordered: Object.freeze(index.objectIds.map((id) => items.get(id)!))
  });
}

export function explainAttentionScore(scoreResult: AttentionScoreResult, id: string): readonly string[] {
  return scoreResult.scores.get(id)?.reasons || [];
}
