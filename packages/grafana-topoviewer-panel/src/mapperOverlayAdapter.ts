import type {
  GraphLink,
  GraphNode,
  GraphPath,
  GraphRegion,
  StyleDeclaration,
  TopoDocument,
  TopoViewerExtension
} from 'topoviewer';
import type { GrafanaPanelDiagnostic } from './types';
import type {
  MapperCondition,
  MapperKeyedCondition,
  MapperOverlayEntity,
  MapperOverlayPolicy,
  MapperResolver,
  MapperRule,
  MapperScalarCondition,
  MapperSeverityPalette,
  MapperTargetKind,
  MapperTelemetrySample,
  TopoViewerMapper
} from './mapperTypes';
import {
  accentColorForTelemetrySeverity,
  colorForTelemetrySeverity,
  compareTelemetrySeverity,
  defaultTelemetryThresholds,
  type TelemetrySeverity
} from './telemetryRules';

interface InventoryEntity {
  id: string;
  name?: string;
  label?: string;
  labels?: Record<string, string | number | boolean>;
  data?: Record<string, unknown>;
  layers?: string[];
  style?: StyleDeclaration;
  source?: string;
  target?: string;
}

interface Inventory {
  byKind: Record<MapperTargetKind, InventoryEntity[]>;
  linksById: Map<string, GraphLink>;
}

export interface MapperLinkOverlay {
  link: GraphLink;
  sample: MapperTelemetrySample;
  rule: MapperRule;
  severity: TelemetrySeverity;
  style: StyleDeclaration;
}

export interface MapperTelemetryOverlay {
  linksById: Record<string, MapperLinkOverlay>;
  nodeStylesById: Record<string, StyleDeclaration>;
  linkStylesById: Record<string, StyleDeclaration>;
  pathStylesById: Record<string, StyleDeclaration>;
  regionStylesById: Record<string, StyleDeclaration>;
  coverage: MapperMappingCoverage;
  diagnostics: GrafanaPanelDiagnostic[];
}

type StyleBucket = Record<string, StyleDeclaration>;

export interface MapperMappingCoverage {
  totalSamples: number;
  sourceMatchedSamples: number;
  metricMatchedSamples: number;
  resolvedSamples: number;
  unresolvedSamples: number;
  appliedObjects: number;
  ambiguousMatches: number;
  duplicateObjectMappings: number;
  unmatchedMetricSamples: number;
}

function diagnostic(code: string, message: string): GrafanaPanelDiagnostic {
  return { severity: 'warning', code, message };
}

function stringValue(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim()) return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return undefined;
}

function numericValue(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (typeof value === 'string' && value.trim()) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : undefined;
  }
  return undefined;
}

function nestedValue(input: unknown, path: string | undefined): unknown {
  if (!path || typeof input !== 'object' || input === null) return undefined;
  return path.split('.').reduce<unknown>((current, segment) => {
    if (typeof current !== 'object' || current === null) return undefined;
    return (current as Record<string, unknown>)[segment];
  }, input);
}

function mergeStyle(base: StyleDeclaration | undefined, overlay: StyleDeclaration | undefined): StyleDeclaration {
  return { ...(base || {}), ...overlay };
}

function createInventory(document: TopoDocument | undefined): Inventory {
  const graph = document?.graph;
  const nodes = graph?.nodes || [];
  const links = graph?.links || [];
  const paths = graph?.paths || [];
  const regions = graph?.regions || [];
  const layers = (graph?.layers || []).map((layer) => ({
    id: layer.id,
    name: layer.name
  }));
  const graphEntity = graph?.id ? [{ id: graph.id, name: graph.id }] : [];
  return {
    byKind: {
      node: nodes,
      link: links,
      path: paths,
      region: regions,
      layer: layers,
      graph: graphEntity
    },
    linksById: new Map(links.map((link) => [link.id, link]))
  };
}

function metricValue(sample: MapperTelemetrySample, rule: MapperRule): unknown {
  const field = rule.value?.field;
  if (!field || field === 'value') return sample.value;
  return sample.fields[field] ?? sample.labels[field];
}

