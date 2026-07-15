import type { StyleTargetKind } from 'topoviewer';
import type { StudioCommand } from '../contracts/commands';
import type { StudioStyleEditRequest, StudioStyleUnsetRequest } from '../contracts/inspector';
import {
  createStudioDocumentSession,
  migrateInlineStylesToCandidate,
  setCandidateStyleFieldForTargets,
  unsetCandidateStyleField,
  type StudioDocumentSession,
  type StudioNormalizationReview,
  type StudioStylesheetCandidateController,
  type StudioStylesheetTarget
} from '../session';

export type StudioCandidatePolicy = 'automatic' | 'rebase';

interface NormalizationReviewOwner {
  current: 'candidate' | 'session';
}

interface CandidateActionOptions {
  announce(message: string): void;
  candidate: StudioStylesheetCandidateController;
  execute(command: StudioCommand, policy?: StudioCandidatePolicy): boolean;
  normalizationReview?: StudioNormalizationReview;
  normalizationReviewOwner: NormalizationReviewOwner;
  refresh(): void;
  session: StudioDocumentSession;
  setError(message?: string): void;
  setNormalizationReview(review?: StudioNormalizationReview): void;
}

function candidateStyleTargets(session: StudioDocumentSession): StudioStylesheetTarget[] {
  const supported = new Set<StyleTargetKind>([
    'node', 'link', 'linkDirection', 'path', 'region', 'shape', 'callout', 'text'
  ]);
  return session.snapshot().selection.flatMap((selection) => (
    supported.has(selection.kind as StyleTargetKind)
      ? [{ id: selection.id, kind: selection.kind as StyleTargetKind }]
      : []
  ));
}

function candidateNormalizationReview(
  before: string,
  after: string,
  reason: string,
  path: Array<string | number>,
  owner: NormalizationReviewOwner
): StudioNormalizationReview {
  const beforeLines = before.split(/\r?\n/);
  const afterLines = after.split(/\r?\n/);
  let prefix = 0;
  while (prefix < beforeLines.length && prefix < afterLines.length && beforeLines[prefix] === afterLines[prefix]) {
    prefix += 1;
  }
  owner.current = 'candidate';
  return {
    after,
    before,
    diff: { afterLines: afterLines.slice(prefix), beforeLines: beforeLines.slice(prefix), startLine: prefix + 1 },
    document: 'stylesheet',
    id: `candidate-normalization-${Date.now()}`,
    path,
    reason
  };
}

export function stylesheetCandidateContext(session: StudioDocumentSession) {
  const current = session.snapshot();
  return {
    appliedProjection: current.projection,
    mapperSource: session.parsedSource('mapper'),
    mapperText: current.project.documents.mapper?.text,
    stylesheetSource: session.parsedSource('stylesheet'),
    topologySource: session.parsedSource('topology'),
    topologyText: current.project.documents.topology.text
  };
}

export function stylesheetCandidateInitialization(session: StudioDocumentSession) {
  const current = session.snapshot();
  return {
    ...stylesheetCandidateContext(session),
    appliedSourceRevision: current.projection.sourceRevision,
    appliedStylesheetText: current.project.documents.stylesheet.text
  };
}

export function synchronizeStylesheetCandidate(
  session: StudioDocumentSession,
  candidate: StudioStylesheetCandidateController,
  before: ReturnType<StudioDocumentSession['snapshot']>,
  after: ReturnType<StudioDocumentSession['snapshot']>,
  policy: StudioCandidatePolicy = 'automatic'
) {
  const stylesheetChanged = before.project.documents.stylesheet.text !== after.project.documents.stylesheet.text;
  const contextChanged = before.project.documents.topology.text !== after.project.documents.topology.text
    || before.project.documents.mapper?.text !== after.project.documents.mapper?.text;
  if (stylesheetChanged) {
    if (policy === 'rebase' || !candidate.getSnapshot().dirty) {
      candidate.rebase(stylesheetCandidateInitialization(session));
    } else if (contextChanged) {
      candidate.updateContext(stylesheetCandidateContext(session));
    }
    return;
  }
  if (contextChanged) candidate.updateContext(stylesheetCandidateContext(session));
}

