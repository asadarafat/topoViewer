import {
  isColorStyleKey,
  isCommonLabelStyleKey,
  styleDefaultSummary,
  styleDefinitionForKey,
  styleDefinitionsByKind,
  styleValueDefinitionForKey as topoviewerStyleValueDefinitionForKey,
  type StyleTargetKind,
  type StyleValueDataType
} from 'topoviewer';
import type { TopoObjectSelection } from '../shared/topologyMutations';

export type { StyleValueDataType };

export interface KeyValueEditorRow {
  id: string;
  key: string;
  value: string;
}

export interface StyleValueDefinition {
  dataType: StyleValueDataType;
  options?: string[];
}

function targetKind(kind: TopoObjectSelection['kind']): StyleTargetKind {
  return kind;
}

export const styleOptionsByKind: Record<TopoObjectSelection['kind'], Array<{ key: string; label: string }>> = {
  node: styleDefinitionsByKind.node.map(({ key, label }) => ({ key, label })),
  link: styleDefinitionsByKind.link.map(({ key, label }) => ({ key, label })),
  path: styleDefinitionsByKind.path.map(({ key, label }) => ({ key, label })),
  region: styleDefinitionsByKind.region.map(({ key, label }) => ({ key, label })),
  callout: styleDefinitionsByKind.callout.map(({ key, label }) => ({ key, label })),
  shape: styleDefinitionsByKind.shape.map(({ key, label }) => ({ key, label }))
};

export function styleValueDefinitionForKey(kind: TopoObjectSelection['kind'], key: string): StyleValueDefinition {
  const definition = topoviewerStyleValueDefinitionForKey(targetKind(kind), key);
  return definition.dataType === 'numberList'
    ? { dataType: 'text' }
    : definition;
}

export function styleDocumentationForKey(kind: TopoObjectSelection['kind'], key: string): string {
  const definition = styleDefinitionForKey(targetKind(kind), key);
  if (!definition) return `Style key ${key}.`;
  const values = definition.values?.length ? ` Accepted values: ${definition.values.join(', ')}.` : '';
  const valueType = definition.dataType === 'numberList' ? 'text' : definition.dataType;
  return `${definition.label}. ${definition.use} Value type: ${valueType}.${values} ${styleDefaultSummary(definition)}`;
}

function cloneRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}

export function styleMetadataForYamlIntelligence() {
  const kinds = Object.keys(styleOptionsByKind) as TopoObjectSelection['kind'][];
  return {
    optionsByKind: Object.fromEntries(
      kinds.map((kind) => [kind, styleOptionsByKind[kind]])
    ) as Record<TopoObjectSelection['kind'], Array<{ key: string; label: string }>>,
    valueTypesByKind: Object.fromEntries(
      kinds.map((kind) => [
        kind,
        Object.fromEntries(
          styleOptionsByKind[kind].map((option) => [
            option.key,
            styleValueDefinitionForKey(kind, option.key)
          ])
        )
      ])
    ) as Record<TopoObjectSelection['kind'], Record<string, StyleValueDefinition>>
  };
}

function rowValueToInput(value: unknown): string {
  if (value === undefined || value === null) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export function keyValueRowsForObject(object: any | undefined, key: 'labels' | 'data'): KeyValueEditorRow[] {
  const record = cloneRecord(object?.[key]) || {};
  const entries = Object.entries(record);
  if (!entries.length) {
    return [{ id: `${key}-new-0`, key: '', value: '' }];
  }
  return entries.map(([entryKey, value], index) => ({
    id: `${key}-${entryKey}-${index}`,
    key: entryKey,
    value: rowValueToInput(value)
  }));
}

export function recordFromRows(rows: KeyValueEditorRow[]): Record<string, unknown> {
  return rows.reduce<Record<string, unknown>>((record, row) => {
    const key = row.key.trim();
    if (!key) return record;
    record[key] = row.value;
    return record;
  }, {});
}

export function styleGroupForKey(kind: TopoObjectSelection['kind'], key: string) {
  if (kind === 'link' || kind === 'path') {
    if (key.includes('Arrow')) return 'Arrows';
    if (isCommonLabelStyleKey(key) || key.includes('Label') || key.startsWith('sourceLabel') || key.startsWith('targetLabel') || key.startsWith('text')) return 'Labels';
    if (key.includes('Distance') || key.includes('control') || key.includes('segment') || key.includes('taxi') || key === 'curveStyle' || key === 'edgeDistances') return 'Routing';
    if (key.startsWith('line')) return 'Line';
    return 'General';
  }
  if (key.startsWith('label') || key.startsWith('meta')) return 'Labels';
  if (key.startsWith('badge') || key.startsWith('status')) return 'Status';
  if (key.startsWith('icon')) return 'Icon';
  if (key.includes('border') || key.includes('outline') || key.includes('underlay') || isColorStyleKey(key)) return 'Border and underlay';
  if (['width', 'height', 'shape', 'shapePolygonPoints', 'zIndex', 'rotation'].includes(key)) return 'Geometry';
  if (['display', 'draggable', 'selectable', 'opacity', 'interactive'].includes(key)) return 'Interaction';
  return 'General';
}
