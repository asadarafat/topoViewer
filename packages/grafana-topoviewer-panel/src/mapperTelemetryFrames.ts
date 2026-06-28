import type { DataFrame, Field } from '@grafana/data';
import type { GrafanaPanelDiagnostic } from './types';
import type { MapperTelemetrySample, TopoViewerMapper } from './mapperTypes';

export interface MapperTelemetryParseResult {
  samples: MapperTelemetrySample[];
  diagnostics: GrafanaPanelDiagnostic[];
}

function diagnostic(severity: GrafanaPanelDiagnostic['severity'], code: string, message: string): GrafanaPanelDiagnostic {
  return { severity, code, message };
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

function scalarString(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim()) return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return undefined;
}

function labelsFromField(field: Field): Record<string, string> {
  const labels = field.labels as Record<string, unknown> | undefined;
  if (!labels) return {};
  return Object.fromEntries(
    Object.entries(labels)
      .map(([key, value]) => [key, scalarString(value)])
      .filter((entry): entry is [string, string] => Boolean(entry[1]))
  );
}

function metricNameForField(
  field: Field,
  frame: DataFrame,
  metricNames: Set<string>,
  options: { includeFieldName?: boolean; includeFrameName?: boolean } = {}
): string | undefined {
  const labels = labelsFromField(field);
  const labelMetric = labels.__name__;
  if (labelMetric && metricNames.has(labelMetric)) return labelMetric;
  const candidates = [
    ...(options.includeFieldName === false ? [] : [field.name]),
    field.config?.displayName,
    field.config?.displayNameFromDS,
    ...(options.includeFrameName === false || field.name.toLowerCase() === 'time' ? [] : [frame.name])
  ].filter(Boolean) as string[];
  for (const candidate of candidates) {
    if (metricNames.has(candidate)) return candidate;
    const embedded = candidate.match(/topoviewer_[a-z0-9_]+/i)?.[0];
    if (embedded && metricNames.has(embedded)) return embedded;
  }
  return undefined;
}

function rowCount(frame: DataFrame): number {
  return Math.max(...frame.fields.map((field) => Number((field.values as { length?: number }).length || 0)), 0);
}

function parseTimeSeriesFrame(frame: DataFrame, metricNames: Set<string>): MapperTelemetrySample[] {
  const samples: MapperTelemetrySample[] = [];
  for (const field of frame.fields) {
    const metric = metricNameForField(field, frame, metricNames, {
      includeFieldName: false,
      includeFrameName: true
    });
    if (!metric) continue;
    const labels = labelsFromField(field);
    samples.push({
      metric,
      value: latestValue(field.values),
      labels,
      fields: {
        value: latestValue(field.values),
        field: field.name,
        frame: frame.name
      }
    });
  }
  return samples;
}

function parseTableFrame(frame: DataFrame, metricNames: Set<string>): MapperTelemetrySample[] {
  const samples: MapperTelemetrySample[] = [];
  const rows = rowCount(frame);
  if (!rows) return samples;
  for (let rowIndex = 0; rowIndex < rows; rowIndex += 1) {
    const labels: Record<string, string> = {};
    const fields: Record<string, unknown> = {};
    const metricFields: Array<{ metric: string; field: Field; value: unknown }> = [];
    for (const field of frame.fields) {
      const value = valueAt(field, rowIndex);
      fields[field.name] = value;
      const metric = metricNameForField(field, frame, metricNames, {
        includeFieldName: true,
        includeFrameName: false
      });
      if (metric) {
        metricFields.push({ metric, field, value });
        continue;
      }
      const stringValue = scalarString(value);
      if (stringValue !== undefined) labels[field.name] = stringValue;
    }
    for (const metricField of metricFields) {
      samples.push({
        metric: metricField.metric,
        value: metricField.value,
        labels: {
          ...labels,
          ...labelsFromField(metricField.field)
        },
        fields
      });
    }
  }
  return samples;
}

export function parseMapperTelemetryDataFrames(
  frames: DataFrame[] | undefined,
  mapper: TopoViewerMapper | undefined
): MapperTelemetryParseResult {
  const metricNames = new Set(mapper?.mappings.map((rule) => rule.metric) || []);
  if (!metricNames.size) return { samples: [], diagnostics: [] };
  if (!frames?.length) {
    return {
      samples: [],
      diagnostics: [diagnostic('info', 'mapper-telemetry-empty', 'No Grafana data frames were received; rendering the base topology.')]
    };
  }
  const samples = frames.flatMap((frame) => {
    const timeSeriesSamples = parseTimeSeriesFrame(frame, metricNames);
    return timeSeriesSamples.length ? timeSeriesSamples : parseTableFrame(frame, metricNames);
  });
  return {
    samples,
    diagnostics: samples.length
      ? []
      : [diagnostic('warning', 'mapper-telemetry-unmatched-frame', 'Grafana data frames did not include metrics referenced by the selected TopoViewer mapper.')]
  };
}
