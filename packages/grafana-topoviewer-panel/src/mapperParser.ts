import yaml from 'js-yaml';
import type { GrafanaPanelDiagnostic } from './types';
import type {
  MapperOverlayPolicy,
  MapperResolver,
  MapperResolverMode,
  MapperRule,
  MapperTargetKind,
  MapperThresholds,
  MapperValueSelector,
  TopoViewerMapper
} from './mapperTypes';

const targetKinds = new Set<MapperTargetKind>(['node', 'link', 'path', 'region', 'layer', 'graph']);
const resolverModes = new Set<MapperResolverMode>(['id', 'label', 'data', 'endpoint', 'selector', 'aggregate', 'staticObjectIds']);
const valueAsKinds = new Set(['up', 'utilizationPercent', 'errorsTotal', 'latencyMs', 'lossPercent', 'capacityPercent', 'health']);
const rootKeys = new Set(['$schema', 'version', 'identity', 'mappings']);
const identityKeys = new Set(['sourceId', 'sourceIdLabel']);
const mappingKeys = new Set(['id', 'metric', 'target', 'value', 'thresholds', 'overlay']);
const targetKeys = new Set(['kind', 'resolve']);
const resolverKeys = new Set(['by', 'metricLabel', 'key', 'sourceLabel', 'targetLabel', 'selector', 'objectIds']);
const valueKeys = new Set(['field', 'as']);
const thresholdKeys = new Set(['info', 'warning', 'error', 'direction']);
const overlayKeys = new Set([
  'lineColorBySeverity',
  'lineWidthBySeverity',
  'sourceArrowColorBySeverity',
  'targetArrowColorBySeverity',
  'outlineBySeverity',
  'statusMarker',
  'backgroundColorBySeverity',
  'borderColorBySeverity',
  'badgeLabel',
  'label',
  'propagateToLayerMembers',
  'style'
]);

export interface MapperParseResult {
  mapper?: TopoViewerMapper;
  diagnostics: GrafanaPanelDiagnostic[];
}

interface YamlExceptionWithMark {
  mark?: {
    line?: number;
    column?: number;
  };
}

function diagnostic(
  severity: GrafanaPanelDiagnostic['severity'],
  code: string,
  message: string,
  extra: Partial<GrafanaPanelDiagnostic> = {}
): GrafanaPanelDiagnostic {
  return { severity, code, message, ...extra };
}

function schemaDiagnostic(path: string, message: string): GrafanaPanelDiagnostic {
  return diagnostic('error', 'mapper-schema-invalid', `${path}: ${message}`, {
    document: 'mapper',
    path
  });
}

function yamlDiagnostic(label: string, error: unknown): GrafanaPanelDiagnostic {
  const mark = (error as YamlExceptionWithMark | undefined)?.mark;
  const line = typeof mark?.line === 'number' ? mark.line + 1 : undefined;
  const column = typeof mark?.column === 'number' ? mark.column + 1 : undefined;
  const location = line && column ? ` at mapper line ${line}, column ${column}` : '';
  return diagnostic(
    'error',
    'mapper-yaml-invalid',
    `Unable to parse ${label}${location}: ${error instanceof Error ? error.message : String(error)}.`,
    { document: 'mapper', line, column }
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function stringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value
    .map((item) => stringValue(item))
    .filter((item): item is string => Boolean(item));
}

function numberValue(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : undefined;
  }
  return undefined;
}

function unknownKeyDiagnostics(input: Record<string, unknown>, allowed: Set<string>, path: string): GrafanaPanelDiagnostic[] {
  return Object.keys(input)
    .filter((key) => !allowed.has(key))
    .sort()
    .map((key) => schemaDiagnostic(path ? `${path}.${key}` : key, 'unsupported key'));
}

function parseThresholds(input: unknown): MapperThresholds | undefined {
  if (!isRecord(input)) return undefined;
  const thresholds: MapperThresholds = {};
  const info = numberValue(input.info);
  const warning = numberValue(input.warning);
  const error = numberValue(input.error);
  if (info !== undefined) thresholds.info = info;
  if (warning !== undefined) thresholds.warning = warning;
  if (error !== undefined) thresholds.error = error;
  if (input.direction === 'below') thresholds.direction = 'below';
  if (input.direction === 'above') thresholds.direction = 'above';
  return Object.keys(thresholds).length ? thresholds : undefined;
}

function parseValue(input: unknown, diagnostics: GrafanaPanelDiagnostic[], path: string): MapperValueSelector | undefined {
  if (!isRecord(input)) return undefined;
  diagnostics.push(...unknownKeyDiagnostics(input, valueKeys, path));
  const value: MapperValueSelector = {};
  const field = stringValue(input.field);
  const as = stringValue(input.as);
  if (field) value.field = field;
  if (as) {
    if (!valueAsKinds.has(as)) {
      diagnostics.push(schemaDiagnostic(`${path}.as`, `must be one of ${Array.from(valueAsKinds).join(', ')}`));
    } else {
      value.as = as;
    }
  }
  return Object.keys(value).length ? value : undefined;
}