function severityForSample(sample: MapperTelemetrySample, rule: MapperRule): TelemetrySeverity {
  const value = metricValue(sample, rule);
  if (rule.value?.as === 'up') {
    const up = numericValue(value);
    if (up === undefined) return 'none';
    return up > 0 ? 'success' : 'error';
  }
  const numeric = numericValue(value);
  if (numeric === undefined) return 'none';
  const thresholds = rule.thresholds || (
    rule.value?.as === 'utilizationPercent' ? {
      info: defaultTelemetryThresholds.infoPercent,
      warning: defaultTelemetryThresholds.warningPercent,
      error: defaultTelemetryThresholds.errorPercent
    } : undefined
  );
  if (!thresholds) return 'none';
  const direction = thresholds.direction || 'above';
  if (direction === 'below') {
    if (thresholds.error !== undefined && numeric <= thresholds.error) return 'error';
    if (thresholds.warning !== undefined && numeric <= thresholds.warning) return 'warning';
    if (thresholds.info !== undefined && numeric <= thresholds.info) return 'info';
    return 'success';
  }
  if (thresholds.error !== undefined && numeric >= thresholds.error) return 'error';
  if (thresholds.warning !== undefined && numeric >= thresholds.warning) return 'warning';
  if (thresholds.info !== undefined && numeric >= thresholds.info) return 'info';
  return 'success';
}

function paletteEntry(palette: MapperSeverityPalette | undefined, severity: TelemetrySeverity) {
  if (severity === 'none') return undefined;
  return palette?.[severity];
}

function severityColor(severity: TelemetrySeverity, palette?: MapperSeverityPalette): string | undefined {
  const entry = paletteEntry(palette, severity);
  if (typeof entry === 'string') return entry;
  return entry?.color || colorForTelemetrySeverity(severity);
}

function severityAccent(severity: TelemetrySeverity, palette?: MapperSeverityPalette): string | undefined {
  const entry = paletteEntry(palette, severity);
  if (typeof entry === 'string') return entry;
  return entry?.accent || entry?.color || accentColorForTelemetrySeverity(severity) || severityColor(severity, palette);
}

function renderTemplate(template: string | undefined, sample: MapperTelemetrySample, rule: MapperRule, entity: MapperOverlayEntity, severity: TelemetrySeverity): string | undefined {
  if (!template) return undefined;
  const value = metricValue(sample, rule);
  return template.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_match, token: string) => {
    const [rawPath, rawPipe] = token.split('|').map((part) => part.trim());
    let replacement: unknown;
    if (rawPath === 'value') replacement = value;
    else if (rawPath === 'severity') replacement = severity;
    else if (rawPath === 'metric') replacement = sample.metric;
    else if (rawPath === 'target.id') replacement = entity.id;
    else if (rawPath.startsWith('label.')) replacement = sample.labels[rawPath.slice('label.'.length)];
    else if (rawPath.startsWith('field.')) replacement = sample.fields[rawPath.slice('field.'.length)];
    if (rawPipe === 'round') {
      const numeric = numericValue(replacement);
      return numeric === undefined ? '' : String(Math.round(numeric));
    }
    return replacement === undefined || replacement === null ? '' : String(replacement);
  });
}

function renderStyleTemplates(
  style: StyleDeclaration | undefined,
  sample: MapperTelemetrySample,
  rule: MapperRule,
  entity: MapperOverlayEntity,
  severity: TelemetrySeverity
): StyleDeclaration {
  if (!style) return {};
  return Object.fromEntries(Object.entries(style).map(([key, value]) => [
    key,
    typeof value === 'string' ? renderTemplate(value, sample, rule, entity, severity) : value
  ])) as StyleDeclaration;
}

function scalarEquals(actual: unknown, expected: string | number | boolean): boolean {
  if (typeof expected === 'boolean') {
    if (typeof actual === 'boolean') return actual === expected;
    if (typeof actual === 'number') return (actual > 0) === expected;
    if (typeof actual === 'string') return ['true', '1', 'up', 'yes'].includes(actual.trim().toLowerCase()) === expected;
  }
  const actualNumeric = numericValue(actual);
  const expectedNumeric = numericValue(expected);
  if (actualNumeric !== undefined && expectedNumeric !== undefined) return actualNumeric === expectedNumeric;
  return stringValue(actual) === String(expected);
}

