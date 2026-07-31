import type { CompiledGraph, GraphEntity } from './types';

export type TopoStatusSeverity = 'normal' | 'info' | 'warning' | 'minor' | 'major' | 'critical' | 'unknown';

const aliases: Readonly<Record<string, TopoStatusSeverity>> = Object.freeze({
  connected: 'normal',
  critical: 'critical',
  degraded: 'warning',
  down: 'critical',
  error: 'critical',
  failed: 'critical',
  healthy: 'normal',
  info: 'info',
  informational: 'info',
  major: 'major',
  minor: 'minor',
  nominal: 'normal',
  normal: 'normal',
  ok: 'normal',
  ready: 'normal',
  success: 'normal',
  unknown: 'unknown',
  up: 'normal',
  warn: 'warning',
  warning: 'warning'
});

function record(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

export function normalizeTopoStatus(value: unknown): TopoStatusSeverity | undefined {
  if (value === undefined || value === null) return undefined;
  const key = String(value).trim().toLowerCase();
  return key ? aliases[key] || 'unknown' : undefined;
}

export function resolveTopoStatus(entity: GraphEntity | Record<string, unknown>): TopoStatusSeverity | undefined {
  const source = entity as Record<string, unknown>;
  const labels = record(source.labels);
  const nestedData = record(source.data);
  return normalizeTopoStatus(labels?.severity)
    || normalizeTopoStatus(labels?.status)
    || normalizeTopoStatus(labels?.health)
    || normalizeTopoStatus(source.severity)
    || normalizeTopoStatus(source.status)
    || normalizeTopoStatus(source.health)
    || normalizeTopoStatus(nestedData?.severity)
    || normalizeTopoStatus(nestedData?.status)
    || normalizeTopoStatus(nestedData?.health);
}

const severityOrder: readonly TopoStatusSeverity[] = Object.freeze([
  'critical', 'major', 'minor', 'warning', 'info', 'normal', 'unknown'
]);

export function topoStatusRank(value: unknown): number {
  const severity = normalizeTopoStatus(value) || 'unknown';
  return severityOrder.length - severityOrder.indexOf(severity);
}

export function worstSeverityColor(value: unknown): string | undefined {
  const severity = normalizeTopoStatus(value);
  if (severity === 'critical') return 'var(--topoviewer-danger)';
  if (severity === 'major') return 'color-mix(in srgb, var(--topoviewer-danger) 55%, var(--topoviewer-warning))';
  if (severity === 'minor' || severity === 'warning') return 'var(--topoviewer-warning)';
  if (severity === 'info') return 'var(--topoviewer-info)';
  if (severity === 'normal') return 'var(--topoviewer-success)';
  if (severity === 'unknown') return 'var(--topoviewer-fg-muted)';
  return undefined;
}

export interface TopoStatusLegendEntry {
  severity: TopoStatusSeverity;
  label: string;
  cue: string;
  count: number;
}

const legendPresentation: Readonly<Record<TopoStatusSeverity, Pick<TopoStatusLegendEntry, 'label' | 'cue'>>> = Object.freeze({
  critical: { label: 'Critical', cue: '!' },
  major: { label: 'Major', cue: 'M' },
  minor: { label: 'Minor', cue: 'm' },
  warning: { label: 'Warning', cue: 'W' },
  info: { label: 'Information', cue: 'i' },
  normal: { label: 'Normal', cue: 'OK' },
  unknown: { label: 'Unknown', cue: '?' }
});

export function buildTopoStatusLegend(graph: CompiledGraph): TopoStatusLegendEntry[] {
  const counts = new Map<TopoStatusSeverity, number>();
  [...graph.nodes, ...graph.edges].forEach((object) => {
    const severity = resolveTopoStatus((object.data || {}) as Record<string, unknown>);
    if (severity) counts.set(severity, (counts.get(severity) || 0) + 1);
  });
  return severityOrder.flatMap((severity) => {
    const count = counts.get(severity);
    return count ? [{ severity, ...legendPresentation[severity], count }] : [];
  });
}
