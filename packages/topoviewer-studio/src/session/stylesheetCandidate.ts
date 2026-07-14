import type { StudioDiagnostic, StudioValidProjection } from '../contracts/project';
import { stableTextHash } from './hash';
import { buildProjection } from './projection';
import { parseStudioSource, type ParsedStudioSource } from './yamlSource';

export type StudioStylesheetCandidateMode = 'basic' | 'yaml';
export type StudioStylesheetCandidateStatus = 'clean' | 'validating' | 'valid-dirty' | 'invalid-dirty';
export const defaultStylesheetCandidateDebounceMs = 250;

export interface StudioStylesheetCandidateContext {
  mapperText?: string;
  topologyText: string;
}

export interface StudioStylesheetCandidateInitialization extends StudioStylesheetCandidateContext {
  appliedSourceRevision: string;
  appliedStylesheetText: string;
  mode?: StudioStylesheetCandidateMode;
}

export interface StudioStylesheetCandidatePreview {
  projection: StudioValidProjection;
  source: ParsedStudioSource;
  text: string;
}

export interface StudioStylesheetCandidateState {
  appliedPreview: StudioStylesheetCandidatePreview;
  appliedSourceRevision: string;
  appliedText: string;
  candidateSource?: ParsedStudioSource;
  candidateText: string;
  diagnostics: StudioDiagnostic[];
  dirty: boolean;
  generation: number;
  latestValid: StudioStylesheetCandidatePreview;
  mode: StudioStylesheetCandidateMode;
  status: StudioStylesheetCandidateStatus;
  validatedGeneration: number;
}

export type StudioStylesheetCandidateEvaluation =
  | { diagnostics: StudioDiagnostic[]; ok: false; source?: ParsedStudioSource }
  | { diagnostics: StudioDiagnostic[]; ok: true; preview: StudioStylesheetCandidatePreview };

export interface StudioStylesheetCandidateRecovery {
  appliedSourceRevision: string;
  candidateText: string;
  capturedAt: string;
  mode: StudioStylesheetCandidateMode;
}

export interface StudioStylesheetCandidateController {
  dispose(): void;
  getSnapshot(): StudioStylesheetCandidateState;
  rebase(initialization: StudioStylesheetCandidateInitialization): void;
  replaceRawText(candidateText: string): void;
  replaceStructuredText(candidateText: string): void;
  revert(): void;
  setMode(mode: StudioStylesheetCandidateMode): void;
  subscribe(listener: () => void): () => void;
}

export interface StudioStylesheetCandidateControllerOptions extends StudioStylesheetCandidateInitialization {
  debounceMs?: number;
  evaluate?: (
    context: StudioStylesheetCandidateContext,
    stylesheetText: string
  ) => Promise<StudioStylesheetCandidateEvaluation> | StudioStylesheetCandidateEvaluation;
}

function candidateSourceRevision(context: StudioStylesheetCandidateContext, stylesheetText: string): string {
  return `candidate-${stableTextHash([
    context.topologyText,
    stylesheetText,
    context.mapperText || ''
  ].join('\u0000'))}`;
}

export function evaluateStylesheetCandidate(
  context: StudioStylesheetCandidateContext,
  stylesheetText: string
): StudioStylesheetCandidateEvaluation {
  const parsed = parseStudioSource('stylesheet', stylesheetText);
  if (!parsed.ok) return { diagnostics: parsed.diagnostics, ok: false };

  const result = buildProjection({
    mapper: context.mapperText,
    stylesheet: stylesheetText,
    topology: context.topologyText
  }, { stylesheet: parsed.source });
  if (!result.ok) return { diagnostics: result.diagnostics, ok: false, source: parsed.source };

  return {
    diagnostics: result.diagnostics,
    ok: true,
    preview: {
      projection: {
        diagnostics: result.diagnostics,
        document: result.document,
        sourceRevision: candidateSourceRevision(context, stylesheetText)
      },
      source: result.sources.stylesheet,
      text: stylesheetText
    }
  };
}

