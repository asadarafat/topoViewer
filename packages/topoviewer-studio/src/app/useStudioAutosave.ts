import { useEffect, useRef, useState } from 'react';
import type { StudioHost, StudioHostError } from '../contracts/host';
import type { StudioSessionSnapshot } from '../contracts/project';
import { serializeStylesheetCandidateRecovery, type StudioStylesheetCandidateController } from '../session';

export function useStudioAutosave(host: StudioHost, snapshot: StudioSessionSnapshot, stylesheetCandidate?: StudioStylesheetCandidateController, delay = 750) {
  const lastRecovery = useRef('');
  const [error, setError] = useState<StudioHostError>();
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    function schedule() {
      if (timer !== undefined) clearTimeout(timer);
      const candidateRecovery = stylesheetCandidate ? serializeStylesheetCandidateRecovery(stylesheetCandidate.getSnapshot()) : undefined;
      if (snapshot.status !== 'modified' && snapshot.status !== 'invalid-draft' && !candidateRecovery) {
        setError(undefined);
        return;
      }
      const recoveryKey = `${snapshot.projection.sourceRevision}:${Object.values(snapshot.invalidDrafts)
        .map((draft) => draft?.text || '')
        .join('\u0000')}:${candidateRecovery?.candidateText || ''}`;
      if (recoveryKey === lastRecovery.current) return;
      timer = setTimeout(() => {
        const capturedAt = new Date().toISOString();
        void host
          .saveRecovery({
            capturedAt,
            invalidDrafts: structuredClone(snapshot.invalidDrafts),
            project: structuredClone(snapshot.project),
            reason: 'autosave',
            sourceRevision: snapshot.projection.sourceRevision,
            stylesheetCandidate: candidateRecovery
          })
          .then((saved) => {
            if (saved.ok) {
              lastRecovery.current = recoveryKey;
              setError(undefined);
              host.report({
                category: 'persistence',
                name: 'studio-recovery-saved'
              });
            } else {
              setError(saved.error);
              host.report({
                category: 'persistence',
                detail: {
                  code: saved.error.code,
                  retryable: saved.error.retryable
                },
                name: 'studio-recovery-failed'
              });
            }
          });
      }, delay);
    }
    schedule();
    const unsubscribe = stylesheetCandidate?.subscribe(schedule);
    return () => {
      if (timer !== undefined) clearTimeout(timer);
      unsubscribe?.();
    };
  }, [delay, host, retry, snapshot, stylesheetCandidate]);

  return { error, retry: () => setRetry((value) => value + 1) };
}
