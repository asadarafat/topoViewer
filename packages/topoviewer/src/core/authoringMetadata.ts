import type { StyleDefault, StyleTargetKind, StyleValueDataType } from './styleDefaults';

export type AuthoringFieldLevel = 'basic' | 'advanced';
export type AuthoringControlKind =
  | 'text'
  | 'number'
  | 'switch'
  | 'select'
  | 'color'
  | 'numberList'
  | 'asset'
  | 'selector'
  | 'nested'
  | 'raw';

export interface AuthoringCondition {
  equals?: string | number | boolean;
  exists?: boolean;
  path: string;
}

export interface AuthoringControlHint {
  kind: AuthoringControlKind;
  maximum?: number;
  minimum?: number;
  placeholder?: string;
  specializedEditor?: string;
  step?: number;
}

export interface AuthoringFieldMetadata {
  aliases?: string[];
  conflictsWith?: string[];
  control?: AuthoringControlHint;
  default: StyleDefault;
  description: string;
  examples?: Array<string | number | boolean>;
  group: string;
  label: string;
  level: AuthoringFieldLevel;
  order: number;
  nestedFields?: AuthoringNestedFieldMetadata[];
  path: string;
  targets: StyleTargetKind[];
  valueType: StyleValueDataType;
  values?: string[];
  visibleWhen?: AuthoringCondition;
}

export interface AuthoringNestedFieldMetadata {
  control: AuthoringControlHint;
  default: StyleDefault;
  description: string;
  examples?: Array<string | number | boolean>;
  label: string;
  level: AuthoringFieldLevel;
  order: number;
  path: string;
  required: boolean;
  valueType: StyleValueDataType;
  values?: string[];
  visibleWhen?: AuthoringCondition;
}

export interface MapperAuthoringFieldMetadata {
  control?: AuthoringControlHint;
  description: string;
  descriptionGenerated?: boolean;
  group: string;
  label: string;
  level: AuthoringFieldLevel;
  order: number;
  path: string;
  required: boolean;
  targetKinds?: StyleTargetKind[];
  valueType: StyleValueDataType | 'array';
  values?: string[];
  visibleWhen?: AuthoringCondition;
}

export type MapperAuthoringCapabilityId =
  | 'compact-rules'
  | 'canonical-mappings'
  | 'identity'
  | 'transforms'
  | 'states'
  | 'formatting'
  | 'priority'
  | 'diagnostics'
  | 'unknown-extensions';

export interface MapperAuthoringCapability {
  description: string;
  disposition: 'generated-controls' | 'specialized-editor' | 'ordered-sequence' | 'runtime-diagnostics' | 'raw-yaml-fallback';
  fieldPaths: string[];
  id: MapperAuthoringCapabilityId;
}

export type AuthoringInputResult =
  | { ok: true; value: unknown }
  | { error: string; ok: false };

export function authoringFieldDefaultValue(field: Pick<AuthoringFieldMetadata, 'default'>): unknown {
  if (field.default.kind === 'value') return field.default.value;
  return field.default.kind === 'derived' ? field.default.fallback : undefined;
}

function valueAtPath(value: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((current, segment) => (
    current && typeof current === 'object' && !Array.isArray(current)
      ? (current as Record<string, unknown>)[segment]
      : undefined
  ), value);
}

export function authoringFieldIsVisible(
  field: Pick<AuthoringFieldMetadata, 'visibleWhen'>,
  values: Record<string, unknown>
): boolean {
  if (!field.visibleWhen) return true;
  const actual = valueAtPath(values, field.visibleWhen.path);
  if (field.visibleWhen.exists !== undefined) return (actual !== undefined) === field.visibleWhen.exists;
  return field.visibleWhen.equals === undefined || actual === field.visibleWhen.equals;
}

function numberResult(value: unknown, integer: boolean): AuthoringInputResult {
  const parsed = typeof value === 'number' ? value : Number(String(value).trim());
  if (!Number.isFinite(parsed) || (integer && !Number.isInteger(parsed))) {
    return { error: integer ? 'Enter a whole number.' : 'Enter a finite number.', ok: false };
  }
  return { ok: true, value: parsed };
}

export function coerceAuthoringFieldValue(
  field: Pick<AuthoringFieldMetadata, 'valueType' | 'values'>,
  input: unknown
): AuthoringInputResult {
  if (field.valueType === 'boolean') {
    if (typeof input === 'boolean') return { ok: true, value: input };
    if (input === 'true' || input === 'false') return { ok: true, value: input === 'true' };
    return { error: 'Choose true or false.', ok: false };
  }
  if (field.valueType === 'integer') return numberResult(input, true);
  if (field.valueType === 'number') return numberResult(input, false);
  if (field.valueType === 'numberList') {
    const values = Array.isArray(input)
      ? input
      : String(input).split(/[\s,]+/).filter(Boolean);
    const parsed = values.map(Number);
    return parsed.every(Number.isFinite)
      ? { ok: true, value: parsed }
      : { error: 'Enter a comma- or space-separated list of finite numbers.', ok: false };
  }
  if (field.valueType === 'object') {
    if (input && typeof input === 'object' && !Array.isArray(input)) return { ok: true, value: input };
    return { error: 'Enter an object value.', ok: false };
  }
  const value = String(input);
  if (field.valueType === 'enum' && field.values && !field.values.includes(value)) {
    return { error: `Choose one of: ${field.values.join(', ')}.`, ok: false };
  }
  return { ok: true, value };
}
