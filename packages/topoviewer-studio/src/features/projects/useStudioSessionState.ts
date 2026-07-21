import { useCallback, useMemo, useRef, useState } from 'react';
import { createStudioCommandDispatcher } from '../../commands';
import type { StudioProject, StudioRecoverySnapshot } from '../../contracts/project';
import { createStudioDocumentSession, type StudioNormalizationReview } from '../../session';

export function useStudioSessionState(project: StudioProject, recovery?: StudioRecoverySnapshot) {
  const session = useMemo(() => {
    const next = createStudioDocumentSession(project);
    const invalidDrafts = Object.values(recovery?.invalidDrafts || {}).filter(Boolean);
    if (invalidDrafts.length) {
      invalidDrafts.forEach((draft) => {
        if (draft) next.replaceDraft(draft.document, draft.text);
      });
    } else if (recovery) {
      next.setStatus('recovery');
    }
    return next;
  }, [project, recovery]);
  const dispatcher = useMemo(() => createStudioCommandDispatcher(session), [session]);
  const [snapshot, setSnapshot] = useState(session.snapshot());
  const [commandError, setCommandError] = useState<string>();
  const [announcement, setAnnouncement] = useState('Studio ready');
  const [normalizationReview, setNormalizationReview] = useState<StudioNormalizationReview>();
  const normalizationReviewOwner = useRef<'candidate' | 'session'>('session');
  const refresh = useCallback(() => setSnapshot(session.snapshot()), [session]);

  return {
    announcement,
    commandError,
    dispatcher,
    normalizationReview,
    normalizationReviewOwner,
    refresh,
    session,
    setAnnouncement,
    setCommandError,
    setNormalizationReview,
    setSnapshot,
    snapshot
  };
}
