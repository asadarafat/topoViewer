import type { GraphEntity, StyleRule, StylesheetDocument } from './types';
import type { StyleTargetKind } from './styleDefaults';

const styleTargets = new Set<StyleTargetKind>([
  'node',
  'link',
  'linkDirection',
  'path',
  'region',
  'shape',
  'callout',
  'text'
]);

const pluralTargetLabels: Record<StyleTargetKind, string> = {
  callout: 'callouts',
  link: 'links',
  linkDirection: 'link directions',
  node: 'nodes',
  path: 'paths',
  region: 'regions',
  shape: 'shapes',
  text: 'text objects'
};

const singularTargetLabels: Record<StyleTargetKind, string> = {
  callout: 'callout',
  link: 'link',
  linkDirection: 'link direction',
  node: 'node',
  path: 'path',
  region: 'region',
  shape: 'shape',
  text: 'text object'
};

export interface StyleAuthoringRule {
  index: number;
  rule: StyleRule;
}

export interface StyleSelectorSuggestion {
  label: string;
  selector: string;
  source: 'kind' | 'id' | 'label';
}

function quotedSelectorValue(value: string | number | boolean): string {
  return JSON.stringify(String(value));
}

export function styleSelectorTarget(selector: string): StyleTargetKind | undefined {
  const candidate = selector.trim().match(/^[a-zA-Z][\w-]*/)?.[0] as StyleTargetKind | undefined;
  return candidate && styleTargets.has(candidate) ? candidate : undefined;
}

export function styleSelectorIsValid(selector: string): boolean {
  const trimmed = selector.trim();
  const target = styleSelectorTarget(trimmed);
  if (!target) return false;
  const remainder = trimmed.slice(target.length);
  const conditionPattern = /\[\s*[\w.-]+\s*(?:=|~=)\s*(?:"[^"]*"|'[^']*'|[^\]]+?)\s*\]/g;
  let cursor = 0;
  let match: RegExpExecArray | null;
  while ((match = conditionPattern.exec(remainder)) !== null) {
    if (remainder.slice(cursor, match.index).trim()) return false;
    cursor = match.index + match[0].length;
  }
  return remainder.slice(cursor).trim() === '';
}

export function styleRulesForTarget(
  document: Pick<StylesheetDocument, 'stylesheet'>,
  target: StyleTargetKind
): StyleAuthoringRule[] {
  return (document.stylesheet || []).flatMap((rule, index) => (
    styleSelectorTarget(rule.selector) === target ? [{ index, rule }] : []
  ));
}

export function styleSelectorSuggestions(
  target: StyleTargetKind,
  entity?: Pick<GraphEntity, 'id' | 'labels'>
): StyleSelectorSuggestion[] {
  const suggestions: StyleSelectorSuggestion[] = [{
    label: `All ${pluralTargetLabels[target]}`,
    selector: target,
    source: 'kind'
  }];
  if (!entity) return suggestions;

  suggestions.push({
    label: `This ${singularTargetLabels[target]}`,
    selector: `${target}[id = ${quotedSelectorValue(entity.id)}]`,
    source: 'id'
  });
  Object.entries(entity.labels || {})
    .filter(([key, value]) => /^[\w-]+$/.test(key) && ['boolean', 'number', 'string'].includes(typeof value))
    .sort(([left], [right]) => left.localeCompare(right))
    .forEach(([key, value]) => {
      suggestions.push({
        label: `${key} = ${String(value)}`,
        selector: `${target}[labels.${key} = ${quotedSelectorValue(value as string | number | boolean)}]`,
        source: 'label'
      });
    });
  return suggestions;
}
