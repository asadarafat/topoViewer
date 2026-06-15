import type { GraphEntity, StyleRule } from './types';

interface SelectorCondition {
  field: string;
  op: '=' | '~=';
  value: string;
}

interface ParsedSelector {
  kind: string;
  conditions: SelectorCondition[];
}

function parseSelector(selector = ''): ParsedSelector {
  const trimmed = selector.trim();
  const kind = trimmed.match(/^[a-zA-Z][\w-]*/)?.[0] || '';
  const conditions: SelectorCondition[] = [];
  const conditionPattern = /\[\s*([\w.-]+)\s*(=|~=)\s*(?:"([^"]*)"|'([^']*)'|([^\]]+?))\s*\]/g;
  let match;

  while ((match = conditionPattern.exec(trimmed)) !== null) {
    conditions.push({
      field: match[1],
      op: match[2] as '=' | '~=',
      value: (match[3] ?? match[4] ?? match[5] ?? '').trim()
    });
  }

  return { kind, conditions };
}

function valueAt(entity: Record<string, unknown>, field: string): unknown {
  return field.split('.').reduce<unknown>((value, key) => {
    if (value && typeof value === 'object') return (value as Record<string, unknown>)[key];
    return undefined;
  }, entity);
}

function styleSubject(entity: GraphEntity): Record<string, unknown> {
  return { ...(entity.data || {}), ...entity };
}

function conditionMatches(entity: Record<string, unknown>, condition: SelectorCondition): boolean {
  const actual = valueAt(entity, condition.field);

  if (condition.op === '~=') {
    return Array.isArray(actual)
      ? actual.map(String).includes(condition.value)
      : String(actual || '').split(/\s+/).includes(condition.value);
  }

  if (Array.isArray(actual)) return actual.map(String).includes(condition.value);
  return String(actual) === condition.value;
}

export function selectorMatches(kind: string, entity: GraphEntity, selector: string): boolean {
  const parsed = parseSelector(selector);
  if (parsed.kind !== kind) return false;
  return parsed.conditions.every((condition) => conditionMatches(styleSubject(entity), condition));
}

export function matchingRules(kind: string, entity: GraphEntity, rules: StyleRule[] = []): StyleRule[] {
  return rules.filter((rule) => selectorMatches(kind, entity, rule.selector));
}
