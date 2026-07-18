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

export interface SelectorObjectIdReference {
  id: string;
  kind: string;
}

function selectorSpecificity(selector: string): number {
  const parsed = parseSelector(selector);
  return parsed.conditions.reduce((score, condition) => (
    score + (condition.field === 'id' && condition.op === '=' ? 1000 : 10)
  ), 0);
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

export function selectorObjectIdReferences(selector: string): SelectorObjectIdReference[] {
  const parsed = parseSelector(selector);
  if (!parsed.kind) return [];
  return parsed.conditions.flatMap((condition) => (
    condition.field === 'id' && condition.op === '=' ? [{ id: condition.value, kind: parsed.kind }] : []
  ));
}

export function rewriteSelectorFieldValue(
  selector: string,
  kind: string | undefined,
  targetField: string,
  previousId: string,
  nextId: string
): string {
  const parsed = parseSelector(selector);
  if ((kind && parsed.kind !== kind) || !parsed.conditions.some((condition) => (
    condition.field === targetField && condition.value === previousId
  ))) return selector;

  return selector.replace(
    /\[\s*([\w.-]+)\s*(=|~=)\s*(?:"([^"]*)"|'([^']*)'|([^\]]+?))\s*\]/g,
    (condition, fieldName: string, operator: string, doubleQuoted: string | undefined, singleQuoted: string | undefined, bare: string | undefined) => {
      const value = (doubleQuoted ?? singleQuoted ?? bare ?? '').trim();
      if (fieldName !== targetField || value !== previousId) return condition;
      return `[${fieldName} ${operator} ${JSON.stringify(nextId)}]`;
    }
  );
}

export function rewriteSelectorObjectId(
  selector: string,
  kind: string,
  previousId: string,
  nextId: string
): string {
  return rewriteSelectorFieldValue(selector, kind, 'id', previousId, nextId);
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
  return rules
    .map((rule, index) => ({ index, rule, specificity: selectorSpecificity(rule.selector) }))
    .filter(({ rule }) => selectorMatches(kind, entity, rule.selector))
    .sort((left, right) => left.specificity - right.specificity || left.index - right.index)
    .map(({ rule }) => rule);
}
