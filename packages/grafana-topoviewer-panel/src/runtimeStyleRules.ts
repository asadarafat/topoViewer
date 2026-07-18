import type { StyleDeclaration, StyleRule, TopoDocument } from 'topoviewer';

export type RuntimeStyleTarget = 'link' | 'linkDirection' | 'node' | 'path' | 'region';

export interface RuntimeStyleBucket {
  stylesById: Record<string, StyleDeclaration>;
  target: RuntimeStyleTarget;
}

function exactIdSelector(target: RuntimeStyleTarget, id: string): string {
  return `${target}[id = ${JSON.stringify(id)}]`;
}

export function runtimeStyleRules(buckets: RuntimeStyleBucket[]): StyleRule[] {
  return buckets.flatMap(({ stylesById, target }) => Object.entries(stylesById).flatMap(([id, style]) => (
    Object.keys(style).length ? [{ selector: exactIdSelector(target, id), style }] : []
  )));
}

export function appendRuntimeStyleRules(document: TopoDocument, buckets: RuntimeStyleBucket[]): TopoDocument {
  const rules = runtimeStyleRules(buckets);
  if (!rules.length) return document;
  return {
    ...document,
    stylesheet: [...(document.stylesheet || []), ...rules]
  };
}