export function createStudioCandidateStyleActions({
  announce,
  candidate,
  execute,
  normalizationReview,
  normalizationReviewOwner,
  refresh,
  session,
  setError,
  setNormalizationReview
}: CandidateActionOptions) {
  function commitCandidateStyle(request: StudioStyleEditRequest) {
    const result = setCandidateStyleFieldForTargets(
      candidate.getSnapshot().candidateText,
      candidateStyleTargets(session),
      request.fieldPath,
      request.value
    );
    if (result.status === 'applied') {
      candidate.replaceStructuredText(result.text);
      setError(undefined);
      announce(`Updated ${request.fieldPath.join('.')} in Style draft`);
      return true;
    }
    if (result.status === 'unchanged') return true;
    if (result.status === 'normalization-required') {
      setNormalizationReview(candidateNormalizationReview(
        result.before,
        result.after,
        result.reason,
        request.fieldPath,
        normalizationReviewOwner
      ));
      setError(result.reason);
      announce('Style edit requires normalization review');
      return false;
    }
    const message = result.diagnostics.map((diagnostic) => diagnostic.message).join('; ');
    setError(message);
    announce(`Style edit rejected: ${message}`);
    return false;
  }

  function unsetCandidateStyle(request: StudioStyleUnsetRequest) {
    let text = candidate.getSnapshot().candidateText;
    for (const target of candidateStyleTargets(session)) {
      const result = unsetCandidateStyleField(text, target, request.fieldPath);
      if (result.status === 'unchanged') continue;
      if (result.status === 'applied') {
        text = result.text;
        continue;
      }
      if (result.status === 'normalization-required') {
        setNormalizationReview(candidateNormalizationReview(
          result.before,
          result.after,
          result.reason,
          request.fieldPath,
          normalizationReviewOwner
        ));
        setError(result.reason);
        announce('Style reset requires normalization review');
        return false;
      }
      const message = result.diagnostics.map((diagnostic) => diagnostic.message).join('; ');
      setError(message);
      announce(`Style reset rejected: ${message}`);
      return false;
    }
    if (text !== candidate.getSnapshot().candidateText) {
      candidate.replaceStructuredText(text);
      announce(`Reset ${request.fieldPath.join('.')} in Style draft`);
    }
    setError(undefined);
    return true;
  }

  function migrateInlineCandidateStyle(fieldPaths: Array<Array<string | number>>) {
    const target = candidateStyleTargets(session)[0];
    const current = session.snapshot();
    if (!target || current.selection.length !== 1) return false;
    const migration = migrateInlineStylesToCandidate({
      fieldPaths,
      stylesheetText: candidate.getSnapshot().candidateText,
      target,
      topologyText: current.project.documents.topology.text
    });
    if (migration.status === 'unchanged') return true;
    if (migration.status === 'normalization-required') {
      setError(migration.reason);
      announce('Inline style migration requires source normalization');
      return false;
    }
    if (migration.status === 'invalid') {
      const message = migration.diagnostics.map((diagnostic) => diagnostic.message).join('; ');
      setError(message);
      announce(`Inline style migration rejected: ${message}`);
      return false;
    }
    const applied = execute({
      id: `migrate-inline-style-${target.kind}-${target.id}`,
      label: `Move ${target.id} inline style to stylesheet`,
      execute: () => ({
        mutations: [
          { document: 'topology', kind: 'replace-source', text: migration.topologyText },
          { document: 'stylesheet', kind: 'replace-source', text: migration.stylesheetText }
        ],
        selection: current.selection,
        summary: `Moved ${target.id} inline style to stylesheet`
      })
    }, 'rebase');
    if (applied) {
      setError(undefined);
      announce(`Moved ${target.id} inline style to stylesheet`);
    }
    return applied;
  }

  function applyStylesheetCandidate() {
    const snapshot = candidate.getSnapshot();
    if (!snapshot.dirty) return true;
    if (snapshot.status !== 'valid-dirty') {
      setError('Resolve the stylesheet diagnostics before applying this Style draft.');
      announce('Style draft cannot be applied because it is invalid');
      return false;
    }
    const applied = execute({
      id: 'apply-stylesheet-candidate',
      label: 'Apply Style draft',
      execute: () => ({
        mutations: [{ document: 'stylesheet', kind: 'replace-source', text: snapshot.candidateText }],
        summary: 'Applied Style draft'
      })
    }, 'rebase');
    if (applied) {
      setError(undefined);
      announce('Style draft applied to stylesheet.yaml');
    }
    return applied;
  }

  function applySourceDraft(document: 'topology' | 'stylesheet' | 'mapper', text: string) {
    if (document === 'stylesheet') {
      candidate.replaceStructuredText(text);
      const snapshot = candidate.getSnapshot();
      if (snapshot.status === 'invalid-dirty') {
        setError(snapshot.diagnostics.map((diagnostic) => diagnostic.message).join('; '));
        announce(`stylesheet YAML contains ${snapshot.diagnostics.length} diagnostic${snapshot.diagnostics.length === 1 ? '' : 's'}`);
        return false;
      }
      return applyStylesheetCandidate();
    }
    const source = session.snapshot().project.documents[document];
    if (!source || source.text === text) return false;
    const validation = createStudioDocumentSession(session.snapshot().project).replaceDraft(document, text);
    if (validation.status === 'invalid') {
      session.replaceDraft(document, text);
      setError(validation.diagnostics.map((diagnostic) => diagnostic.message).join('; '));
      announce(`${document} YAML contains ${validation.diagnostics.length} diagnostic${validation.diagnostics.length === 1 ? '' : 's'}`);
      refresh();
      return false;
    }
    session.discardInvalidDraft(document);
    return execute({
      id: `apply-${document}-source`,
      label: `Apply ${document} YAML`,
      execute: () => ({
        mutations: [{ document, kind: 'replace-source', text }],
        summary: `Applied ${document} YAML`
      })
    });
  }

  function revertStylesheetCandidate() {
    if (!candidate.getSnapshot().dirty) return false;
    candidate.revert();
    setError(undefined);
    announce('Style draft reverted');
    return true;
  }

  function confirmNormalizationReview() {
    if (!normalizationReview) return false;
    if (normalizationReviewOwner.current === 'candidate') {
      candidate.replaceStructuredText(normalizationReview.after);
      setNormalizationReview(undefined);
      setError(undefined);
      announce('Confirmed Style draft normalization');
      normalizationReviewOwner.current = 'session';
      return true;
    }
    const applied = execute({
      id: `confirm-${normalizationReview.id}`,
      label: `Confirm ${normalizationReview.document} normalization`,
      execute: () => ({
        mutations: [{
          document: normalizationReview.document,
          kind: 'replace-source',
          text: normalizationReview.after
        }],
        summary: `Confirmed ${normalizationReview.document} normalization`
      })
    });
    if (applied) setNormalizationReview(undefined);
    return applied;
  }

  function cancelNormalizationReview() {
    setNormalizationReview(undefined);
    setError(undefined);
    announce('Normalization review cancelled');
    normalizationReviewOwner.current = 'session';
  }

  return {
    applySourceDraft,
    applyStylesheetCandidate,
    cancelNormalizationReview,
    commitCandidateStyle,
    confirmNormalizationReview,
    migrateInlineCandidateStyle,
    replaceStylesheetCandidateRaw: (text: string) => candidate.replaceRawText(text),
    replaceStylesheetCandidateStructured: (text: string) => candidate.replaceStructuredText(text),
    revertStylesheetCandidate,
    unsetCandidateStyle
  };
}
