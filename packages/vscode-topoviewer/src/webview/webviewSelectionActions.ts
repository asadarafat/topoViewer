import { useCallback, type Dispatch, type SetStateAction } from 'react';
import type { TopoDocument, TopoViewerObjectClick } from 'topoviewer';
import {
  focusKindForSelection,
  resolveSelectionFromObject,
  sameSelection,
  type AttentionFocusKind,
  type TopoObjectSelection
} from '../shared/topologyMutations';
import type { HarnessMode } from './webviewAppSupport';

interface UseObjectSelectionActionsOptions {
  applyAttentionFocus: (ids?: string[], focusKind?: AttentionFocusKind) => void;
  mode: HarnessMode;
  setAttentionFocusId: Dispatch<SetStateAction<string>>;
  setAttentionFocusKind: Dispatch<SetStateAction<AttentionFocusKind>>;
  setMode: Dispatch<SetStateAction<HarnessMode>>;
  setSelectedObjects: Dispatch<SetStateAction<TopoObjectSelection[]>>;
  visibleDocument?: TopoDocument;
}

export function useObjectSelectionActions({
  applyAttentionFocus,
  mode,
  setAttentionFocusId,
  setAttentionFocusKind,
  setMode,
  setSelectedObjects,
  visibleDocument
}: UseObjectSelectionActionsOptions) {
  const selectObject = useCallback((selection: TopoObjectSelection, modifiers?: TopoViewerObjectClick['modifiers']) => {
    const additive = !!(modifiers?.ctrlKey || modifiers?.metaKey || modifiers?.shiftKey);
    setSelectedObjects((current) => {
      if (!additive) return [selection];
      return current.some((candidate) => sameSelection(candidate, selection))
        ? current.filter((candidate) => !sameSelection(candidate, selection))
        : [...current, selection];
    });
    if (mode !== 'attention') setMode('inspect');
  }, [mode, setMode, setSelectedObjects]);

  const handleObjectClick = useCallback((object: TopoViewerObjectClick) => {
    const selection = resolveSelectionFromObject(visibleDocument, object.id);
    if (!selection) return;
    selectObject(selection, object.modifiers);
    if (mode === 'attention') {
      const focusKind = focusKindForSelection(selection.kind);
      if (!focusKind) return;
      setAttentionFocusKind(focusKind);
      setAttentionFocusId(selection.id);
      applyAttentionFocus([selection.id], focusKind);
    }
  }, [
    applyAttentionFocus,
    mode,
    selectObject,
    setAttentionFocusId,
    setAttentionFocusKind,
    visibleDocument
  ]);

  return { handleObjectClick, selectObject };
}
