import { useCallback, useRef } from 'react';
import type { TopoViewerObjectClick } from 'topoviewer';
import { resolveAuthoringSelection, type TopoViewerSelectionChange } from 'topoviewer/authoring';
import type { StudioSelection, StudioSessionSnapshot } from '../../contracts/project';
import type { StudioDocumentSession } from '../../session';
import { describeStudioSelection } from './canvasAuthoring';
import { reconcileCanvasSelection, sameSelection, uniqueSelection } from './selection';

interface UseStudioCanvasSelectionOptions {
  session: StudioDocumentSession;
  setAnnouncement(message: string): void;
  setSnapshot(snapshot: StudioSessionSnapshot): void;
}

export function useStudioCanvasSelection({
  session,
  setAnnouncement,
  setSnapshot
}: UseStudioCanvasSelectionOptions) {
  const pendingSemanticSelection = useRef<StudioSelection[]>();

  const commitSelection = useCallback((selection: StudioSelection[]) => {
    const current = session.snapshot();
    if (sameSelection(current.selection, selection)) return;
    session.setSelection(selection);
    setAnnouncement(describeStudioSelection(current.projection.document, selection));
    setSnapshot(session.snapshot());
  }, [session, setAnnouncement, setSnapshot]);

  const setSelection = useCallback((selection: StudioSelection[]) => {
    pendingSemanticSelection.current = undefined;
    commitSelection(selection);
  }, [commitSelection]);

  const selectObject = useCallback((object: TopoViewerObjectClick) => {
    const current = session.snapshot();
    const selection = resolveAuthoringSelection(current.projection.document, object.id) as StudioSelection | undefined;
    if (!selection) return;
    const additive = object.modifiers?.ctrlKey || object.modifiers?.metaKey || object.modifiers?.shiftKey;
    const exists = current.selection.some((candidate) => candidate.id === selection.id && candidate.kind === selection.kind);
    const next = !additive
      ? [selection]
      : exists
        ? current.selection.filter((candidate) => candidate.id !== selection.id || candidate.kind !== selection.kind)
        : [...current.selection, selection];
    pendingSemanticSelection.current = next;
    commitSelection(next);
  }, [commitSelection, session]);

  const selectFromCanvas = useCallback((change: TopoViewerSelectionChange) => {
    const current = session.snapshot();
    const selection = uniqueSelection(
      change.objects.flatMap((object) => {
        const resolved = resolveAuthoringSelection(current.projection.document, object.id);
        return resolved ? [resolved as StudioSelection] : [];
      })
    );
    const reconciliation = reconcileCanvasSelection(selection, pendingSemanticSelection.current);
    pendingSemanticSelection.current = reconciliation.pendingSemanticSelection;
    if (!reconciliation.accepted || sameSelection(current.selection, reconciliation.selection)) return;
    session.setSelection(reconciliation.selection);
    setAnnouncement(describeStudioSelection(current.projection.document, reconciliation.selection));
    setSnapshot(session.snapshot());
  }, [session, setAnnouncement, setSnapshot]);

  return { selectFromCanvas, selectObject, setSelection };
}