function parseOverlay(input: unknown, diagnostics: GrafanaPanelDiagnostic[], path: string): MapperOverlayPolicy | undefined {
  if (!isRecord(input)) return undefined;
  diagnostics.push(...unknownKeyDiagnostics(input, overlayKeys, path));
  const overlay: MapperOverlayPolicy = {};
  for (const key of [
    'lineColorBySeverity',
    'lineWidthBySeverity',
    'sourceArrowColorBySeverity',
    'targetArrowColorBySeverity',
    'outlineBySeverity',
    'statusMarker',
    'backgroundColorBySeverity',
    'borderColorBySeverity',
    'propagateToLayerMembers'
  ] as const) {
    if (typeof input[key] === 'boolean') overlay[key] = input[key];
  }
  const badgeLabel = stringValue(input.badgeLabel);
  const label = stringValue(input.label);
  if (badgeLabel) overlay.badgeLabel = badgeLabel;
  if (label) overlay.label = label;
  if (isRecord(input.style)) overlay.style = input.style;
  return Object.keys(overlay).length ? overlay : undefined;
}

function parseResolver(input: unknown, diagnostics: GrafanaPanelDiagnostic[], context: string, path: string): MapperResolver | undefined {
  if (!isRecord(input)) {
    diagnostics.push(diagnostic('error', 'mapper-resolver-missing', `${context} must define target.resolve as a mapping.`, {
      document: 'mapper',
      path
    }));
    return undefined;
  }
  diagnostics.push(...unknownKeyDiagnostics(input, resolverKeys, path));
  const by = stringValue(input.by);
  if (!by || !resolverModes.has(by as MapperResolverMode)) {
    diagnostics.push(diagnostic('error', 'mapper-resolver-invalid', `${context} target.resolve.by must be one of ${Array.from(resolverModes).join(', ')}.`, {
      document: 'mapper',
      path: `${path}.by`
    }));
    return undefined;
  }
  const resolver: MapperResolver = { by: by as MapperResolverMode };
  const metricLabel = stringValue(input.metricLabel);
  const key = stringValue(input.key);
  const sourceLabel = stringValue(input.sourceLabel);
  const targetLabel = stringValue(input.targetLabel);
  const selector = stringValue(input.selector);
  const objectIds = stringArray(input.objectIds);
  if (metricLabel) resolver.metricLabel = metricLabel;
  if (key) resolver.key = key;
  if (sourceLabel) resolver.sourceLabel = sourceLabel;
  if (targetLabel) resolver.targetLabel = targetLabel;
  if (selector) resolver.selector = selector;
  if (objectIds?.length) resolver.objectIds = objectIds;
  return resolver;
}

function parseRule(input: unknown, index: number, diagnostics: GrafanaPanelDiagnostic[]): MapperRule | undefined {
  const context = `mapping ${index + 1}`;
  const path = `mappings[${index}]`;
  if (!isRecord(input)) {
    diagnostics.push(diagnostic('error', 'mapper-rule-invalid', `${context} must be a YAML mapping.`, {
      document: 'mapper',
      path
    }));
    return undefined;
  }
  diagnostics.push(...unknownKeyDiagnostics(input, mappingKeys, path));
  const id = stringValue(input.id) || `mapping-${index + 1}`;
  const metric = stringValue(input.metric);
  if (!metric) {
    diagnostics.push(diagnostic('error', 'mapper-rule-metric-missing', `${context} must define metric.`, {
      document: 'mapper',
      path: `${path}.metric`
    }));
    return undefined;
  }
  if (!isRecord(input.target)) {
    diagnostics.push(diagnostic('error', 'mapper-target-missing', `${context} must define target.kind and target.resolve.`, {
      document: 'mapper',
      path: `${path}.target`
    }));
    return undefined;
  }
  diagnostics.push(...unknownKeyDiagnostics(input.target, targetKeys, `${path}.target`));
  const kind = stringValue(input.target.kind);
  if (!kind || !targetKinds.has(kind as MapperTargetKind)) {
    diagnostics.push(diagnostic('error', 'mapper-target-invalid', `${context} target.kind must be one of ${Array.from(targetKinds).join(', ')}.`, {
      document: 'mapper',
      path: `${path}.target.kind`
    }));
    return undefined;
  }
  const resolver = parseResolver(input.target.resolve, diagnostics, context, `${path}.target.resolve`);
  if (!resolver) return undefined;
  if (isRecord(input.thresholds)) {
    diagnostics.push(...unknownKeyDiagnostics(input.thresholds, thresholdKeys, `${path}.thresholds`));
    if (input.thresholds.direction !== undefined && input.thresholds.direction !== 'above' && input.thresholds.direction !== 'below') {
      diagnostics.push(schemaDiagnostic(`${path}.thresholds.direction`, 'must be one of above, below'));
    }
  }
  return {
    id,
    metric,
    target: {
      kind: kind as MapperTargetKind,
      resolve: resolver
    },
    value: parseValue(input.value, diagnostics, `${path}.value`),
    thresholds: parseThresholds(input.thresholds),
    overlay: parseOverlay(input.overlay, diagnostics, `${path}.overlay`)
  };
}