function scalarConditionMatches(value: unknown, condition: MapperScalarCondition): boolean {
  const exists = value !== undefined && value !== null && value !== '';
  if (condition.exists !== undefined && exists !== condition.exists) return false;
  if (condition.eq !== undefined && !scalarEquals(value, condition.eq)) return false;
  if (condition.ne !== undefined && scalarEquals(value, condition.ne)) return false;
  if (condition.contains !== undefined && !stringValue(value)?.includes(condition.contains)) return false;
  const numeric = numericValue(value);
  for (const [key, predicate] of [
    ['gt', (candidate: number, expected: number) => candidate > expected],
    ['gte', (candidate: number, expected: number) => candidate >= expected],
    ['lt', (candidate: number, expected: number) => candidate < expected],
    ['lte', (candidate: number, expected: number) => candidate <= expected]
  ] as const) {
    const expected = condition[key];
    if (expected !== undefined && (numeric === undefined || !predicate(numeric, expected))) return false;
  }
  return true;
}

function keyedConditionMatches(values: Record<string, unknown>, condition: MapperKeyedCondition): boolean {
  return scalarConditionMatches(values[condition.key], condition);
}

function conditionMatches(
  condition: MapperCondition | undefined,
  sample: MapperTelemetrySample,
  rule: MapperRule,
  severity: TelemetrySeverity
): boolean {
  if (!condition) return true;
  if (condition.severity !== undefined && condition.severity !== severity) return false;
  if (condition.value && !scalarConditionMatches(metricValue(sample, rule), condition.value)) return false;
  if (condition.label && !keyedConditionMatches(sample.labels, condition.label)) return false;
  if (condition.field && !keyedConditionMatches(sample.fields, condition.field)) return false;
  return true;
}

function conditionalStyleForRule(
  sample: MapperTelemetrySample,
  rule: MapperRule,
  entity: MapperOverlayEntity,
  severity: TelemetrySeverity
): StyleDeclaration {
  return (rule.conditions || []).reduce<StyleDeclaration>((style, condition) => {
    if (!conditionMatches(condition.when, sample, rule, severity)) return style;
    return mergeStyle(style, renderStyleTemplates(condition.style, sample, rule, entity, severity));
  }, {});
}

function styleForOverlay(
  kind: MapperTargetKind,
  policy: MapperOverlayPolicy | undefined,
  sample: MapperTelemetrySample,
  rule: MapperRule,
  entity: MapperOverlayEntity,
  severity: TelemetrySeverity,
  palette?: MapperSeverityPalette
): StyleDeclaration {
  const overlay = policy || {};
  const color = severityColor(severity, palette);
  const accent = severityAccent(severity, palette);
  let style: StyleDeclaration = renderStyleTemplates(overlay.style, sample, rule, entity, severity);
  const label = renderTemplate(overlay.label, sample, rule, entity, severity);
  const badgeLabel = renderTemplate(overlay.badgeLabel, sample, rule, entity, severity);
  if (kind === 'link' || kind === 'path') {
    if (overlay.lineColorBySeverity && color) style.lineColor = color;
    if (overlay.sourceArrowColorBySeverity && color) style.sourceArrowColor = color;
    if (overlay.targetArrowColorBySeverity && color) style.targetArrowColor = color;
    if (overlay.lineWidthBySeverity) {
      style.lineWidth = severity === 'error' ? 7 : severity === 'warning' ? 5 : severity === 'info' ? 4 : 3;
    }
    if (label !== undefined) {
      style.label = label;
      style.labelColor = accent;
      style.textBackgroundColor = 'var(--topoviewer-edge-label-bg)';
    }
  } else if (kind === 'node') {
    if (overlay.statusMarker && color) {
      style.statusColor = color;
      style.statusPlacement = 'topLeft';
    }
    if (overlay.outlineBySeverity && color) {
      style.outlineColor = color;
      style.outlineWidth = severity === 'error' ? 5 : severity === 'warning' ? 4 : 3;
      style.outlineOpacity = severity === 'success' ? 0.35 : 0.82;
    }
    if (overlay.backgroundColorBySeverity && color) style.backgroundColor = color;
    if (badgeLabel !== undefined) style.badgeLabel = badgeLabel;
    if (label !== undefined) style.label = label;
  } else if (kind === 'region') {
    if (overlay.borderColorBySeverity && color) style.borderColor = color;
    if (overlay.backgroundColorBySeverity && color) style.backgroundColor = color;
    if (label !== undefined) style.label = label;
  }
  style = mergeStyle(style, conditionalStyleForRule(sample, rule, entity, severity));
  return style;
}

