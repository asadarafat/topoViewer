import { memo, useSyncExternalStore } from 'react';
import Box from '@mui/material/Box';
import type { StudioSessionSnapshot } from '../../contracts/project';
import type {
  StudioStyleEditRequest,
  StudioStyleUnsetRequest
} from '../../contracts/inspector';
import type { StudioStylesheetCandidateController } from '../../session';
import { BasicStyleEditor } from './BasicStyleEditor';
import { StyleCandidateFooter } from './StyleCandidateFooter';

interface StyleWorkspaceProps {
  candidate: StudioStylesheetCandidateController;
  onApply(): boolean;
  onCommit(request: StudioStyleEditRequest): boolean;
  onRevert(): boolean;
  onUnset(request: StudioStyleUnsetRequest): boolean;
  showFooter?: boolean;
  showSummary?: boolean;
  snapshot: StudioSessionSnapshot;
}

/**
 * Visual style controls only. Stylesheet source is owned by the shared source
 * workspace so a contextual drawer can never mount a second editor.
 */
export const StyleWorkspace = memo(function StyleWorkspace({
  candidate,
  onApply,
  onCommit,
  onRevert,
  onUnset,
  showFooter = true,
  showSummary = true,
  snapshot
}: StyleWorkspaceProps) {
  const state = useSyncExternalStore(
    candidate.subscribe,
    candidate.getSnapshot,
    candidate.getSnapshot
  );

  return (
    <Box
      aria-label="Style workspace"
      className="studio-style-workspace"
      component="section"
      data-mode="visual"
      sx={{ minWidth: 0 }}
    >
      <BasicStyleEditor
        candidate={state}
        onCommit={onCommit}
        onUnset={onUnset}
        showSummary={showSummary}
        snapshot={snapshot}
      />
      {showFooter ? (
        <StyleCandidateFooter
          candidate={candidate}
          onApply={onApply}
          onRevert={onRevert}
        />
      ) : null}
    </Box>
  );
});
