import { useCallback, useMemo } from 'react';
import { StudioCommandExecutionError } from '../../commands';
import type { StudioCommand, StudioCommandDispatcher } from '../../contracts/commands';
import type { StudioRecoverySnapshot, StudioSessionSnapshot } from '../../contracts/project';
import type { StudioDocumentSession, StudioNormalizationReview } from '../../session';
import { createStudioStyleActions } from './styleRules';
import {
  createStudioCandidateStyleActions,
  stylesheetCandidateInitialization,
  synchronizeStylesheetCandidate,
  type StudioCandidatePolicy
} from './stylesheetCandidateActions';
import { useStudioStylesheetCandidate } from './useStudioStylesheetCandidate';

interface StudioStyleCapabilityOptions {
  announce(message: string): void;
  dispatcher: StudioCommandDispatcher;
  normalizationReview?: StudioNormalizationReview;
  normalizationReviewOwner: { current: 'candidate' | 'session' };
  recovery?: StudioRecoverySnapshot['stylesheetCandidate'];
  refresh(): void;
  session: StudioDocumentSession;
  setError(message?: string): void;
  setNormalizationReview(review?: StudioNormalizationReview): void;
}

export function useStudioStyleCapability({
  announce,
  dispatcher,
  normalizationReview,
  normalizationReviewOwner,
  recovery,
  refresh,
  session,
  setError,
  setNormalizationReview
}: StudioStyleCapabilityOptions) {
  const candidate = useStudioStylesheetCandidate(session, recovery);
  const execute = useCallback((command: StudioCommand, candidatePolicy: StudioCandidatePolicy = 'automatic') => {
    const before = session.snapshot();
    try {
      const result = dispatcher.dispatch(command);
      synchronizeStylesheetCandidate(session, candidate, before, session.snapshot(), candidatePolicy, result.mutations);
      setError(undefined);
      setNormalizationReview(undefined);
      announce(result.summary);
      refresh();
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (error instanceof StudioCommandExecutionError && error.review) {
        setNormalizationReview(error.review);
      }
      setError(message);
      announce(`Command failed: ${message}`);
      refresh();
      return false;
    }
  }, [announce, candidate, dispatcher, refresh, session, setError, setNormalizationReview]);

  const ruleActions = useMemo(() => createStudioStyleActions({ execute, session }), [execute, session]);
  const candidateActions = useMemo(() => createStudioCandidateStyleActions({
    announce,
    candidate,
    execute,
    normalizationReview,
    normalizationReviewOwner,
    refresh,
    session,
    setError,
    setNormalizationReview
  }), [
    announce,
    candidate,
    execute,
    normalizationReview,
    normalizationReviewOwner,
    refresh,
    session,
    setError,
    setNormalizationReview
  ]);

  return {
    actions: { ...candidateActions, ...ruleActions },
    candidate,
    execute,
    rebaseAfterObjectDeletion(candidateText: string) {
      candidate.rebase(stylesheetCandidateInitialization(session));
      if (candidateText !== session.snapshot().project.documents.stylesheet.text) {
        candidate.replaceStructuredText(candidateText);
      }
    },
    synchronizeAfterHistory(before: StudioSessionSnapshot, after: StudioSessionSnapshot) {
      synchronizeStylesheetCandidate(session, candidate, before, after);
    }
  };
}