function sampleSourceMatches(sample: MapperTelemetrySample, mapper: TopoViewerMapper): boolean {
  const sourceIdLabel = mapper.identity?.sourceIdLabel;
  const sourceId = mapper.identity?.sourceId;
  if (!sourceIdLabel || !sourceId) return true;
  return sample.labels[sourceIdLabel] === sourceId;
}

function entityValue(entity: InventoryEntity, resolver: MapperResolver): unknown {
  if (resolver.by === 'label') return resolver.key ? entity.labels?.[resolver.key] : undefined;
  if (resolver.by === 'data') return nestedValue(entity.data, resolver.key);
  return undefined;
}

function resolveById(kind: MapperTargetKind, resolver: MapperResolver, sample: MapperTelemetrySample, inventory: Inventory): InventoryEntity[] {
  const id = resolver.metricLabel ? sample.labels[resolver.metricLabel] : undefined;
  if (!id) return [];
  return inventory.byKind[kind].filter((entity) => entity.id === id);
}

function resolveByLabelOrData(kind: MapperTargetKind, resolver: MapperResolver, sample: MapperTelemetrySample, inventory: Inventory): InventoryEntity[] {
  const labelValue = resolver.metricLabel ? sample.labels[resolver.metricLabel] : undefined;
  if (!labelValue || !resolver.key) return [];
  return inventory.byKind[kind].filter((entity) => stringValue(entityValue(entity, resolver)) === labelValue);
}

function resolveByEndpoint(kind: MapperTargetKind, resolver: MapperResolver, sample: MapperTelemetrySample, inventory: Inventory): InventoryEntity[] {
  if (kind !== 'link') return [];
  const source = resolver.sourceLabel ? sample.labels[resolver.sourceLabel] : undefined;
  const target = resolver.targetLabel ? sample.labels[resolver.targetLabel] : undefined;
  if (!source || !target) return [];
  return inventory.byKind.link.filter((entity) => (
    (entity.source === source && entity.target === target) ||
    (entity.source === target && entity.target === source)
  ));
}

function parseSelector(selector: string): { kind: MapperTargetKind; path?: string; value?: string } | undefined {
  const match = selector.match(/^(node|link|path|region|layer|graph)(?:\[(id|labels\.[\w.-]+|data\.[\w.-]+)\s*=\s*["']?([^"'\]]+)["']?\])?$/);
  if (!match) return undefined;
  return {
    kind: match[1] as MapperTargetKind,
    path: match[2],
    value: match[3]
  };
}

function selectorMatches(entity: InventoryEntity, selectorPath: string | undefined, expectedValue: string | undefined): boolean {
  if (!selectorPath) return true;
  if (selectorPath === 'id') return entity.id === expectedValue;
  if (selectorPath.startsWith('labels.')) return stringValue(entity.labels?.[selectorPath.slice('labels.'.length)]) === expectedValue;
  if (selectorPath.startsWith('data.')) return stringValue(nestedValue(entity.data, selectorPath.slice('data.'.length))) === expectedValue;
  return false;
}

function resolveBySelector(kind: MapperTargetKind, resolver: MapperResolver, inventory: Inventory, diagnostics: GrafanaPanelDiagnostic[], rule: MapperRule): InventoryEntity[] {
  if (!resolver.selector) return [];
  const parsed = parseSelector(resolver.selector);
  if (!parsed) {
    diagnostics.push(diagnostic('mapper-selector-invalid', `Mapper rule "${rule.id}" uses unsupported selector "${resolver.selector}".`));
    return [];
  }
  if (parsed.kind !== kind) {
    diagnostics.push(diagnostic('mapper-selector-kind-mismatch', `Mapper rule "${rule.id}" target kind is ${kind}, but selector targets ${parsed.kind}.`));
    return [];
  }
  return inventory.byKind[kind].filter((entity) => selectorMatches(entity, parsed.path, parsed.value));
}

