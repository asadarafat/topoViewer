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

const maximumInputDepth = 32;

function boundedInput(value: unknown, maximumBytes: number): 'ok' | 'cyclic-or-deep' | 'too-large' {
  const stack: Array<{ depth: number; value: unknown }> = [{ depth: 0, value }];
  const seen = new Set<object>();
  let bytes = 0;
  while (stack.length) {
    const current = stack.pop()!;
    if (current.depth > maximumInputDepth) return 'cyclic-or-deep';
    const item = current.value;
    if (item === null || item === undefined || typeof item === 'boolean' || typeof item === 'number') {
      bytes += 8;
    } else if (typeof item === 'string') {
      bytes += item.length * 2;
    } else if (typeof item === 'object') {
      if (seen.has(item)) return 'cyclic-or-deep';
      seen.add(item);
      if (Array.isArray(item)) {
        bytes += item.length * 4;
        for (let index = item.length - 1; index >= 0; index -= 1) stack.push({ depth: current.depth + 1, value: item[index] });
      } else {
        const entries = Object.entries(item as Record<string, unknown>);
        bytes += entries.reduce((total, [key]) => total + key.length * 2, 0);
        for (let index = entries.length - 1; index >= 0; index -= 1) stack.push({ depth: current.depth + 1, value: entries[index][1] });
      }
    } else {
      return 'cyclic-or-deep';
    }
    if (bytes > maximumBytes) return 'too-large';
  }
  return 'ok';
}

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

interface CandidateSamples {
  samples: MapperAuthoringSample[];
  truncated: boolean;
}

function prometheusSamples(root: Record<string, unknown>, maximumSamples: number): CandidateSamples | undefined {
  const data = isRecord(root.data) ? root.data : root;
  if (!Array.isArray(data.result)) return undefined;
  return { samples: data.result.slice(0, maximumSamples).flatMap((entry) => {
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
  }), truncated: data.result.length > maximumSamples };
}

interface JsonFrameField {
  labels?: Record<string, unknown>;
  name: string;
  values: unknown[];
}

function frameFields(frame: Record<string, unknown>, maximumFields: number): JsonFrameField[] {
  if (!Array.isArray(frame.fields)) return [];
  return frame.fields.slice(0, maximumFields).flatMap((field) => {
    if (!isRecord(field) || typeof field.name !== 'string' || !Array.isArray(field.values)) return [];
    return [{ labels: isRecord(field.labels) ? field.labels : undefined, name: field.name, values: field.values }];
  });
}

function labelsForFrameField(field: JsonFrameField): Record<string, string> {
  return boundedRecord(field.labels, defaults.maximumLabels, scalarString) as Record<string, string>;
}

function grafanaSamples(root: Record<string, unknown>, maximumSamples: number, maximumFields: number): CandidateSamples | undefined {
  const frames = Array.isArray(root.frames)
    ? root.frames
    : isRecord(root.data) && Array.isArray(root.data.frames)
      ? root.data.frames
      : Array.isArray(root.fields)
        ? [root]
        : undefined;
  if (!frames) return undefined;
  const samples: MapperAuthoringSample[] = [];
  let truncated = false;
  for (let frameIndex = 0; frameIndex < frames.length; frameIndex += 1) {
    const rawFrame = frames[frameIndex];
    if (samples.length >= maximumSamples) {
      truncated = true;
      break;
    }
    if (!isRecord(rawFrame)) continue;
    const fields = frameFields(rawFrame, maximumFields);
    const frameName = typeof rawFrame.name === 'string' ? rawFrame.name : '';
    const timeSeries = fields.flatMap((field) => {
      const labels = labelsForFrameField(field);
      const metric = labels.__name__ || (field.name.toLowerCase() === 'value' ? frameName : '');
      if (!metric || field.name.toLowerCase() === 'time') return [];
      const value = latest(field.values);
      return [{ fields: { field: field.name, frame: frameName, value }, labels, metric, value }];
    });
    if (timeSeries.length) {
      if (timeSeries.length > maximumSamples - samples.length) truncated = true;
      samples.push(...timeSeries.slice(0, maximumSamples - samples.length));
      continue;
    }

    const availableRows = Math.max(0, ...fields.map((field) => field.values.length));
    const rows = Math.min(maximumSamples, availableRows);
    if (availableRows > rows) truncated = true;
    const metricFields = fields.filter((field) => (
      field.name.toLowerCase() !== 'time'
      && field.values.some((value) => typeof value === 'number')
    ));
    for (let rowIndex = 0; rowIndex < rows && samples.length < maximumSamples; rowIndex += 1) {
      const rowFields = Object.fromEntries(fields.map((field) => [field.name, field.values[rowIndex]]));
      const rowLabels = Object.fromEntries(fields.flatMap((field) => {
        if (metricFields.includes(field)) return [];
        const value = scalarString(field.values[rowIndex]);
        return value === undefined ? [] : [[field.name, value]];
      }));
      for (const field of metricFields) {
        if (samples.length >= maximumSamples) {
          truncated = true;
          break;
        }
        const labels = labelsForFrameField(field);
        samples.push({
          fields: rowFields,
          labels: { ...rowLabels, ...labels },
          metric: labels.__name__ || field.name,
          value: field.values[rowIndex]
        });
      }
    }
  }
  return { samples, truncated };
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
  const inputStatus = boundedInput(value, limits.maximumBytes);
  if (inputStatus !== 'ok') {
    return {
      diagnostics: [{
        code: inputStatus === 'too-large' ? 'sample-input-too-large' : 'sample-input-too-complex',
        message: inputStatus === 'too-large'
          ? `Sample data exceeds the ${limits.maximumBytes} byte limit.`
          : `Sample data is cyclic or exceeds the ${maximumInputDepth} level depth limit.`,
        severity: 'error'
      }],
      format: 'unknown', samples: [], truncated: false
    };
  }
  const root = isRecord(value) ? value : undefined;
  let format: MapperSampleIngestionResult['format'] = 'unknown';
  let candidates: unknown[] = [];
  let sourceTruncated = false;
  const prometheus = root ? prometheusSamples(root, limits.maximumSamples) : undefined;
  const grafana = root && !prometheus ? grafanaSamples(root, limits.maximumSamples, limits.maximumFields) : undefined;
  if (prometheus) {
    format = 'prometheus';
    candidates = prometheus.samples;
    sourceTruncated = prometheus.truncated;
  } else if (grafana) {
    format = 'grafana-data-frames';
    candidates = grafana.samples;
    sourceTruncated = grafana.truncated;
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
  const truncated = sourceTruncated || candidates.length > limits.maximumSamples;
  if (truncated) diagnostics.push({
    code: 'sample-limit-reached',
    message: `Loaded the first ${limits.maximumSamples} of ${candidates.length} samples.`,
    severity: 'warning'
  });
  return { diagnostics, format, samples, truncated };
}
