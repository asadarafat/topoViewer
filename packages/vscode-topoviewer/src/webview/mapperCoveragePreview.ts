import yaml from 'js-yaml';
import type { TopoDocument } from 'topoviewer';

type MapperTargetKind = 'node' | 'link' | 'linkDirection' | 'path' | 'region' | 'layer' | 'graph';
type MapperResolverMode = 'id' | 'label' | 'data' | 'endpoint' | 'selector' | 'aggregate' | 'staticObjectIds';
type RuleStatus = 'matched' | 'unmatched' | 'ambiguous' | 'stale';

export interface MapperCoveragePreviewRow {
  id: string;
  target: MapperTargetKind | 'unknown';
  resolver: string;
  status: RuleStatus;
  detail: string;
}

export interface MapperCoveragePreview {
  severity: 'info' | 'success' | 'warning';
  summary: string;
  counts: {
    ambiguousRules: number;
    duplicateTargets: number;
    matchedObjects: number;
    matchedRules: number;
    staleReferences: number;
    totalRules: number;
    unmatchedRules: number;
  };
  rows: MapperCoveragePreviewRow[];
}

interface InventoryEntity {
  id: string;
  labels?: Record<string, unknown>;
  data?: Record<string, unknown>;
  source?: string;
  target?: string;
}

interface NormalizedRule {
  id: string;
  metric?: string;
  target: MapperTargetKind | 'unknown';
  resolver: {
    by: MapperResolverMode | 'unknown';
    directionMetricLabel?: string;
    key?: string;
    linkMetricLabel?: string;
    metricLabel?: string;
    objectIds?: string[];
    selector?: string;
    sourceLabel?: string;
    targetLabel?: string;
  };
}

const targetKinds = new Set<MapperTargetKind>(['node', 'link', 'linkDirection', 'path', 'region', 'layer', 'graph']);
const resolverModes = new Set<MapperResolverMode>(['id', 'label', 'data', 'endpoint', 'selector', 'aggregate', 'staticObjectIds']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function stringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const values = value.map((item) => stringValue(item)).filter((item): item is string => Boolean(item));
  return values.length ? values : undefined;
}

function asTargetKind(value: unknown): MapperTargetKind | 'unknown' {
  const candidate = stringValue(value);
  return candidate && targetKinds.has(candidate as MapperTargetKind) ? candidate as MapperTargetKind : 'unknown';
}

function asResolverMode(value: unknown): MapperResolverMode | 'unknown' {
  const candidate = stringValue(value);
  return candidate && resolverModes.has(candidate as MapperResolverMode) ? candidate as MapperResolverMode : 'unknown';
}

function inventoryFor(document: TopoDocument | undefined): Record<MapperTargetKind, InventoryEntity[]> {
  const graph = document?.graph;
  const links = graph?.links || [];
  return {
    node: graph?.nodes || [],
    link: links,
    linkDirection: links.flatMap((link) => Object.entries(link.directions || {}).flatMap(([direction, value]) => (
      value && typeof value === 'object' && !Array.isArray(value)
        ? [{
          id: String((value as { id?: string }).id || `${link.id}:${direction}`),
          labels: { ...(link.labels || {}), ...((value as { labels?: Record<string, unknown> }).labels || {}), direction },
          data: { ...(link.data || {}), ...((value as { data?: Record<string, unknown> }).data || {}) },
          source: link.source,
          target: link.target
        }]
        : []
    ))),
    path: graph?.paths || [],
    region: graph?.regions || [],
    layer: graph?.layers || [],
    graph: graph?.id ? [{ id: graph.id }] : []
  };
}