function requireValidAppliedCandidate(
  initialization: StudioStylesheetCandidateInitialization
): StudioStylesheetCandidatePreview {
  const evaluation = evaluateStylesheetCandidate(initialization, initialization.appliedStylesheetText);
  if (!evaluation.ok) {
    const message = evaluation.diagnostics.map((diagnostic) => diagnostic.message).join('; ');
    throw new Error(`Applied stylesheet must produce a valid Studio projection: ${message}`);
  }
  return evaluation.preview;
}

export function createStylesheetCandidateState(
  initialization: StudioStylesheetCandidateInitialization
): StudioStylesheetCandidateState {
  const appliedPreview = requireValidAppliedCandidate(initialization);
  return {
    appliedPreview,
    appliedSourceRevision: initialization.appliedSourceRevision,
    appliedText: initialization.appliedStylesheetText,
    candidateSource: appliedPreview.source,
    candidateText: initialization.appliedStylesheetText,
    diagnostics: appliedPreview.projection.diagnostics,
    dirty: false,
    generation: 0,
    latestValid: appliedPreview,
    mode: initialization.mode || 'basic',
    status: 'clean',
    validatedGeneration: 0
  };
}

export function beginStylesheetCandidateValidation(
  state: StudioStylesheetCandidateState,
  candidateText: string
): { generation: number; state: StudioStylesheetCandidateState } {
  const generation = state.generation + 1;
  return {
    generation,
    state: {
      ...state,
      candidateText,
      dirty: candidateText !== state.appliedText,
      generation,
      status: 'validating'
    }
  };
}

export function resolveStylesheetCandidateValidation(
  state: StudioStylesheetCandidateState,
  generation: number,
  evaluation: StudioStylesheetCandidateEvaluation
): StudioStylesheetCandidateState {
  if (generation !== state.generation) return state;
  const dirty = state.candidateText !== state.appliedText;
  if (!evaluation.ok) {
    return {
      ...state,
      candidateSource: evaluation.source,
      diagnostics: evaluation.diagnostics,
      dirty,
      status: 'invalid-dirty',
      validatedGeneration: generation
    };
  }
  return {
    ...state,
    candidateSource: evaluation.preview.source,
    diagnostics: evaluation.diagnostics,
    dirty,
    latestValid: evaluation.preview,
    status: dirty ? 'valid-dirty' : 'clean',
    validatedGeneration: generation
  };
}

export function replaceStylesheetCandidateImmediately(
  state: StudioStylesheetCandidateState,
  context: StudioStylesheetCandidateContext,
  candidateText: string
): StudioStylesheetCandidateState {
  const pending = beginStylesheetCandidateValidation(state, candidateText);
  return resolveStylesheetCandidateValidation(
    pending.state,
    pending.generation,
    evaluateStylesheetCandidate(context, candidateText)
  );
}

export function revertStylesheetCandidate(
  state: StudioStylesheetCandidateState
): StudioStylesheetCandidateState {
  const generation = state.generation + 1;
  return {
    ...state,
    candidateSource: state.appliedPreview.source,
    candidateText: state.appliedText,
    diagnostics: state.appliedPreview.projection.diagnostics,
    dirty: false,
    generation,
    latestValid: state.appliedPreview,
    status: 'clean',
    validatedGeneration: generation
  };
}

export function rebaseStylesheetCandidate(
  state: StudioStylesheetCandidateState,
  initialization: StudioStylesheetCandidateInitialization
): StudioStylesheetCandidateState {
  return createStylesheetCandidateState({ ...initialization, mode: state.mode });
}

export function setStylesheetCandidateMode(
  state: StudioStylesheetCandidateState,
  mode: StudioStylesheetCandidateMode
): StudioStylesheetCandidateState {
  return mode === state.mode ? state : { ...state, mode };
}

