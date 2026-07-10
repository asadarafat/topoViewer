import {
  mapperAuthoringMetadata,
  type MapperAuthoringFieldMetadata
} from 'topoviewer/authoring';
import type { StyleTargetKind } from 'topoviewer';
import { mapperRuleTargetKind } from 'topoviewer/authoring';
import type { StudioMapperRuleReference } from '../../contracts/mapper';

export type StudioMapperFieldDisposition = 'control' | 'raw-yaml';

export interface StudioMapperStyleSlot {
  key: string;
  label: string;
  path: Array<string | number>;
  scopePath: Array<string | number>;
  style: Record<string, unknown>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function schemaSegments(path: string): Array<{ array: boolean; key: string; wildcard: boolean }> {
  return path.split('.').map((segment) => ({
    array: segment.endsWith('[]'),
    key: segment.replace(/\[\]$/, '').replace(/\.\*$/, ''),
    wildcard: segment === '*' || segment.endsWith('.*')
  }));
}

export function mapperFieldDisposition(field: MapperAuthoringFieldMetadata): StudioMapperFieldDisposition {
  return field.path.includes('.*')
    || (field.path.match(/\[\]/g) || []).length > 1
    || field.valueType === 'object'
    || field.valueType === 'array'
    || field.control?.kind === 'nested'
    ? 'raw-yaml'
    : 'control';
}

export function mapperFieldIsDirectlyEditable(
  field: MapperAuthoringFieldMetadata,
  rule?: StudioMapperRuleReference
): boolean {
  if (mapperFieldDisposition(field) !== 'control') return false;
  if (field.path.startsWith('rules[]')) return rule?.collection === 'rules';
  if (field.path.startsWith('mappings[]')) return rule?.collection === 'mappings';
  return true;
}

export function mapperFieldSourcePath(
  field: MapperAuthoringFieldMetadata,
  rule?: StudioMapperRuleReference
): Array<string | number> | undefined {
  const result: Array<string | number> = [];
  let arrayDepth = 0;
  for (const segment of schemaSegments(field.path)) {
    if (segment.wildcard) return result.length ? result : undefined;
    result.push(segment.key);
    if (!segment.array) continue;
    if (arrayDepth > 0 || !rule || rule.collection !== segment.key) return result;
    result.push(rule.index);
    arrayDepth += 1;
  }
  return result;
}

export function mapperFieldScopePath(path: Array<string | number>, field: MapperAuthoringFieldMetadata) {
  if (path.length <= 1) return [];
  if (field.path.startsWith('rules[]') || field.path.startsWith('mappings[]')) return path.slice(0, 2);
  return [path[0]];
}

export function mapperValueAtPath(mapper: Record<string, unknown>, path: Array<string | number>): unknown {
  return path.reduce<unknown>((current, segment) => {
    if (typeof segment === 'number') return Array.isArray(current) ? current[segment] : undefined;
    return isRecord(current) ? current[segment] : undefined;
  }, mapper);
}

export function mapperApplicableMetadata(
  rule: StudioMapperRuleReference | undefined,
  view: 'advanced' | 'all'
): MapperAuthoringFieldMetadata[] {
  return mapperAuthoringMetadata.filter((field) => {
    const collection = field.path.startsWith('rules[]')
      ? 'rules'
      : field.path.startsWith('mappings[]')
        ? 'mappings'
        : undefined;
    if (view === 'all') return true;
    return !collection || collection === rule?.collection;
  });
}

function normalizedActualPath(path: Array<string | number>): string {
  return path.reduce<string>((result, segment) => (
    typeof segment === 'number' ? `${result}[]` : result ? `${result}.${segment}` : segment
  ), '');
}

function knownMapperPath(path: string): boolean {
  const patterns = mapperAuthoringMetadata.map((field) => field.path);
  if (patterns.includes(path)) return true;
  if (patterns.some((pattern) => pattern.startsWith(`${path}.`) || pattern.startsWith(`${path}[]`))) return true;
  return patterns.some((pattern) => {
    if (!pattern.endsWith('.*')) return false;
    const prefix = pattern.slice(0, -2);
    return path === prefix || path.startsWith(`${prefix}.`);
  }) || [
    'mappings[].overlay.style',
    'mappings[].conditions[].style'
  ].some((prefix) => path === prefix || path.startsWith(`${prefix}.`));
}

export function unknownMapperSourcePaths(mapper: Record<string, unknown>): Array<Array<string | number>> {
  const unknown: Array<Array<string | number>> = [];
  function visit(value: unknown, path: Array<string | number>) {
    const normalized = normalizedActualPath(path);
    if (path.length && !knownMapperPath(normalized)) {
      unknown.push(path);
      return;
    }
    if (Array.isArray(value)) value.forEach((item, index) => visit(item, [...path, index]));
    else if (isRecord(value)) Object.entries(value).forEach(([key, item]) => visit(item, [...path, key]));
  }
  visit(mapper, []);
  return unknown;
}

export function mapperStyleTarget(rule: unknown): StyleTargetKind | undefined {
  const kind = mapperRuleTargetKind(rule);
  return kind && ['node', 'link', 'linkDirection', 'path', 'region'].includes(kind)
    ? kind as StyleTargetKind
    : undefined;
}

export function mapperStyleSlots(
  mapper: Record<string, unknown>,
  reference: StudioMapperRuleReference
): StudioMapperStyleSlot[] {
  const collection = mapper[reference.collection];
  const rule = Array.isArray(collection) && isRecord(collection[reference.index])
    ? collection[reference.index]
    : undefined;
  if (!rule) return [];
  const rulePath: Array<string | number> = [reference.collection, reference.index];
  if (reference.collection === 'rules') {
    const states = isRecord(rule.states) ? Object.keys(rule.states) : [];
    const styles = isRecord(rule.style) ? rule.style : {};
    return ['default', ...states].map((key) => ({
      key,
      label: key === 'default' ? 'Default' : key,
      path: [...rulePath, 'style', key],
      scopePath: rulePath,
      style: isRecord(styles[key]) ? styles[key] : {}
    }));
  }
  const overlay = isRecord(rule.overlay) ? rule.overlay : {};
  const conditions: unknown[] = Array.isArray(rule.conditions) ? rule.conditions : [];
  return [{
    key: 'default',
    label: 'Default',
    path: [...rulePath, 'overlay', 'style'],
    scopePath: rulePath,
    style: isRecord(overlay.style) ? overlay.style : {}
  }, ...conditions.flatMap((condition, index) => {
    if (!isRecord(condition)) return [];
    return [{
      key: `condition:${index}`,
      label: typeof condition.id === 'string' ? condition.id : `Condition ${index + 1}`,
      path: [...rulePath, 'conditions', index, 'style'],
      scopePath: [...rulePath, 'conditions', index],
      style: isRecord(condition.style) ? condition.style : {}
    }];
  })];
}
