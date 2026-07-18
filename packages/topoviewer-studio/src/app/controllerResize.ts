import {
  authoringObjectDisplayName,
  planAuthoringResize,
  resolveAuthoringSelection,
  type AuthoringEditPlan,
  type TopoViewerNodeResizeChange
} from 'topoviewer/authoring';
import type { StudioCommand } from '../contracts/commands';
import type { StudioSelection } from '../contracts/project';
import {
  setCandidateStyleFieldForTargets,
  type StudioDocumentSession,
  type StudioStylesheetCandidateController
} from '../session';
import { planStudioSelectionResize } from './controllerAuthoring';
import { mutationsForAuthoringEditPlan } from './controllerUtils';

interface StudioResizeActionsOptions {
  candidate: StudioStylesheetCandidateController;
  execute(command: StudioCommand): boolean;
  executeEditPlan(id: string, label: string, plan: AuthoringEditPlan, selection?: StudioSelection[]): boolean;
  session: StudioDocumentSession;
  setAnnouncement(message: string): void;
  setError(message?: string): void;
}

function nodeResizeStylesheetText(
  candidate: StudioStylesheetCandidateController,
  id: string,
  size: { height: number; width: number }
): string {
  const snapshot = candidate.getSnapshot();
  if (snapshot.status === 'invalid-dirty') {
    throw new Error('Resolve the current Style draft diagnostics before resizing a node.');
  }
  let text = snapshot.candidateText;
  for (const [field, value] of Object.entries({
    height: Math.max(1, Math.round(size.height)),
    width: Math.max(1, Math.round(size.width))
  })) {
    const result = setCandidateStyleFieldForTargets(text, [{ id, kind: 'node' }], [field], value);
    if (result.status === 'invalid') throw new Error(result.diagnostics.map((diagnostic) => diagnostic.message).join('; '));
    if (result.status === 'normalization-required') throw new Error(result.reason);
    text = result.text;
  }
  return text;
}

export function createStudioResizeActions(options: StudioResizeActionsOptions) {
  function executeResize(selection: StudioSelection, label: string, plan: AuthoringEditPlan, appearance?: { height: number; width: number }) {
    if (selection.kind !== 'node' || !appearance) return options.executeEditPlan(`resize-${selection.id}`, label, plan, [selection]);
    try {
      const stylesheetText = nodeResizeStylesheetText(options.candidate, selection.id, appearance);
      const mutations = mutationsForAuthoringEditPlan(plan, (path) => Boolean(options.session.sourceRange('topology', path)));
      if (stylesheetText !== options.session.snapshot().project.documents.stylesheet.text) {
        mutations.push({ document: 'stylesheet', kind: 'replace-source', text: stylesheetText });
      }
      return options.execute({
        id: `resize-${selection.id}`,
        label,
        execute: () => ({ mutations, selection: [selection], summary: label })
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      options.setError(message);
      options.setAnnouncement(`Resize rejected: ${message}`);
      return false;
    }
  }

  return {
    resizeObject(change: TopoViewerNodeResizeChange) {
      const topology = options.session.snapshot().projection.document;
      const selection = resolveAuthoringSelection(topology, change.id);
      if (!selection) return false;
      return executeResize(
        selection as StudioSelection,
        `Resize ${authoringObjectDisplayName(topology, selection)}`,
        planAuthoringResize(topology, selection, change.position, change.size),
        selection.kind === 'node' ? change.size : undefined
      );
    },
    resizeSelection(delta: { width: number; height: number }) {
      const current = options.session.snapshot();
      if (current.selection.length !== 1) return false;
      const planned = planStudioSelectionResize(current.projection.document, current.selection[0], delta);
      return planned ? executeResize(planned.selection, planned.label, planned.plan, planned.appearance) : false;
    }
  };
}
