import { mergePlainObjects } from './object';
import { matchingRules, selectorMatches } from './selector';
import { styleDefinitions, type StyleDefault, type StyleTargetKind } from './styleDefaults';
import type { GraphEntity, StyleDeclaration, StylesheetDocument, TopoDocument } from './types';

export type StyleProvenanceSourceKind = 'default' | 'rule' | 'runtime';
export type StyleProvenanceDocument = 'default' | 'stylesheet' | 'runtime';

export interface StyleProvenanceContributor {
  document: StyleProvenanceDocument;
  kind: StyleProvenanceSourceKind;
  overridden: boolean;
  path?: Array<string | number>;
  selector?: string;
  value: unknown;
}

export interface StyleFieldProvenance {
  contributors: StyleProvenanceContributor[];
  effectiveValue: unknown;
  key: string;
  winner?: StyleProvenanceContributor;
}

export interface ResolveStyleProvenanceOptions {
  runtimeStyle?: StyleDeclaration;
}

export interface StyleRuleAffectedObject {
  id: string;
  target: StyleTargetKind;
}

function targetEntities(document: TopoDocument, target: StyleTargetKind): GraphEntity[] {
  if (target === 'node') return document.graph?.nodes || [];
  if (target === 'link') return document.graph?.links || [];
  if (target === 'path') return document.graph?.paths || [];
  if (target === 'region') return document.graph?.regions || [];
  if (target === 'shape') return document.diagram?.shapes || [];
  if (target === 'callout') return document.diagram?.callouts || [];
  if (target === 'text') return document.diagram?.texts || [];
  return (document.graph?.links || []).flatMap((link) => Object.entries(link.directions || {}).map(([direction, value]) => ({
    ...value,
    data: { ...(value.data || {}), direction, linkId: link.id },
    id: value.id || `${link.id}:${direction}`
  })));
}

export function styleRuleAffectedObjects(
  document: TopoDocument,
  target: StyleTargetKind,
  selector: string
): StyleRuleAffectedObject[] {
  return targetEntities(document, target)
    .filter((entity) => selectorMatches(target, entity, selector))
    .map((entity) => ({ id: entity.id, target }));
}

function defaultValue(value: StyleDefault): unknown {
  if (value.kind === 'value') return value.value;
  return value.kind === 'derived' ? value.fallback : undefined;
}

function mergeValue(current: unknown, next: unknown): unknown {
  if (
    current && next
    && typeof current === 'object' && !Array.isArray(current)
    && typeof next === 'object' && !Array.isArray(next)
  ) {
    return mergePlainObjects(current as Record<string, unknown>, next as Record<string, unknown>);
  }
  return next;
}

export function resolveStyleProvenance(
  target: StyleTargetKind,
  entity: GraphEntity,
  spec: StylesheetDocument,
  options: ResolveStyleProvenanceOptions = {}
): StyleFieldProvenance[] {
  const rules = matchingRules(target === 'linkDirection' ? 'linkDirection' : target, entity, spec.stylesheet || []);
  const definitions = styleDefinitions.filter((definition) => (
    definition.targets.includes(target)
    || (target === 'linkDirection' && definition.targets.includes('link'))
  ));
  return definitions.map((definition) => {
    const contributors: Omit<StyleProvenanceContributor, 'overridden'>[] = [];
    const fallback = defaultValue(definition.default);
    if (fallback !== undefined) contributors.push({ document: 'default', kind: 'default', value: fallback });
    rules.forEach((rule) => {
      const value = rule.style?.[definition.key];
      if (value === undefined) return;
      const index = (spec.stylesheet || []).indexOf(rule);
      contributors.push({
        document: 'stylesheet',
        kind: 'rule',
        path: ['stylesheet', index, 'style', definition.key],
        selector: rule.selector,
        value
      });
    });
    const runtime = options.runtimeStyle?.[definition.key];
    if (runtime !== undefined) contributors.push({ document: 'runtime', kind: 'runtime', value: runtime });
    let effectiveValue: unknown;
    contributors.forEach((contributor) => {
      effectiveValue = mergeValue(effectiveValue, contributor.value);
    });
    const resolved = contributors.map((contributor, index): StyleProvenanceContributor => ({
      ...contributor,
      overridden: index !== contributors.length - 1
    }));
    return {
      contributors: resolved,
      effectiveValue,
      key: definition.key,
      winner: resolved.at(-1)
    };
  });
}
