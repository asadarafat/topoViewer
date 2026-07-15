import { useEffect, useMemo, useRef } from 'react';
import type { StudioRecoverySnapshot } from '../contracts/project';
import {
  createStylesheetCandidateController,
  defaultStructuredCandidateDelayMs,
  type StudioDocumentSession
} from '../session';
import { stylesheetCandidateInitialization } from './controllerStylesheetCandidate';

export function useStudioStylesheetCandidate(
  session: StudioDocumentSession,
  recovery: StudioRecoverySnapshot['stylesheetCandidate']
) {
  const candidate = useMemo(() => createStylesheetCandidateController({
    ...stylesheetCandidateInitialization(session),
    recovery,
    structuredEvaluationDelayMs: defaultStructuredCandidateDelayMs
  }), [recovery, session]);
  const lifecycleGeneration = useRef(0);
  const currentCandidate = useRef(candidate);
  currentCandidate.current = candidate;

  useEffect(() => {
    const generation = ++lifecycleGeneration.current;
    return () => {
      queueMicrotask(() => {
        if (currentCandidate.current !== candidate || lifecycleGeneration.current === generation) {
          candidate.dispose();
        }
      });
    };
  }, [candidate]);

  return candidate;
}