function resolveByAggregate(kind: MapperTargetKind, resolver: MapperResolver, sample: MapperTelemetrySample, inventory: Inventory): InventoryEntity[] {
  if (kind === 'graph') return inventory.byKind.graph;
  if (kind !== 'layer') return [];
  if (resolver.metricLabel) return resolveById(kind, resolver, sample, inventory);
  return inventory.byKind.layer;
}

function resolveEntities(rule: MapperRule, sample: MapperTelemetrySample, inventory: Inventory, diagnostics: GrafanaPanelDiagnostic[]): InventoryEntity[] {
  const { kind, resolve } = rule.target;
  if (resolve.by === 'id') return resolveById(kind, resolve, sample, inventory);
  if (resolve.by === 'label' || resolve.by === 'data') return resolveByLabelOrData(kind, resolve, sample, inventory);
  if (resolve.by === 'endpoint') return resolveByEndpoint(kind, resolve, sample, inventory);
  if (resolve.by === 'selector') return resolveBySelector(kind, resolve, inventory, diagnostics, rule);
  if (resolve.by === 'aggregate') return resolveByAggregate(kind, resolve, sample, inventory);
  if (resolve.by === 'staticObjectIds') {
    const ids = new Set(resolve.objectIds || []);
    const entities = inventory.byKind[kind].filter((entity) => ids.has(entity.id));
    for (const id of ids) {
      if (!entities.some((entity) => entity.id === id)) {
        diagnostics.push(diagnostic('mapper-static-object-stale', `Mapper rule "${rule.id}" references missing ${kind} object "${id}".`));
      }
    }
    return entities;
  }
  return [];
}

function layerMembers(layerId: string, inventory: Inventory): MapperOverlayEntity[] {
  return (['node', 'link', 'path', 'region'] as const).flatMap((kind) => (
    inventory.byKind[kind]
      .filter((entity) => entity.layers?.includes(layerId))
      .map((entity) => ({ kind, id: entity.id }))
  ));
}

function graphMembers(inventory: Inventory): MapperOverlayEntity[] {
  return (['node', 'link', 'path', 'region'] as const).flatMap((kind) => (
    inventory.byKind[kind].map((entity) => ({ kind, id: entity.id }))
  ));
}

function effectiveTargets(rule: MapperRule, entity: InventoryEntity, inventory: Inventory): MapperOverlayEntity[] {
  if (rule.target.kind === 'layer') {
    return rule.overlay?.propagateToLayerMembers === false
      ? [{ kind: 'layer', id: entity.id }]
      : layerMembers(entity.id, inventory);
  }
  if (rule.target.kind === 'graph') return graphMembers(inventory);
  return [{ kind: rule.target.kind, id: entity.id }];
}

function mergeOverlayStyle(
  styles: StyleBucket,
  severities: Record<string, TelemetrySeverity>,
  entity: MapperOverlayEntity,
  style: StyleDeclaration,
  severity: TelemetrySeverity
) {
  if (!Object.keys(style).length) return;
  const key = `${entity.kind}:${entity.id}`;
  const previous = severities[key] || 'none';
  if (compareTelemetrySeverity(severity, previous) < 0) return;
  severities[key] = severity;
  styles[entity.id] = mergeStyle(styles[entity.id], style);
}

function bucketForKind(overlay: MapperTelemetryOverlay, kind: MapperTargetKind): StyleBucket | undefined {
  if (kind === 'node') return overlay.nodeStylesById;
  if (kind === 'link') return overlay.linkStylesById;
  if (kind === 'path') return overlay.pathStylesById;
  if (kind === 'region') return overlay.regionStylesById;
  return undefined;
}

