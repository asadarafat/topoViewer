import { applyStyle, type StyleRule, type StyleTargetKind, type TopoDocument } from 'topoviewer';
import { copyAuthoringSelection, pasteAuthoringClipboard, styleExactIdSelector, type AuthoringEditPlan, type AuthoringObjectSelection } from 'topoviewer/authoring';
import type { StudioSourceMutation } from '../../contracts/commands';

const styledKinds = new Set<StyleTargetKind>(['callout', 'link', 'node', 'path', 'region', 'shape', 'text']);

export interface StudioDuplicationPlan {
  additionalMutations: StudioSourceMutation[];
  plan: AuthoringEditPlan;
}

function record(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined;
}

function sameValue(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (Array.isArray(left) || Array.isArray(right)) {
    return Array.isArray(left) && Array.isArray(right) && left.length === right.length && left.every((value, index) => sameValue(value, right[index]));
  }
  const leftRecord = record(left);
  const rightRecord = record(right);
  if (!leftRecord || !rightRecord) return false;
  const leftKeys = Object.keys(leftRecord).sort();
  const rightKeys = Object.keys(rightRecord).sort();
  return leftKeys.length === rightKeys.length && leftKeys.every((key, index) => key === rightKeys[index] && sameValue(leftRecord[key], rightRecord[key]));
}

function graphEntity(value: Record<string, unknown>): Parameters<typeof applyStyle>[1] {
  if (typeof value.id !== 'string' || !value.id) throw new Error('Cannot preserve style for an object without an ID.');
  return value as unknown as Parameters<typeof applyStyle>[1];
}

function lostStyle(target: StyleTargetKind, source: Record<string, unknown>, duplicate: Record<string, unknown>, document: TopoDocument): Record<string, unknown> {
  const sourceStyle = applyStyle(target, graphEntity(source), document);
  const duplicateStyle = applyStyle(target, graphEntity(duplicate), document);
  return Object.fromEntries(Object.entries(sourceStyle).filter(([key, value]) => !sameValue(value, duplicateStyle[key])));
}

function directionStyleRules(sourceLink: Record<string, unknown>, duplicateLink: Record<string, unknown>, document: TopoDocument): StyleRule[] {
  const sourceDirections = record(sourceLink.directions);
  const duplicateDirections = record(duplicateLink.directions);
  if (!sourceDirections || !duplicateDirections) return [];
  const sourceLinkId = String(sourceLink.id || '');
  const duplicateLinkId = String(duplicateLink.id || '');
  const rules: StyleRule[] = [];

  for (const [direction, sourceValue] of Object.entries(sourceDirections)) {
    const sourceDirection = record(sourceValue);
    const duplicateDirection = record(duplicateDirections[direction]);
    if (!sourceDirection || !duplicateDirection) continue;
    const sourceId = String(sourceDirection.id || `${sourceLinkId}:${direction}`);
    const duplicateId = `${duplicateLinkId}:${direction}`;
    if (sourceDirection.id) duplicateDirection.id = duplicateId;
    const sourceEntity = {
      ...sourceDirection,
      data: { ...(record(sourceDirection.data) || {}), direction, linkId: sourceLinkId },
      id: sourceId
    };
    const duplicateEntity = {
      ...duplicateDirection,
      data: { ...(record(duplicateDirection.data) || {}), direction, linkId: duplicateLinkId },
      id: duplicateId
    };
    const style = lostStyle('linkDirection', sourceEntity, duplicateEntity, document);
    if (Object.keys(style).length > 0) {
      rules.push({ selector: styleExactIdSelector('linkDirection', duplicateId), style });
    }
  }
  return rules;
}

function stylesheetMutations(stylesheet: Record<string, unknown> | undefined, rules: StyleRule[]): StudioSourceMutation[] {
  if (rules.length === 0) return [];
  if (Array.isArray(stylesheet?.stylesheet)) {
    return rules.map((rule) => ({
      document: 'stylesheet' as const,
      kind: 'insert-value' as const,
      path: ['stylesheet'],
      value: rule
    }));
  }
  return [{
    document: 'stylesheet',
    kind: 'upsert-value',
    path: ['stylesheet'],
    scopePath: [],
    value: rules
  }];
}

export function planStudioSelectionDuplication(document: TopoDocument, stylesheet: Record<string, unknown> | undefined, selections: AuthoringObjectSelection[]): StudioDuplicationPlan {
  const clipboard = copyAuthoringSelection(document, selections);
  const plan = pasteAuthoringClipboard(document, clipboard);
  const copyableItems = clipboard.filter((item) => item.selection.kind !== 'linkDirection');
  const rules: StyleRule[] = [];

  plan.insertions.forEach((insertion, index) => {
    const sourceItem = copyableItems[index];
    if (!sourceItem) return;
    const kind = insertion.selection.kind as StyleTargetKind;
    if (!styledKinds.has(kind)) return;
    const source = { ...sourceItem.value, id: sourceItem.selection.id } as Record<string, unknown>;
    const duplicate = insertion.value;
    const style = lostStyle(kind, source, duplicate, document);
    if (Object.keys(style).length > 0) {
      rules.push({ selector: styleExactIdSelector(kind, String(duplicate.id || insertion.selection.id)), style });
    }
    if (kind === 'link') rules.push(...directionStyleRules(source, duplicate, document));
  });

  return {
    additionalMutations: stylesheetMutations(stylesheet, rules),
    plan
  };
}
