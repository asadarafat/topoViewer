import { planAuthoringDeletion } from './authoringGraph';
import type { AuthoringEditPlan, AuthoringObjectSelection, AuthoringRemoval } from './authoringTypes';
import { selectorObjectIdReferences } from './selector';
import type { StylesheetDocument, TopoDocument } from './types';

export interface AuthoringBundleDeletionPlan {
  deletedSelections: AuthoringObjectSelection[];
  stylesheet: AuthoringEditPlan;
  topology: AuthoringEditPlan;
}

interface AuthoringDeletionBundle {
  stylesheet?: StylesheetDocument;
  topology: TopoDocument;
}

function record(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

function selectionKey(selection: AuthoringObjectSelection): string {
  return `${selection.kind}\u0000${selection.id}`;
}

function deletedStyleTargets(topology: TopoDocument, plan: AuthoringEditPlan): AuthoringObjectSelection[] {
  const targets = new Map<string, AuthoringObjectSelection>();
  const add = (selection: AuthoringObjectSelection) => targets.set(selectionKey(selection), selection);
  plan.removals.forEach((removal) => add(removal.selection));

  const deletedLinkIds = new Set(plan.removals.flatMap((removal) => (
    removal.selection.kind === 'link' ? [removal.selection.id] : []
  )));
  for (const link of topology.graph?.links || []) {
    if (!deletedLinkIds.has(link.id)) continue;
    for (const [direction, rawDirection] of Object.entries(link.directions || {})) {
      const directionValue = record(rawDirection);
      add({
        id: typeof directionValue?.id === 'string' && directionValue.id
          ? directionValue.id
          : `${link.id}:${direction}`,
        kind: 'linkDirection'
      });
    }
  }

  return [...targets.values()];
}

function stylesheetRuleRemovals(
  stylesheet: StylesheetDocument | undefined,
  deletedSelections: AuthoringObjectSelection[]
): AuthoringRemoval[] {
  const deleted = new Set(deletedSelections.map(selectionKey));
  return (stylesheet?.stylesheet || [])
    .flatMap((rule, index): AuthoringRemoval[] => {
      const owner = selectorObjectIdReferences(rule.selector).find((reference) => (
        deleted.has(selectionKey({ id: reference.id, kind: reference.kind as AuthoringObjectSelection['kind'] }))
      ));
      if (!owner) return [];
      return [{
        path: ['stylesheet', index],
        scopePath: ['stylesheet'],
        selection: { id: owner.id, kind: owner.kind as AuthoringObjectSelection['kind'] }
      }];
    })
    .sort((left, right) => Number(right.path.at(-1)) - Number(left.path.at(-1)));
}

export function planAuthoringStylesheetDeletionCleanup(
  stylesheet: StylesheetDocument | undefined,
  deletedSelections: AuthoringObjectSelection[]
): AuthoringEditPlan {
  return {
    insertions: [],
    removals: stylesheetRuleRemovals(stylesheet, deletedSelections),
    updates: []
  };
}

export function planAuthoringBundleDeletion(
  bundle: AuthoringDeletionBundle,
  selections: AuthoringObjectSelection[]
): AuthoringBundleDeletionPlan {
  const topology = planAuthoringDeletion(bundle.topology, selections);
  const deletedSelections = deletedStyleTargets(bundle.topology, topology);
  const inlineStylesheet = planAuthoringStylesheetDeletionCleanup(bundle.topology, deletedSelections);
  return {
    deletedSelections,
    stylesheet: planAuthoringStylesheetDeletionCleanup(bundle.stylesheet, deletedSelections),
    topology: {
      ...topology,
      removals: [...inlineStylesheet.removals, ...topology.removals]
    }
  };
}
