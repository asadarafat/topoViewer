export interface MapperAuthoringSample {
  fields: Record<string, unknown>;
  labels: Record<string, string>;
  metric: string;
  value: unknown;
}

export interface MapperSampleDiagnostic {
  code: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface MapperSampleIngestionOptions {
  maximumBytes?: number;
  maximumFields?: number;
  maximumLabels?: number;
  maximumSamples?: number;
}

export interface MapperSampleIngestionResult {
  diagnostics: MapperSampleDiagnostic[];
  format: 'generic-records' | 'grafana-data-frames' | 'prometheus' | 'unknown';
  samples: MapperAuthoringSample[];
  truncated: boolean;
}

const defaults = {
  maximumBytes: 2 * 1024 * 1024,
  maximumFields: 64,
  maximumLabels: 64,
  maximumSamples: 5_000
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function scalarString(value: unknown): string | undefined {
  if (typeof value === 'string') return value.slice(0, 1_024);
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return undefined;
}

function boundedRecord(
  value: unknown,
  maximum: number,
  convert: (item: unknown) => unknown
): Record<string, unknown> {
  if (!isRecord(value)) return {};
  return Object.fromEntries(Object.entries(value).slice(0, maximum).flatMap(([key, item]) => {
    const converted = convert(item);
    return converted === undefined ? [] : [[key.slice(0, 256), converted]];
  }));
}

function sample(
  input: unknown,
  maximumLabels: number,
  maximumFields: number
): MapperAuthoringSample | undefined {
  if (!isRecord(input) || typeof input.metric !== 'string' || !input.metric.trim()) return undefined;
  return {
    fields: boundedRecord(input.fields, maximumFields, (value) => value),
    labels: boundedRecord(input.labels, maximumLabels, scalarString) as Record<string, string>,
    metric: input.metric.trim().slice(0, 512),
    value: input.value
  };
}

function numericString(value: unknown): unknown {
  if (typeof value !== 'string' || !value.trim()) return value;
  const number = Number(value);
  return Number.isFinite(number) ? number : value;
}

function latest(values: unknown): unknown {
  if (!Array.isArray(values)) return undefined;
  for (let index = values.length - 1; index >= 0; index -= 1) {
    if (values[index] !== null && values[index] !== undefined) return values[index];
  }
  return undefined;
}

function prometheusSamples(root: Record<string, unknown>): MapperAuthoringSample[] | undefined {
  const data = isRecord(root.data) ? root.data : root;
  if (!Array.isArray(data.result)) return undefined;
  return data.result.flatMap((entry) => {
    if (!isRecord(entry) || !isRecord(entry.metric)) return [];
    const labels = Object.fromEntries(Object.entries(entry.metric).flatMap(([key, value]) => {
      const converted = scalarString(value);
      return converted === undefined ? [] : [[key, converted]];
    }));
    const metric = labels.__name__ || (typeof entry.name === 'string' ? entry.name : undefined);
    if (!metric) return [];
    const tuple = Array.isArray(entry.value) ? entry.value : undefined;
    const tuples = Array.isArray(entry.values) ? entry.values : undefined;
    const selected = tuple || (tuples?.length ? tuples[tuples.length - 1] : undefined);
    const value = Array.isArray(selected) ? numericString(selected[1]) : numericString(selected);
    return [{
      fields: { timestamp: Array.isArray(selected) ? selected[0] : undefined, value },
      labels,
      metric,
      value
    }];
  });
}

interface JsonFrameField {
  labels?: Record<string, unknown>;
  name: string;
  values: unknown[];
}

function frameFields(frame: Record<string, unknown>): JsonFrameField[] {
  if (!Array.isArray(frame.fields)) return [];
  return frame.fields.flatMap((field) => {
    if (!isRecord(field) || typeof field.name !== 'string' || !Array.isArray(field.values)) return [];
    return [{ labels: isRecord(field.labels) ? field.labels : undefined, name: field.name, values: field.values }];
  });
}

function labelsForFrameField(field: JsonFrameField): Record<string, string> {
  return boundedRecord(field.labels, defaults.maximumLabels, scalarString) as Record<string, string>;
}

function grafanaSamples(root: Record<string, unknown>): MapperAuthoringSample[] | undefined {
  const frames = Array.isArray(root.frames)
    ? root.frames
    : isRecord(root.data) && Array.isArray(root.data.frames)
      ? root.data.frames
      : Array.isArray(root.fields)
        ? [root]
        : undefined;
  if (!frames) return undefined;
  return frames.flatMap((rawFrame) => {
    if (!isRecord(rawFrame)) return [];
    const fields = frameFields(rawFrame);
    const frameName = typeof rawFrame.name === 'string' ? rawFrame.name : '';
    const timeSeries = fields.flatMap((field) => {
      const labels = labelsForFrameField(field);
      const metric = labels.__name__ || (field.name.toLowerCase() === 'value' ? frameName : '');
      if (!metric || field.name.toLowerCase() === 'time') return [];
      const value = latest(field.values);
      return [{ fields: { field: field.name, frame: frameName, value }, labels, metric, value }];
    });
    if (timeSeries.length) return timeSeries;

    const rows = Math.max(0, ...fields.map((field) => field.values.length));
    const metricFields = fields.filter((field) => (
      field.name.toLowerCase() !== 'time'
      && field.values.some((value) => typeof value === 'number')
    ));
    return Array.from({ length: rows }, (_, rowIndex) => {
      const rowFields = Object.fromEntries(fields.map((field) => [field.name, field.values[rowIndex]]));
      const rowLabels = Object.fromEntries(fields.flatMap((field) => {
        if (metricFields.includes(field)) return [];
        const value = scalarString(field.values[rowIndex]);
        return value === undefined ? [] : [[field.name, value]];
      }));
      return metricFields.map((field) => ({
        fields: rowFields,
        labels: { ...rowLabels, ...labelsForFrameField(field) },
        metric: labelsForFrameField(field).__name__ || field.name,
        value: field.values[rowIndex]
      }));
    }).flat();
  });
}

export function ingestMapperSamples(
  input: string | unknown,
  options: MapperSampleIngestionOptions = {}
): MapperSampleIngestionResult {
  const limits = { ...defaults, ...options };
  const diagnostics: MapperSampleDiagnostic[] = [];
  let value: unknown = input;
  if (typeof input === 'string') {
    if (new TextEncoder().encode(input).byteLength > limits.maximumBytes) {
      return {
        diagnostics: [{
          code: 'sample-input-too-large',
          message: `Sample JSON exceeds the ${limits.maximumBytes} byte limit.`,
          severity: 'error'
        }],
        format: 'unknown', samples: [], truncated: false
      };
    }
    try {
      value = JSON.parse(input);
    } catch (error) {
      return {
        diagnostics: [{
          code: 'sample-json-invalid',
          message: error instanceof Error ? error.message : String(error),
          severity: 'error'
        }],
        format: 'unknown', samples: [], truncated: false
      };
    }
  }
  const root = isRecord(value) ? value : undefined;
  let format: MapperSampleIngestionResult['format'] = 'unknown';
  let candidates: unknown[] = [];
  const prometheus = root ? prometheusSamples(root) : undefined;
  const grafana = root && !prometheus ? grafanaSamples(root) : undefined;
  if (prometheus) {
    format = 'prometheus';
    candidates = prometheus;
  } else if (grafana) {
    format = 'grafana-data-frames';
    candidates = grafana;
  } else {
    const generic = Array.isArray(value)
      ? value
      : root && (Array.isArray(root.samples) || Array.isArray(root.records))
        ? (Array.isArray(root.samples) ? root.samples : root.records) as unknown[]
        : undefined;
    if (generic) {
      format = 'generic-records';
      candidates = generic;
    }
  }
  if (format === 'unknown') {
    diagnostics.push({
      code: 'sample-format-unsupported',
      message: 'Expected Grafana data-frame JSON, a Prometheus API result, or generic records with metric, value, labels, and fields.',
      severity: 'error'
    });
    return { diagnostics, format, samples: [], truncated: false };
  }
  const samples = candidates.slice(0, limits.maximumSamples).flatMap((candidate) => {
    const parsed = sample(candidate, limits.maximumLabels, limits.maximumFields);
    if (!parsed && diagnostics.filter((item) => item.code === 'sample-record-invalid').length < 20) {
      diagnostics.push({
        code: 'sample-record-invalid',
        message: 'Ignored a sample without a non-empty metric name.',
        severity: 'warning'
      });
    }
    return parsed ? [parsed] : [];
  });
  const truncated = candidates.length > limits.maximumSamples;
  if (truncated) diagnostics.push({
    code: 'sample-limit-reached',
    message: `Loaded the first ${limits.maximumSamples} of ${candidates.length} samples.`,
    severity: 'warning'
  });
  return { diagnostics, format, samples, truncated };
}
