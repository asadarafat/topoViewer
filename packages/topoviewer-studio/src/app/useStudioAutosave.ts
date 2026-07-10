import { useEffect, useRef, useState } from 'react';
import type { StudioHost, StudioHostError } from '../contracts/host';
import type { StudioSessionSnapshot } from '../contracts/project';

export function useStudioAutosave(host: StudioHost, snapshot: StudioSessionSnapshot, delay = 750) {
  const lastRecovery = useRef('');
  const [error, setError] = useState<StudioHostError>();
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (snapshot.status !== 'modified' && snapshot.status !== 'invalid-draft') {
      setError(undefined);
      return;
    }
    const recoveryKey = `${snapshot.projection.sourceRevision}:${Object.values(snapshot.invalidDrafts)
      .map((draft) => draft?.text || '')
      .join('\u0000')}`;
    if (recoveryKey === lastRecovery.current) return;
    const timer = setTimeout(() => {
      const capturedAt = new Date().toISOString();
      void host.saveRecovery({
        capturedAt,
        invalidDrafts: structuredClone(snapshot.invalidDrafts),
        project: structuredClone(snapshot.project),
        reason: 'autosave',
        sourceRevision: snapshot.projection.sourceRevision
      }).then((saved) => {
        if (saved.ok) {
          lastRecovery.current = recoveryKey;
          setError(undefined);
          host.report({ category: 'persistence', name: 'studio-recovery-saved' });
        } else {
          setError(saved.error);
          host.report({
            category: 'persistence',
            detail: { code: saved.error.code, retryable: saved.error.retryable },
            name: 'studio-recovery-failed'
          });
        }
      });
    }, delay);
    return () => clearTimeout(timer);
  }, [delay, host, retry, snapshot]);

  return { error, retry: () => setRetry((value) => value + 1) };
}
