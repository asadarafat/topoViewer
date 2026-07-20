import { useCallback, useRef } from 'react';
import type { TopoViewerObjectClick } from 'topoviewer';
import { resolveAuthoringSelection, type TopoViewerSelectionChange } from 'topoviewer/authoring';
import type { StudioSelection, StudioSessionSnapshot } from '../contracts/project';
import type { StudioDocumentSession } from '../session';
import { describeStudioSelection } from './controllerAuthoring';
import { sameSelection, uniqueSelection } from './controllerUtils';

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
  const semanticSelectionGuard = useRef<{
    expiresAt: number;
    selection: StudioSelection[];
  }>();

  const setSelection = useCallback((selection: StudioSelection[]) => {
    const current = session.snapshot();
    if (sameSelection(current.selection, selection)) return;
    session.setSelection(selection);
    setAnnouncement(describeStudioSelection(current.projection.document, selection));
    setSnapshot(session.snapshot());
  }, [session, setAnnouncement, setSnapshot]);

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
    semanticSelectionGuard.current = {
      expiresAt: Date.now() + 1_000,
      selection: next
    };
    setSelection(next);
  }, [session, setSelection]);

  const selectFromCanvas = useCallback((change: TopoViewerSelectionChange) => {
    const current = session.snapshot();
    const selection = uniqueSelection(
      change.objects.flatMap((object) => {
        const resolved = resolveAuthoringSelection(current.projection.document, object.id);
        return resolved ? [resolved as StudioSelection] : [];
      })
    );
    const guard = semanticSelectionGuard.current;
    if (guard && Date.now() < guard.expiresAt) {
      if (sameSelection(selection, guard.selection)) {
        semanticSelectionGuard.current = undefined;
        if (!sameSelection(current.selection, guard.selection)) {
          session.setSelection(guard.selection);
          setSnapshot(session.snapshot());
        }
      }
      // React Flow can report an intermediate native selection before the
      // controlled semantic selection reaches its nodes and edges. Preserve
      // the semantic selection until React Flow acknowledges that exact set.
      return;
    }
    semanticSelectionGuard.current = undefined;
    if (sameSelection(current.selection, selection)) return;
    session.setSelection(selection);
    setAnnouncement(describeStudioSelection(current.projection.document, selection));
    setSnapshot(session.snapshot());
  }, [session, setAnnouncement, setSnapshot]);

  return { selectFromCanvas, selectObject, setSelection };
}