export function serializeStylesheetCandidateRecovery(
  state: StudioStylesheetCandidateState,
  capturedAt = new Date().toISOString()
): StudioStylesheetCandidateRecovery | undefined {
  if (!state.dirty) return undefined;
  return {
    appliedSourceRevision: state.appliedSourceRevision,
    candidateText: state.candidateText,
    capturedAt,
    mode: state.mode
  };
}

export function restoreStylesheetCandidateRecovery(
  initialization: StudioStylesheetCandidateInitialization & { recovery: StudioStylesheetCandidateRecovery }
): StudioStylesheetCandidateState {
  const initial = createStylesheetCandidateState({
    ...initialization,
    mode: initialization.recovery.mode
  });
  return replaceStylesheetCandidateImmediately(initial, initialization, initialization.recovery.candidateText);
}

function evaluatorFailure(error: unknown): StudioStylesheetCandidateEvaluation {
  return {
    diagnostics: [{
      code: 'stylesheet-candidate-evaluation-failed',
      document: 'stylesheet',
      message: error instanceof Error ? error.message : String(error),
      severity: 'error'
    }],
    ok: false
  };
}

export function createStylesheetCandidateController(
  options: StudioStylesheetCandidateControllerOptions
): StudioStylesheetCandidateController {
  let context: StudioStylesheetCandidateContext = {
    mapperText: options.mapperText,
    topologyText: options.topologyText
  };
  let state = createStylesheetCandidateState(options);
  let timer: ReturnType<typeof setTimeout> | undefined;
  let disposed = false;
  const listeners = new Set<() => void>();
  const debounceMs = options.debounceMs ?? defaultStylesheetCandidateDebounceMs;
  const evaluator = options.evaluate || evaluateStylesheetCandidate;

  function emit() {
    if (disposed) return;
    for (const listener of listeners) listener();
  }

  function clearPending() {
    if (timer === undefined) return;
    clearTimeout(timer);
    timer = undefined;
  }

  function settle(generation: number, evaluation: StudioStylesheetCandidateEvaluation) {
    if (disposed) return;
    const next = resolveStylesheetCandidateValidation(state, generation, evaluation);
    if (next === state) return;
    state = next;
    emit();
  }

  function evaluateGeneration(generation: number, text: string) {
    try {
      const result = evaluator(context, text);
      if (result && typeof (result as Promise<StudioStylesheetCandidateEvaluation>).then === 'function') {
        void Promise.resolve(result).then(
          (evaluation) => settle(generation, evaluation),
          (error) => settle(generation, evaluatorFailure(error))
        );
      } else {
        settle(generation, result as StudioStylesheetCandidateEvaluation);
      }
    } catch (error) {
      settle(generation, evaluatorFailure(error));
    }
  }

  function begin(candidateText: string) {
    clearPending();
    const pending = beginStylesheetCandidateValidation(state, candidateText);
    state = pending.state;
    emit();
    return pending.generation;
  }

  return {
    dispose() {
      if (disposed) return;
      disposed = true;
      clearPending();
      listeners.clear();
    },
    getSnapshot() {
      return state;
    },
    rebase(initialization) {
      clearPending();
      context = { mapperText: initialization.mapperText, topologyText: initialization.topologyText };
      state = rebaseStylesheetCandidate(state, initialization);
      emit();
    },
    replaceRawText(candidateText) {
      const generation = begin(candidateText);
      timer = setTimeout(() => {
        timer = undefined;
        evaluateGeneration(generation, candidateText);
      }, debounceMs);
    },
    replaceStructuredText(candidateText) {
      const generation = begin(candidateText);
      evaluateGeneration(generation, candidateText);
    },
    revert() {
      clearPending();
      state = revertStylesheetCandidate(state);
      emit();
    },
    setMode(mode) {
      const next = setStylesheetCandidateMode(state, mode);
      if (next === state) return;
      state = next;
      emit();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }
  };
}
