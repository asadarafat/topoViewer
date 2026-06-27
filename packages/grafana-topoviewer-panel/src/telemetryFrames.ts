import type { DataFrame, Field } from '@grafana/data';
import type { GrafanaPanelDiagnostic } from './types';

export interface GrafanaTelemetryLinkState {
  fixtureId?: string;
  linkId?: string;
  source?: string;
  target?: string;
  site?: string;
  pod?: string;
  up?: boolean;
  utilizationPercent?: number;
  rxBps?: number;
  txBps?: number;
  errorsTotal?: number;
  timestampSeconds?: number;
}

export interface GrafanaTelemetryParseResult {
  states: GrafanaTelemetryLinkState[];
  diagnostics: GrafanaPanelDiagnostic[];
}

type TelemetryMetricProperty =
  | 'up'
  | 'utilizationPercent'
  | 'rxBps'
  | 'txBps'
  | 'errorsTotal'
  | 'timestampSeconds';

const metricPropertyByName: Record<string, TelemetryMetricProperty> = {
  topoviewer_link_up: 'up',
  topoviewer_link_utilization_percent: 'utilizationPercent',
  topoviewer_link_rx_bps: 'rxBps',
  topoviewer_link_tx_bps: 'txBps',
  topoviewer_link_errors_total: 'errorsTotal',
  topoviewer_metric_timestamp_seconds: 'timestampSeconds'
};

const labelKeys = new Set(['fixture_id', 'link_id', 'source', 'target', 'site', 'pod']);

function diagnostic(code: string, message: string): GrafanaPanelDiagnostic {
  return { severity: 'warning', code, message };
}

function latestValue(values: unknown): unknown {
  if (!values) return undefined;
  const vector = values as { length?: number; get?: (index: number) => unknown };
  const length = typeof vector.length === 'number' ? vector.length : 0;
  for (let index = length - 1; index >= 0; index -= 1) {
    const value = typeof vector.get === 'function'
      ? vector.get(index)
      : Array.isArray(values)
        ? values[index]
        : undefined;
    if (value !== null && value !== undefined) return value;
  }
  return undefined;
}

function valueAt(field: Field, index: number): unknown {
  const values = field.values as unknown;
  if (Array.isArray(values)) return values[index];
  const vector = values as { get?: (nextIndex: number) => unknown };
  return typeof vector.get === 'function' ? vector.get(index) : undefined;
}

function numericValue(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const next = Number(value);
    return Number.isFinite(next) ? next : undefined;
  }
  return undefined;
}

function stringValue(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim()) return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return undefined;
}

function normalizeMetricName(field: Field, frame: DataFrame): string | undefined {
  const labels = field.labels as Record<string, string> | undefined;
  const fromLabel = labels?.__name__;
  if (fromLabel && metricPropertyByName[fromLabel]) return fromLabel;
  const candidates = [
    field.name,
    field.config?.displayName,
    field.config?.displayNameFromDS,
    frame.name
  ].filter(Boolean) as string[];
  return candidates
    .map((candidate) => candidate.match(/topoviewer_[a-z_]+/)?.[0] || candidate)
    .find((candidate) => Boolean(metricPropertyByName[candidate]));
}

function stateKey(input: Partial<GrafanaTelemetryLinkState>): string | undefined {
  if (input.fixtureId && input.linkId) return `${input.fixtureId}:${input.linkId}`;
  if (input.linkId) return input.linkId;
  if (input.fixtureId && input.source && input.target) return `${input.fixtureId}:${input.source}->${input.target}`;
  if (input.source && input.target) return `${input.source}->${input.target}`;
  return undefined;
}

function applyLabels(target: GrafanaTelemetryLinkState, labels: Record<string, unknown> | undefined) {
  if (!labels) return;
  target.fixtureId ||= stringValue(labels.fixture_id);
  target.linkId ||= stringValue(labels.link_id);
  target.source ||= stringValue(labels.source);
  target.target ||= stringValue(labels.target);
  target.site ||= stringValue(labels.site);
  target.pod ||= stringValue(labels.pod);
}

function applyMetricValue(target: GrafanaTelemetryLinkState, property: TelemetryMetricProperty, rawValue: unknown) {
  const value = numericValue(rawValue);
  if (value === undefined) return;
  if (property === 'up') {
    target.up = value > 0;
    return;
  }
  target[property] = value;
}

function parseTimeSeriesFrame(frame: DataFrame, statesByKey: Map<string, GrafanaTelemetryLinkState>) {
  for (const field of frame.fields) {
    const metricName = normalizeMetricName(field, frame);
    if (!metricName) continue;
    const property = metricPropertyByName[metricName];
    const labels = field.labels as Record<string, unknown> | undefined;
    const nextState: GrafanaTelemetryLinkState = {};
    applyLabels(nextState, labels);
    const key = stateKey(nextState);
    if (!key) continue;
    const existing = statesByKey.get(key) || nextState;
    applyLabels(existing, labels);
    applyMetricValue(existing, property, latestValue(field.values));
    statesByKey.set(key, existing);
  }
}

function parseTableFrame(frame: DataFrame, statesByKey: Map<string, GrafanaTelemetryLinkState>) {
  const rowCount = Math.max(...frame.fields.map((field) => Number((field.values as { length?: number }).length || 0)), 0);
  if (!rowCount) return;
  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    const labels: Record<string, unknown> = {};
    const metricValues: Array<{ property: TelemetryMetricProperty; value: unknown }> = [];
    for (const field of frame.fields) {
      const fieldName = field.name;
      const value = valueAt(field, rowIndex);
      if (labelKeys.has(fieldName)) {
        labels[fieldName] = value;
        continue;
      }
      const property = metricPropertyByName[fieldName];
      if (property) metricValues.push({ property, value });
    }
    if (!metricValues.length) continue;
    const nextState: GrafanaTelemetryLinkState = {};
    applyLabels(nextState, labels);
    const key = stateKey(nextState);
    if (!key) continue;
    const existing = statesByKey.get(key) || nextState;
    applyLabels(existing, labels);
    for (const metricValue of metricValues) {
      applyMetricValue(existing, metricValue.property, metricValue.value);
    }
    statesByKey.set(key, existing);
  }
}

export function parseTelemetryDataFrames(frames: DataFrame[] | undefined): GrafanaTelemetryParseResult {
  if (!frames?.length) {
    return {
      states: [],
      diagnostics: [
        {
          severity: 'info',
          code: 'telemetry-empty',
          message: 'No Grafana data frames were received; rendering the base topology.'
        }
      ]
    };
  }
  const statesByKey = new Map<string, GrafanaTelemetryLinkState>();
  for (const frame of frames) {
    parseTimeSeriesFrame(frame, statesByKey);
    parseTableFrame(frame, statesByKey);
  }
  const states = Array.from(statesByKey.values()).sort((left, right) => {
    const leftKey = stateKey(left) || '';
    const rightKey = stateKey(right) || '';
    return leftKey.localeCompare(rightKey);
  });
  const diagnostics = states.length
    ? []
    : [diagnostic('telemetry-unmapped-frame', 'Grafana data frames did not include recognized TopoViewer telemetry labels.')];
  return { states, diagnostics };
}