function legacyRules(input: Record<string, unknown>): MapperRule[] {
  const metrics = Array.isArray(input.metrics) ? input.metrics : [];
  const objects = isRecord(input.objects) ? input.objects : {};
  const links = isRecord(objects.links) ? objects.links : {};
  const linkIdLabel = stringValue(links.idLabel) || 'link_id';
  const sourceLabel = stringValue(links.sourceLabel) || 'source';
  const targetLabel = stringValue(links.targetLabel) || 'target';
  return metrics.flatMap((metric, index) => {
    if (!isRecord(metric)) return [];
    const name = stringValue(metric.name);
    const object = stringValue(metric.object);
    if (!name || object !== 'link') return [];
    const valueAs = stringValue(metric.value);
    return [{
      id: `legacy-${name}-${index + 1}`,
      metric: name,
      target: {
        kind: 'link',
        resolve: {
          by: 'id',
          metricLabel: linkIdLabel,
          sourceLabel,
          targetLabel
        }
      },
      value: valueAs ? { as: valueAs } : undefined,
      thresholds: name.includes('utilization') ? { info: 50, warning: 80, error: 90 } : undefined,
      overlay: {
        lineColorBySeverity: true,
        lineWidthBySeverity: true,
        sourceArrowColorBySeverity: true,
        targetArrowColorBySeverity: true,
        label: valueAs === 'up' ? '{{ severity }}' : '{{ value | round }}',
        statusMarker: true,
        outlineBySeverity: true
      }
    } satisfies MapperRule];
  }).map((rule) => ({
    ...rule,
    // aarafat-tag: legacy-source-id-migration
    target: rule.target,
    value: rule.value,
    thresholds: rule.thresholds,
    overlay: rule.overlay
  }));
}

export function parseTopoViewerMapperYaml(source: string, label = 'TopoViewer mapper'): MapperParseResult {
  const diagnostics: GrafanaPanelDiagnostic[] = [];
  try {
    const parsed = yaml.load(source);
    if (parsed === undefined || parsed === null) {
      return {
        mapper: { version: 1, mappings: [] },
        diagnostics: [diagnostic('warning', 'mapper-empty', `${label} is empty; telemetry overlays are disabled for this bundle.`)]
      };
    }
    if (!isRecord(parsed)) {
      return {
        diagnostics: [diagnostic('error', 'mapper-document-invalid', `${label} must be a YAML mapping.`, {
          document: 'mapper'
        })]
      };
    }
    diagnostics.push(...unknownKeyDiagnostics(parsed, rootKeys, ''));
    const version = numberValue(parsed.version);
    if (version !== 1) {
      diagnostics.push(diagnostic('error', 'mapper-version-invalid', `${label} must declare version: 1.`, {
        document: 'mapper',
        path: 'version'
      }));
      return { diagnostics };
    }
    const identitySource = isRecord(parsed.identity) ? parsed.identity : isRecord(parsed.source) ? parsed.source : {};
    if (isRecord(parsed.identity)) {
      diagnostics.push(...unknownKeyDiagnostics(parsed.identity, identityKeys, 'identity'));
    }
    const sourceId = stringValue(identitySource.sourceId);
    const sourceIdLabel = stringValue(identitySource.sourceIdLabel);
    const rawMappings = Array.isArray(parsed.mappings) ? parsed.mappings : undefined;
    if (!rawMappings && parsed.mappings !== undefined) {
      diagnostics.push(diagnostic('error', 'mapper-mappings-invalid', `${label} mappings must be a YAML sequence.`, {
        document: 'mapper',
        path: 'mappings'
      }));
      return { diagnostics };
    }
    const mappings = rawMappings
      ? rawMappings.map((item, index) => parseRule(item, index, diagnostics)).filter((rule): rule is MapperRule => Boolean(rule))
      : legacyRules(parsed);
    if (!rawMappings && mappings.length === 0) {
      diagnostics.push(diagnostic('error', 'mapper-mappings-missing', `${label} must define mappings.`, {
        document: 'mapper',
        path: 'mappings'
      }));
    }
    if (!rawMappings && mappings.length) {
      diagnostics.push(diagnostic('info', 'mapper-legacy-shape', `${label} uses the legacy metrics shape; prefer mappings for new bundles.`));
    }
    return {
      mapper: {
        version: 1,
        identity: sourceId || sourceIdLabel ? { sourceId, sourceIdLabel } : undefined,
        mappings
      },
      diagnostics
    };
  } catch (error) {
    return {
      diagnostics: [yamlDiagnostic(label, error)]
    };
  }
}
