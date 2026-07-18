import { applyStyle, type StyleRule, type StyleTargetKind, type TopoDocument, type TopoViewerObjectClick } from 'topoviewer';
import { findAuthoringObject, resolveAuthoringSelection, styleExactIdSelector, type AuthoringEditPlan, type AuthoringObjectSelection } from 'topoviewer/authoring';
import type { StudioSourceMutation } from '../contracts/commands';
import type { StudioSelection } from '../contracts/project';
import { replaceCandidateStyleRule, type StudioDocumentSession, type StudioStylesheetCandidateController } from '../session';

const supportedKinds = new Set<StyleTargetKind>(['callout', 'link', 'linkDirection', 'node', 'path', 'region', 'shape', 'text']);

export interface StudioFormatPainterPlan {
  additionalMutations: StudioSourceMutation[];
  plan: AuthoringEditPlan;
}

function record(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined;
}

function targetForSelection(selection: AuthoringObjectSelection): { id: string; kind: StyleTargetKind } | undefined {
  return supportedKinds.has(selection.kind as StyleTargetKind) ? { id: selection.id, kind: selection.kind as StyleTargetKind } : undefined;
}

export function studioFormatPainterStyle(document: TopoDocument, sourceSelection: AuthoringObjectSelection, targetSelection: AuthoringObjectSelection): Record<string, unknown> {
  const sourceTarget = targetForSelection(sourceSelection);
  const target = targetForSelection(targetSelection);
  if (!sourceTarget || !target) throw new Error('Format Painter requires styleable topology objects.');
  if (sourceTarget.kind !== target.kind) throw new Error(`Format Painter cannot apply ${sourceTarget.kind} appearance to ${target.kind}.`);
  if (sourceTarget.id === target.id) throw new Error('Choose a different object to receive the copied format.');
  const sourceObject = findAuthoringObject(document, sourceSelection);
  if (!sourceObject) throw new Error('Format Painter could not resolve the selected object.');
  return structuredClone(
    applyStyle(sourceTarget.kind, sourceObject as Parameters<typeof applyStyle>[1], document)
  ) as Record<string, unknown>;
}

function stylesheetMutation(stylesheet: Record<string, unknown> | undefined, target: { id: string; kind: StyleTargetKind }, style: Record<string, unknown>): StudioSourceMutation {
  const selector = styleExactIdSelector(target.kind, target.id);
  const rules = Array.isArray(stylesheet?.stylesheet) ? stylesheet.stylesheet : undefined;
  let index = -1;
  if (rules) {
    for (let ruleIndex = rules.length - 1; ruleIndex >= 0; ruleIndex -= 1) {
      if (String(record(rules[ruleIndex])?.selector || '').trim() === selector) {
        index = ruleIndex;
        break;
      }
    }
  }
  if (index >= 0) {
    return {
      document: 'stylesheet',
      kind: 'upsert-value',
      path: ['stylesheet', index, 'style'],
      scopePath: ['stylesheet', index],
      value: style
    };
  }
  if (rules) {
    return {
      document: 'stylesheet',
      kind: 'insert-value',
      path: ['stylesheet'],
      value: { selector, style } satisfies StyleRule
    };
  }
  return {
    document: 'stylesheet',
    kind: 'upsert-value',
    path: ['stylesheet'],
    scopePath: [],
    value: [{ selector, style } satisfies StyleRule]
  };
}

export function canUseStudioFormatPainter(selection: AuthoringObjectSelection[]): boolean {
  return selection.length === 1 && targetForSelection(selection[0]) !== undefined;
}

export function planStudioFormatPainter(
  document: TopoDocument,
  stylesheet: Record<string, unknown> | undefined,
  sourceSelection: AuthoringObjectSelection,
  targetSelection: AuthoringObjectSelection
): StudioFormatPainterPlan {
  const sourceTarget = targetForSelection(sourceSelection);
  const target = targetForSelection(targetSelection);
  if (!sourceTarget || !target) throw new Error('Format Painter requires styleable topology objects.');
  if (sourceTarget.kind !== target.kind) throw new Error(`Format Painter cannot apply ${sourceTarget.kind} appearance to ${target.kind}.`);
  if (sourceTarget.id === target.id) throw new Error('Choose a different object to receive the copied format.');

  const sourceObject = findAuthoringObject(document, sourceSelection);
  const targetObject = findAuthoringObject(document, targetSelection);
  if (!sourceObject || !targetObject) throw new Error('Format Painter could not resolve the selected object.');

  const style = studioFormatPainterStyle(document, sourceSelection, targetSelection);

  return {
    additionalMutations: [stylesheetMutation(stylesheet, target, style)],
    plan: { insertions: [], removals: [], updates: [] }
  };
}

export function createStudioFormatPainterAction({
  candidate,
  executeEditPlan,
  refresh,
  session,
  setAnnouncement,
  setError
}: {
  candidate: StudioStylesheetCandidateController;
  executeEditPlan(id: string, label: string, plan: AuthoringEditPlan, selection?: StudioSelection[], additionalMutations?: StudioSourceMutation[]): boolean;
  refresh(): void;
  session: StudioDocumentSession;
  setAnnouncement(message: string): void;
  setError(message?: string): void;
}) {
  return (source: StudioSelection, object: TopoViewerObjectClick) => {
    try {
      const candidateState = candidate.getSnapshot();
      const visibleDocument = candidateState.latestValid.projection.document;
      const target = resolveAuthoringSelection(visibleDocument, object.id) as StudioSelection | undefined;
      if (!target) throw new Error('Format Painter could not resolve the target object.');
      if (candidateState.dirty) {
        const style = studioFormatPainterStyle(visibleDocument, source as AuthoringObjectSelection, target as AuthoringObjectSelection);
        const result = replaceCandidateStyleRule(candidateState.candidateText, { id: target.id, kind: target.kind as StyleTargetKind }, style);
        if (result.status === 'invalid') throw new Error(result.diagnostics.map((diagnostic) => diagnostic.message).join('; '));
        candidate.replaceStructuredText(result.status === 'normalization-required' ? result.after : result.text);
        session.setSelection([target]);
        setError(undefined);
        setAnnouncement(`Applied ${source.id} format to ${target.id} in the Style draft`);
        refresh();
        return true;
      }
      const format = planStudioFormatPainter(
        visibleDocument,
        session.sourceValue('stylesheet'),
        source as AuthoringObjectSelection,
        target as AuthoringObjectSelection
      );
      return executeEditPlan(`format-${source.kind}-${source.id}-to-${target.id}`, `Apply ${source.id} format to ${target.id}`, format.plan, [target], format.additionalMutations);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setError(message);
      setAnnouncement(`Format Painter: ${message}`);
      return false;
    }
  };
}