function parseSelectKind(select: unknown): { kind: MapperTargetKind | 'unknown'; selector?: string } {
  const value = stringValue(select);
  if (!value) return { kind: 'unknown' };
  const match = value.match(/^(node|linkDirection|link|path|region|layer|graph)(?:\s*\[|$)/);
  return {
    kind: match ? match[1] as MapperTargetKind : 'unknown',
    selector: value
  };
}

function parseAuthoringRule(input: unknown, index: number): NormalizedRule | undefined {
  if (!isRecord(input)) return undefined;
  const selected = parseSelectKind(input.select);
  const join = input.join;
  const id = stringValue(input.id) || `rule-${index + 1}`;
  const metric = stringValue(input.metric);

  if (join === undefined) {
    return {
      id,
      metric,
      target: selected.kind,
      resolver: { by: 'selector', selector: selected.selector }
    };
  }

  const metricLabel = stringValue(join);
  if (metricLabel) {
    return {
      id,
      metric,
      target: selected.kind,
      resolver: { by: 'id', metricLabel }
    };
  }

  if (isRecord(join)) {
    return {
      id,
      metric,
      target: selected.kind,
      resolver: {
        by: 'id',
        directionMetricLabel: stringValue(join.direction),
        linkMetricLabel: stringValue(join.link)
      }
    };
  }

  return {
    id,
    metric,
    target: selected.kind,
    resolver: { by: 'unknown' }
  };
}

function parseCanonicalRule(input: unknown, index: number): NormalizedRule | undefined {
  if (!isRecord(input)) return undefined;
  const target = isRecord(input.target) ? input.target : {};
  const resolve = isRecord(target.resolve) ? target.resolve : {};
  return {
    id: stringValue(input.id) || `mapping-${index + 1}`,
    metric: stringValue(input.metric),
    target: asTargetKind(target.kind),
    resolver: {
      by: asResolverMode(resolve.by),
      directionMetricLabel: stringValue(resolve.directionMetricLabel),
      key: stringValue(resolve.key),
      linkMetricLabel: stringValue(resolve.linkMetricLabel),
      metricLabel: stringValue(resolve.metricLabel),
      objectIds: stringArray(resolve.objectIds),
      selector: stringValue(resolve.selector),
      sourceLabel: stringValue(resolve.sourceLabel),
      targetLabel: stringValue(resolve.targetLabel)
    }
  };
}

function mapperRules(source: string): NormalizedRule[] | undefined {
  const parsed = yaml.load(source);
  if (!isRecord(parsed)) return [];
  const rules = Array.isArray(parsed.rules)
    ? parsed.rules.map(parseAuthoringRule).filter((rule): rule is NormalizedRule => Boolean(rule))
    : [];
  const mappings = Array.isArray(parsed.mappings)
    ? parsed.mappings.map(parseCanonicalRule).filter((rule): rule is NormalizedRule => Boolean(rule))
    : [];
  return [...rules, ...mappings];
}

function parseSelector(selector: string | undefined, fallbackKind: MapperTargetKind | 'unknown') {
  if (!selector) return { kind: fallbackKind };
  const match = selector.match(/^(node|linkDirection|link|path|region|layer|graph)(?:\s*\[\s*(labels|data)\.([A-Za-z0-9_.-]+)\s*=\s*["']?([^"'\]]+)["']?\s*\])?$/);
  if (!match) return { kind: fallbackKind, invalid: true };
  return {
    field: match[2] as 'labels' | 'data' | undefined,
    kind: match[1] as MapperTargetKind,
    key: match[3],
    value: match[4]
  };
}

function selectorMatches(entity: InventoryEntity, field: 'labels' | 'data' | undefined, key: string | undefined, value: string | undefined) {
  if (!field || !key) return true;
  return String(entity[field]?.[key]) === value;
}

function resolveRule(rule: NormalizedRule, inventory: Record<MapperTargetKind, InventoryEntity[]>) {
  if (rule.target === 'unknown') {
    return { matched: [] as InventoryEntity[], ambiguous: 0, stale: 0, detail: 'Target kind is missing or unsupported.' };
  }

  const candidates = inventory[rule.target];
  const resolver = rule.resolver;

  if (resolver.by === 'staticObjectIds') {
    const requested = resolver.objectIds || [];
    const matched = candidates.filter((entity) => requested.includes(entity.id));
    return {
      matched,
      ambiguous: 0,
      stale: requested.filter((id) => !matched.some((entity) => entity.id === id)).length,
      detail: requested.length ? `Checks ${requested.length} explicit object ID(s).` : 'No explicit object IDs are defined.'
    };
  }

  if (resolver.by === 'selector') {
    const parsed = parseSelector(resolver.selector, rule.target);
    if (parsed.invalid || parsed.kind === 'unknown' || parsed.kind !== rule.target) {
      return { matched: [] as InventoryEntity[], ambiguous: 0, stale: 0, detail: `Selector "${resolver.selector || '<missing>'}" cannot be resolved statically.` };
    }
    const matched = inventory[parsed.kind].filter((entity) => selectorMatches(entity, parsed.field, parsed.key, parsed.value));
    return {
      matched,
      ambiguous: 0,
      stale: 0,
      detail: parsed.field ? `Selector matches ${parsed.field}.${parsed.key} = ${parsed.value}.` : 'Selector targets every object of this kind.'
    };
  }

  if (resolver.by === 'endpoint' && rule.target === 'link') {
    const pairs = new Map<string, number>();
    for (const link of candidates) {
      const key = `${link.source || ''}->${link.target || ''}`;
      pairs.set(key, (pairs.get(key) || 0) + 1);
    }
    const ambiguous = Array.from(pairs.values()).filter((count) => count > 1).length;
    return {
      matched: candidates,
      ambiguous,
      stale: 0,
      detail: ambiguous ? 'Parallel links share endpoints; use a stable link_id label.' : 'Endpoint labels can resolve current links without parallel ambiguity.'
    };
  }

  if ((resolver.by === 'label' || resolver.by === 'data') && resolver.key) {
    const field = resolver.by === 'label' ? 'labels' : 'data';
    const matched = candidates.filter((entity) => entity[field]?.[resolver.key || ''] !== undefined);
    return {
      matched,
      ambiguous: 0,
      stale: 0,
      detail: `Synthetic samples use ${field}.${resolver.key}.`
    };
  }

  if (resolver.by === 'aggregate') {
    return {
      matched: candidates.length ? candidates : inventory[rule.target],
      ambiguous: 0,
      stale: 0,
      detail: 'Aggregate rule can summarize all objects of this kind.'
    };
  }

  if (resolver.by === 'id') {
    return {
      matched: candidates,
      ambiguous: 0,
      stale: 0,
      detail: rule.target === 'linkDirection'
        ? 'Synthetic samples use link and direction labels from declared link directions.'
        : `Synthetic samples use ${resolver.metricLabel || 'object ID'} labels.`
    };
  }

  return {
    matched: [] as InventoryEntity[],
    ambiguous: 0,
    stale: 0,
    detail: `Resolver mode "${resolver.by}" is missing or unsupported.`
  };
}

function resolverLabel(rule: NormalizedRule) {
  const by = rule.resolver.by;
  if (by === 'id') {
    return rule.resolver.linkMetricLabel && rule.resolver.directionMetricLabel
      ? `id via ${rule.resolver.linkMetricLabel} + ${rule.resolver.directionMetricLabel}`
      : `id via ${rule.resolver.metricLabel || '<metric label>'}`;
  }
  if (by === 'selector') return `selector ${rule.resolver.selector || '<missing>'}`;
  if (by === 'staticObjectIds') return 'static object IDs';
  if ((by === 'label' || by === 'data') && rule.resolver.key) return `${by} key ${rule.resolver.key}`;
  return by;
}

export function createMapperCoveragePreview(document: TopoDocument | undefined, mapperText: string): MapperCoveragePreview {
  let rules: NormalizedRule[] | undefined;
  try {
    rules = mapperRules(mapperText);
  } catch (error) {
    return {
      severity: 'warning',
      summary: `Mapper coverage unavailable: ${error instanceof Error ? error.message : String(error)}`,
      counts: { ambiguousRules: 0, duplicateTargets: 0, matchedObjects: 0, matchedRules: 0, staleReferences: 0, totalRules: 0, unmatchedRules: 0 },
      rows: []
    };
  }

  if (!rules?.length) {
    return {
      severity: 'info',
      summary: 'Mapper has no rules yet. Add a rule to preview how telemetry labels will bind to topology objects.',
      counts: { ambiguousRules: 0, duplicateTargets: 0, matchedObjects: 0, matchedRules: 0, staleReferences: 0, totalRules: 0, unmatchedRules: 0 },
      rows: []
    };
  }

  const inventory = inventoryFor(document);
  const targetHits = new Map<string, number>();
  const rows = rules.map((rule): MapperCoveragePreviewRow & { matchedIds: string[]; stale: number } => {
    const result = resolveRule(rule, inventory);
    const matchedIds = result.matched.map((entity) => `${rule.target}:${entity.id}`);
    for (const id of matchedIds) targetHits.set(id, (targetHits.get(id) || 0) + 1);
    const status: RuleStatus = result.stale > 0
      ? 'stale'
      : result.ambiguous > 0
        ? 'ambiguous'
        : result.matched.length > 0
          ? 'matched'
          : 'unmatched';
    return {
      id: rule.id,
      target: rule.target,
      resolver: resolverLabel(rule),
      status,
      detail: `${result.detail} ${result.matched.length} object(s) matched.`,
      matchedIds,
      stale: result.stale
    };
  });

  const duplicateTargets = Array.from(targetHits.values()).filter((count) => count > 1).length;
  const matchedRules = rows.filter((row) => row.matchedIds.length > 0).length;
  const unmatchedRules = rows.filter((row) => row.matchedIds.length === 0 && row.stale === 0).length;
  const ambiguousRules = rows.filter((row) => row.status === 'ambiguous').length;
  const staleReferences = rows.reduce((total, row) => total + row.stale, 0);
  const matchedObjects = new Set(rows.flatMap((row) => row.matchedIds)).size;
  const severity = staleReferences || unmatchedRules || ambiguousRules ? 'warning' : 'success';

  return {
    severity,
    summary: `${matchedRules}/${rules.length} rules resolve against the current topology; ${matchedObjects} synthetic object(s) matched; ${unmatchedRules} unmatched; ${ambiguousRules} ambiguous; ${staleReferences} stale.`,
    counts: {
      ambiguousRules,
      duplicateTargets,
      matchedObjects,
      matchedRules,
      staleReferences,
      totalRules: rules.length,
      unmatchedRules
    },
    rows: rows.map(({ matchedIds: _matchedIds, stale: _stale, ...row }) => row)
  };
}
