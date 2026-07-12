import { styleDefaultSummary, type StyleTargetKind, type StyleValueDataType } from 'topoviewer';
import {
  styleAuthoringFieldForKey,
  styleAuthoringMetadataByTarget
} from 'topoviewer/authoring';
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
  node: styleAuthoringMetadataByTarget.node.map(({ path: key, label }) => ({ key, label })),
  link: styleAuthoringMetadataByTarget.link.map(({ path: key, label }) => ({ key, label })),
  linkDirection: styleAuthoringMetadataByTarget.linkDirection.map(({ path: key, label }) => ({ key, label })),
  path: styleAuthoringMetadataByTarget.path.map(({ path: key, label }) => ({ key, label })),
  region: styleAuthoringMetadataByTarget.region.map(({ path: key, label }) => ({ key, label })),
  callout: styleAuthoringMetadataByTarget.callout.map(({ path: key, label }) => ({ key, label })),
  shape: styleAuthoringMetadataByTarget.shape.map(({ path: key, label }) => ({ key, label })),
  text: styleAuthoringMetadataByTarget.text.map(({ path: key, label }) => ({ key, label }))
};

export function styleValueDefinitionForKey(kind: TopoObjectSelection['kind'], key: string): StyleValueDefinition {
  const definition = styleAuthoringFieldForKey(targetKind(kind), key);
  const dataType = definition?.valueType || 'text';
  return dataType === 'numberList'
    ? { dataType: 'text' }
    : { dataType, options: definition?.values };
}

export function styleDocumentationForKey(kind: TopoObjectSelection['kind'], key: string): string {
  const definition = styleAuthoringFieldForKey(targetKind(kind), key);
  if (!definition) return `Style key ${key}.`;
  const values = definition.values?.length ? ` Accepted values: ${definition.values.join(', ')}.` : '';
  const valueType = definition.valueType === 'numberList' ? 'text' : definition.valueType;
  return `${definition.label}. ${definition.description} Value type: ${valueType}.${values} ${styleDefaultSummary({
    dataType: definition.valueType,
    default: definition.default,
    key: definition.path,
    label: definition.label,
    targets: definition.targets,
    use: definition.description,
    values: definition.values
  })}`;
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
  return styleAuthoringFieldForKey(targetKind(kind), key)?.group || 'General';
}
