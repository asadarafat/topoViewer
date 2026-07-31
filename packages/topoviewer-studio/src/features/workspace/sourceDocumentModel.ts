import type {
  StudioDiagnostic,
  StudioDocumentKind,
  StudioSelection,
  StudioSessionSnapshot
} from '../../contracts/project';
import type {
  StudioStylesheetCandidateState,
  StudioStylesheetCandidateStatus,
  StudioSourceDraftState,
  StudioYamlPath,
  StudioStylesheetTarget
} from '../../session';
import { candidateStyleRule } from '../../session';
import type { StudioSourceRange } from '../../session';
import { sourceRangeAtPath } from '../../session/yamlSource';

export interface StudioSourceDocumentModel {
  applyLabel: string;
  candidateStatus?: StudioStylesheetCandidateStatus;
  diagnostics: StudioDiagnostic[];
  dirty: boolean;
  exists: boolean;
  invalid: boolean;
  kind: StudioDocumentKind;
  label: string;
  optional: boolean;
  path: string;
  revertLabel: string;
  text: string;
}

const sourceOrder = ['topology', 'stylesheet', 'mapper'] as const;

const sourceLabels: Record<StudioDocumentKind, string> = {
  mapper: 'Mapper',
  stylesheet: 'Stylesheet',
  topology: 'Topology'
};

function diagnosticsFor(
  kind: StudioDocumentKind,
  snapshot: StudioSessionSnapshot
): StudioDiagnostic[] {
  return snapshot.projection.diagnostics.filter((diagnostic) => diagnostic.document === kind);
}

export function createStudioSourceDocumentModel(
  kind: StudioDocumentKind,
  snapshot: StudioSessionSnapshot,
  candidate: StudioStylesheetCandidateState,
  sourceDrafts?: StudioSourceDraftState
): StudioSourceDocumentModel {
  const document = snapshot.project.documents[kind];
  const invalidDraft = snapshot.invalidDrafts[kind];
  const sourceDraft = kind === 'stylesheet' ? undefined : sourceDrafts?.drafts[kind];
  const label = sourceLabels[kind];

  if (kind === 'stylesheet') {
    return {
      applyLabel: 'Apply stylesheet',
      candidateStatus: candidate.status,
      diagnostics: candidate.diagnostics,
      dirty: candidate.dirty,
      exists: true,
      invalid: candidate.status === 'invalid-dirty',
      kind,
      label,
      optional: false,
      path: document?.path || 'stylesheet.yaml',
      revertLabel: 'Revert stylesheet',
      text: candidate.candidateText
    };
  }

  return {
    applyLabel: `Apply ${kind}`,
    candidateStatus: undefined,
    diagnostics: invalidDraft?.diagnostics || diagnosticsFor(kind, snapshot),
    dirty: sourceDraft !== undefined || Boolean(invalidDraft),
    exists: Boolean(document),
    invalid: Boolean(invalidDraft),
    kind,
    label,
    optional: kind === 'mapper',
    path: document?.path || `${kind}.yaml`,
    revertLabel: sourceDraft !== undefined
      ? `Revert ${kind}`
      : invalidDraft
        ? 'Revert invalid draft'
        : `Revert ${kind}`,
    text: sourceDraft ?? invalidDraft?.text ?? document?.text ?? ''
  };
}

export function listStudioProjectSources(
  snapshot: StudioSessionSnapshot,
  candidate: StudioStylesheetCandidateState,
  sourceDrafts?: StudioSourceDraftState
): StudioSourceDocumentModel[] {
  return sourceOrder.map((kind) =>
    createStudioSourceDocumentModel(kind, snapshot, candidate, sourceDrafts)
  );
}

export function studioStylesheetTargetForSelection(
  selection: StudioSelection[]
): StudioStylesheetTarget | undefined {
  if (selection.length !== 1) return undefined;
  const target = selection[0];
  if (
    ![
      'node',
      'link',
      'linkDirection',
      'path',
      'region',
      'shape',
      'callout',
      'text'
    ].includes(target.kind)
  ) {
    return undefined;
  }
  return {
    id: target.id,
    kind: target.kind as StudioStylesheetTarget['kind']
  };
}

export function studioStylesheetCandidateRangeForSelection(
  candidate: StudioStylesheetCandidateState,
  selection: StudioSelection[]
): StudioSourceRange | undefined {
  const target = studioStylesheetTargetForSelection(selection);
  if (!target || !candidate.candidateSource || candidate.status === 'invalid-dirty') {
    return undefined;
  }
  const rule = candidateStyleRule(candidate.candidateText, target);
  return rule
    ? sourceRangeAtPath(candidate.candidateSource, rule.path)
    : undefined;
}

export function studioStylesheetCandidateRangeAtPath(
  candidate: StudioStylesheetCandidateState,
  path: StudioYamlPath
): StudioSourceRange | undefined {
  return candidate.candidateSource
    ? sourceRangeAtPath(candidate.candidateSource, path)
    : undefined;
}

export function studioDiagnosticSourceRange(
  diagnostic: StudioDiagnostic,
  text: string
): StudioSourceRange | undefined {
  if (!diagnostic.line || diagnostic.line < 1) return undefined;
  const lineStarts = [0];
  for (let index = 0; index < text.length; index += 1) {
    if (text[index] === '\n') lineStarts.push(index + 1);
  }
  const startLineIndex = diagnostic.line - 1;
  if (startLineIndex >= lineStarts.length) return undefined;
  const endLine = Math.max(diagnostic.line, diagnostic.endLine || diagnostic.line);
  const endLineIndex = Math.min(endLine - 1, lineStarts.length - 1);
  const lineEnd = (lineIndex: number) => {
    const next = lineStarts[lineIndex + 1];
    if (next === undefined) return text.length;
    return text[next - 2] === '\r' ? next - 2 : next - 1;
  };
  const startOffset = Math.min(
    lineEnd(startLineIndex),
    lineStarts[startLineIndex] + Math.max(0, (diagnostic.column || 1) - 1)
  );
  const endOffset = Math.max(
    startOffset,
    Math.min(
      lineEnd(endLineIndex),
      lineStarts[endLineIndex] +
        Math.max(0, (diagnostic.endColumn || diagnostic.column || 1) - 1)
    )
  );

  return {
    column: diagnostic.column || 1,
    endColumn: diagnostic.endColumn || diagnostic.column || 1,
    endLine,
    endOffset,
    line: diagnostic.line,
    startOffset
  };
}