function endpointStyle(policy: MapperOverlayPolicy | undefined, severity: TelemetrySeverity, palette?: MapperSeverityPalette): StyleDeclaration {
  const style: StyleDeclaration = {};
  const color = severityColor(severity, palette);
  if (!color) return style;
  if (policy?.statusMarker) {
    style.statusColor = color;
    style.statusPlacement = 'topLeft';
  }
  if (policy?.outlineBySeverity) {
    style.outlineColor = color;
    style.outlineWidth = severity === 'error' ? 5 : severity === 'warning' ? 4 : 3;
    style.outlineOpacity = severity === 'success' ? 0.35 : 0.82;
  }
  return style;
}

function activeOverlayKeys(policy: MapperOverlayPolicy | undefined): string[] {
  if (!policy) return [];
  const keys: string[] = [];
  for (const [key, value] of Object.entries(policy)) {
    if (value === undefined || value === false) continue;
    keys.push(key);
  }
  return keys;
}

function unsupportedOverlayKeys(rule: MapperRule): string[] {
  const targetKind = rule.target.kind;
  if (targetKind === 'layer' || targetKind === 'graph') {
    return rule.overlay?.propagateToLayerMembers === false ? activeOverlayKeys(rule.overlay).filter((key) => key !== 'propagateToLayerMembers') : [];
  }
  const common = new Set(['label', 'style']);
  const link = new Set([...common, 'lineColorBySeverity', 'lineWidthBySeverity', 'sourceArrowColorBySeverity', 'targetArrowColorBySeverity', 'statusMarker', 'outlineBySeverity']);
  const path = new Set([...common, 'lineColorBySeverity', 'lineWidthBySeverity', 'sourceArrowColorBySeverity', 'targetArrowColorBySeverity']);
  const node = new Set([...common, 'statusMarker', 'outlineBySeverity', 'backgroundColorBySeverity', 'badgeLabel']);
  const region = new Set([...common, 'backgroundColorBySeverity', 'borderColorBySeverity']);
  const allowed = targetKind === 'link' ? link : targetKind === 'path' ? path : targetKind === 'node' ? node : targetKind === 'region' ? region : common;
  return activeOverlayKeys(rule.overlay).filter((key) => !allowed.has(key));
}

function emptyCoverage(totalSamples: number): MapperMappingCoverage {
  return {
    totalSamples,
    sourceMatchedSamples: 0,
    metricMatchedSamples: 0,
    resolvedSamples: 0,
    unresolvedSamples: 0,
    appliedObjects: 0,
    ambiguousMatches: 0,
    duplicateObjectMappings: 0,
    unmatchedMetricSamples: totalSamples
  };
}

export function createMapperTelemetryOverlay(
  document: TopoDocument | undefined,
  mapper: TopoViewerMapper | undefined,
  samples: MapperTelemetrySample[]
): MapperTelemetryOverlay {
  const overlay: MapperTelemetryOverlay = {
    linksById: {},
    nodeStylesById: {},
    linkStylesById: {},
    pathStylesById: {},
    regionStylesById: {},
    coverage: emptyCoverage(samples.length),
    diagnostics: []
  };
  if (!document?.graph || !mapper?.mappings.length || !samples.length) return overlay;

  const inventory = createInventory(document);
  const severities: Record<string, TelemetrySeverity> = {};
  const appliedObjectKeys = new Set<string>();
  const duplicateObjectKeys = new Set<string>();

  for (const rule of mapper.mappings) {
    const invalidKeys = unsupportedOverlayKeys(rule);
    if (invalidKeys.length) {
      overlay.diagnostics.push(diagnostic(
        'mapper-overlay-unsupported',
        `Mapper rule "${rule.id}" uses overlay control(s) not supported for ${rule.target.kind}: ${invalidKeys.join(', ')}.`
      ));
    }
  }

  for (const sample of samples) {
    if (!sampleSourceMatches(sample, mapper)) continue;
    overlay.coverage.sourceMatchedSamples += 1;
    const matchingRules = mapper.mappings.filter((rule) => rule.metric === sample.metric);
    if (!matchingRules.length) {
      overlay.coverage.unmatchedMetricSamples += 1;
      continue;
    }
    overlay.coverage.metricMatchedSamples += 1;
    for (const rule of matchingRules) {
      const entities = resolveEntities(rule, sample, inventory, overlay.diagnostics);
      if (!entities.length) {
        overlay.coverage.unresolvedSamples += 1;
        overlay.diagnostics.push(diagnostic('mapper-target-unmatched', `Metric "${sample.metric}" matched mapper rule "${rule.id}", but no ${rule.target.kind} object was resolved.`));
        continue;
      }
      overlay.coverage.resolvedSamples += 1;
      if (rule.target.resolve.by === 'endpoint' && entities.length > 1) {
        overlay.coverage.ambiguousMatches += 1;
        overlay.diagnostics.push(diagnostic(
          'mapper-endpoint-ambiguous',
          `Mapper rule "${rule.id}" endpoint resolver matched ${entities.length} links. Add a stable link_id metric label for parallel links.`
        ));
      }
      const severity = severityForSample(sample, rule);
      for (const sourceEntity of entities) {
        for (const target of effectiveTargets(rule, sourceEntity, inventory)) {
          const objectKey = `${target.kind}:${target.id}`;
          if (appliedObjectKeys.has(objectKey)) duplicateObjectKeys.add(objectKey);
          appliedObjectKeys.add(objectKey);
          const style = styleForOverlay(target.kind, rule.overlay, sample, rule, target, severity, mapper.palette);
          const bucket = bucketForKind(overlay, target.kind);
          if (bucket) mergeOverlayStyle(bucket, severities, target, style, severity);
          if (target.kind === 'link') {
            const link = inventory.linksById.get(target.id);
            if (link && Object.keys(style).length) {
              overlay.linksById[target.id] = { link, sample, rule, severity, style };
            }
            const endpoints = link ? [link.source, link.target] : [];
            const endpointOverlay = endpointStyle(rule.overlay, severity, mapper.palette);
            for (const endpointId of endpoints) {
              mergeOverlayStyle(overlay.nodeStylesById, severities, { kind: 'node', id: endpointId }, endpointOverlay, severity);
            }
          }
        }
      }
    }
  }

  overlay.coverage.appliedObjects = appliedObjectKeys.size;
  overlay.coverage.duplicateObjectMappings = duplicateObjectKeys.size;
  overlay.coverage.unmatchedMetricSamples = Math.max(0, overlay.coverage.totalSamples - overlay.coverage.metricMatchedSamples);
  if (duplicateObjectKeys.size) {
    overlay.diagnostics.push(diagnostic(
      'mapper-duplicate-object-mapping',
      `${duplicateObjectKeys.size} TopoViewer object(s) received multiple telemetry mappings; highest severity wins for overlapping style keys.`
    ));
  }

  if (!overlay.coverage.metricMatchedSamples) {
    overlay.diagnostics.push(diagnostic('mapper-no-metric-match', 'Telemetry samples were received, but none matched the selected TopoViewer mapper rules.'));
  }

  return overlay;
}

export function createMapperTelemetryOverlayExtension(overlay: MapperTelemetryOverlay): TopoViewerExtension | undefined {
  const hasOverlay = [
    overlay.nodeStylesById,
    overlay.linkStylesById,
    overlay.pathStylesById,
    overlay.regionStylesById
  ].some((bucket) => Object.keys(bucket).length);
  if (!hasOverlay) return undefined;
  return {
    name: 'grafana-mapper-telemetry-overlay',
    beforeCompile(document) {
      const graph = document.graph;
      if (!graph) return document;
      const nodes = graph.nodes?.map((node: GraphNode) => ({
        ...node,
        style: mergeStyle(node.style, overlay.nodeStylesById[node.id])
      }));
      const links = graph.links?.map((link: GraphLink) => ({
        ...link,
        style: mergeStyle(link.style, overlay.linkStylesById[link.id])
      }));
      const paths = graph.paths?.map((path: GraphPath) => ({
        ...path,
        style: mergeStyle(path.style, overlay.pathStylesById[path.id])
      }));
      const regions = graph.regions?.map((region: GraphRegion) => ({
        ...region,
        style: mergeStyle(region.style, overlay.regionStylesById[region.id])
      }));
      return {
        ...document,
        graph: {
          ...graph,
          nodes,
          links,
          paths,
          regions
        }
      };
    }
  };
}
