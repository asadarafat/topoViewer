import type { StudioDiagnostic, StudioStylesheetCandidateRecovery, StudioValidProjection } from '../contracts/project';
import { stableTextHash } from './hash';
import { buildProjection, type ParsedSources } from './projection';
import type { ParsedStudioSource } from './types';
import { parseStudioSource } from './yamlSource';

export type StudioStylesheetCandidateMode = 'basic' | 'yaml';
export type StudioStylesheetCandidateStatus = 'clean' | 'validating' | 'valid-dirty' | 'invalid-dirty';
export const defaultStylesheetCandidateDebounceMs = 250;
export const defaultStructuredCandidateDelayMs = 32;

export interface StudioStylesheetCandidateContext {
  appliedProjection?: StudioValidProjection;
  mapperSource?: ParsedStudioSource;
  mapperText?: string;
  stylesheetSource?: ParsedStudioSource;
  topologySource?: ParsedStudioSource;
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
  | {
      diagnostics: StudioDiagnostic[];
      ok: true;
      preview: StudioStylesheetCandidatePreview;
    };

export interface StudioStylesheetCandidateController {
  acceptAppliedRevision(appliedSourceRevision: string): void;
  dispose(): void;
  getSnapshot(): StudioStylesheetCandidateState;
  rebase(initialization: StudioStylesheetCandidateInitialization): void;
  reconcileApplied(initialization: StudioStylesheetCandidateInitialization, candidateText: string): void;
  replaceRawText(candidateText: string): void;
  replaceStructuredText(candidateText: string): void;
  revert(): void;
  setMode(mode: StudioStylesheetCandidateMode): void;
  subscribe(listener: () => void): () => void;
  updateContext(context: StudioStylesheetCandidateContext, options?: { deferProjection?: boolean }): void;
}

export interface StudioStylesheetCandidateControllerOptions extends StudioStylesheetCandidateInitialization {
  debounceMs?: number;
  evaluate?: (context: StudioStylesheetCandidateContext, stylesheetText: string) => Promise<StudioStylesheetCandidateEvaluation> | StudioStylesheetCandidateEvaluation;
  recovery?: StudioStylesheetCandidateRecovery;
  structuredEvaluationDelayMs?: number;
}

type ReusableCandidateSources = Partial<Pick<ParsedSources, 'mapper' | 'topology'>>;

function candidateSourceRevision(context: StudioStylesheetCandidateContext, stylesheetText: string): string {
  return `candidate-${stableTextHash([context.topologyText, stylesheetText, context.mapperText || ''].join('\u0000'))}`;
}

export function evaluateStylesheetCandidate(context: StudioStylesheetCandidateContext, stylesheetText: string, reusableSources: ReusableCandidateSources = {}): StudioStylesheetCandidateEvaluation {
  const parsed = parseStudioSource('stylesheet', stylesheetText);
  if (!parsed.ok) return { diagnostics: parsed.diagnostics, ok: false };

  const result = buildProjection(
    {
      mapper: context.mapperText,
      stylesheet: stylesheetText,
      topology: context.topologyText
    },
    { ...reusableSources, stylesheet: parsed.source }
  );
  if (!result.ok)
    return {
      diagnostics: result.diagnostics,
      ok: false,
      source: parsed.source
    };

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

function reusableCandidateSources(context: StudioStylesheetCandidateContext): ReusableCandidateSources {
  const sources: ReusableCandidateSources = {};
  if (context.topologySource?.text === context.topologyText) {
    sources.topology = context.topologySource;
  } else {
    const topology = parseStudioSource('topology', context.topologyText);
    if (topology.ok) sources.topology = topology.source;
  }
  if (context.mapperText !== undefined) {
    if (context.mapperSource?.text === context.mapperText) {
      sources.mapper = context.mapperSource;
    } else {
      const mapper = parseStudioSource('mapper', context.mapperText);
      if (mapper.ok) sources.mapper = mapper.source;
    }
  }
  return sources;
}

function requireValidAppliedCandidate(initialization: StudioStylesheetCandidateInitialization, evaluate: typeof evaluateStylesheetCandidate = evaluateStylesheetCandidate): StudioStylesheetCandidatePreview {
  if (initialization.appliedProjection && initialization.stylesheetSource?.text === initialization.appliedStylesheetText) {
    return {
      projection: initialization.appliedProjection,
      source: initialization.stylesheetSource,
      text: initialization.appliedStylesheetText
    };
  }
  const evaluation = evaluate(initialization, initialization.appliedStylesheetText);
  if (!evaluation.ok) {
    const message = evaluation.diagnostics.map((diagnostic) => diagnostic.message).join('; ');
    throw new Error(`Applied stylesheet must produce a valid Studio projection: ${message}`);
  }
  return evaluation.preview;
}

export function createStylesheetCandidateState(initialization: StudioStylesheetCandidateInitialization, evaluate: typeof evaluateStylesheetCandidate = evaluateStylesheetCandidate): StudioStylesheetCandidateState {
  const appliedPreview = requireValidAppliedCandidate(initialization, evaluate);
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

export function beginStylesheetCandidateValidation(state: StudioStylesheetCandidateState, candidateText: string): { generation: number; state: StudioStylesheetCandidateState } {
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

export function resolveStylesheetCandidateValidation(state: StudioStylesheetCandidateState, generation: number, evaluation: StudioStylesheetCandidateEvaluation): StudioStylesheetCandidateState {
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

export function replaceStylesheetCandidateImmediately(state: StudioStylesheetCandidateState, context: StudioStylesheetCandidateContext, candidateText: string): StudioStylesheetCandidateState {
  const pending = beginStylesheetCandidateValidation(state, candidateText);
  return resolveStylesheetCandidateValidation(pending.state, pending.generation, evaluateStylesheetCandidate(context, candidateText));
}

export function revertStylesheetCandidate(state: StudioStylesheetCandidateState): StudioStylesheetCandidateState {
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
  initialization: StudioStylesheetCandidateInitialization,
  evaluate: typeof evaluateStylesheetCandidate = evaluateStylesheetCandidate
): StudioStylesheetCandidateState {
  return createStylesheetCandidateState({ ...initialization, mode: state.mode }, evaluate);
}

export function reconcileAppliedStylesheetCandidate(
  state: StudioStylesheetCandidateState,
  initialization: StudioStylesheetCandidateInitialization,
  candidateText: string,
  evaluate: typeof evaluateStylesheetCandidate = evaluateStylesheetCandidate
): StudioStylesheetCandidateState {
  const rebased = createStylesheetCandidateState({ ...initialization, mode: state.mode }, evaluate);
  if (candidateText === initialization.appliedStylesheetText) return rebased;
  const pending = beginStylesheetCandidateValidation(rebased, candidateText);
  return resolveStylesheetCandidateValidation(
    pending.state,
    pending.generation,
    evaluate(initialization, candidateText)
  );
}

export function updateStylesheetCandidateContext(state: StudioStylesheetCandidateState, context: StudioStylesheetCandidateContext, evaluate: typeof evaluateStylesheetCandidate = evaluateStylesheetCandidate): StudioStylesheetCandidateState {
  if (state.candidateText === state.appliedText && context.appliedProjection && context.stylesheetSource?.text === state.appliedText) {
    const generation = state.generation + 1;
    const preview = {
      projection: context.appliedProjection,
      source: context.stylesheetSource,
      text: state.appliedText
    };
    return {
      ...state,
      appliedPreview: preview,
      candidateSource: preview.source,
      diagnostics: preview.projection.diagnostics,
      generation,
      latestValid: preview,
      status: 'clean',
      validatedGeneration: generation
    };
  }
  const appliedEvaluation = evaluate(context, state.appliedText);
  if (!appliedEvaluation.ok) {
    const message = appliedEvaluation.diagnostics.map((diagnostic) => diagnostic.message).join('; ');
    throw new Error(`Applied stylesheet must remain valid after a project source change: ${message}`);
  }

  const generation = state.generation + 1;
  const candidateEvaluation = state.candidateText === state.appliedText ? appliedEvaluation : evaluate(context, state.candidateText);
  if (!candidateEvaluation.ok) {
    return {
      ...state,
      appliedPreview: appliedEvaluation.preview,
      candidateSource: candidateEvaluation.source,
      diagnostics: candidateEvaluation.diagnostics,
      generation,
      latestValid: appliedEvaluation.preview,
      status: state.dirty ? 'invalid-dirty' : 'clean',
      validatedGeneration: generation
    };
  }

  return {
    ...state,
    appliedPreview: appliedEvaluation.preview,
    candidateSource: candidateEvaluation.preview.source,
    diagnostics: candidateEvaluation.diagnostics,
    generation,
    latestValid: candidateEvaluation.preview,
    status: state.dirty ? 'valid-dirty' : 'clean',
    validatedGeneration: generation
  };
}

export function setStylesheetCandidateMode(state: StudioStylesheetCandidateState, mode: StudioStylesheetCandidateMode): StudioStylesheetCandidateState {
  return mode === state.mode ? state : { ...state, mode };
}

export function acceptStylesheetCandidateAppliedRevision(state: StudioStylesheetCandidateState, appliedSourceRevision: string): StudioStylesheetCandidateState {
  return appliedSourceRevision === state.appliedSourceRevision ? state : { ...state, appliedSourceRevision };
}

export function serializeStylesheetCandidateRecovery(state: StudioStylesheetCandidateState, capturedAt = new Date().toISOString()): StudioStylesheetCandidateRecovery | undefined {
  if (!state.dirty) return undefined;
  return {
    appliedSourceRevision: state.appliedSourceRevision,
    candidateText: state.candidateText,
    capturedAt,
    mode: state.mode
  };
}

export function restoreStylesheetCandidateRecovery(
  initialization: StudioStylesheetCandidateInitialization & {
    recovery: StudioStylesheetCandidateRecovery;
  },
  evaluate: typeof evaluateStylesheetCandidate = evaluateStylesheetCandidate
): StudioStylesheetCandidateState {
  const initial = createStylesheetCandidateState(
    {
      ...initialization,
      mode: initialization.recovery.mode
    },
    evaluate
  );
  const pending = beginStylesheetCandidateValidation(initial, initialization.recovery.candidateText);
  return resolveStylesheetCandidateValidation(pending.state, pending.generation, evaluate(initialization, initialization.recovery.candidateText));
}

function evaluatorFailure(error: unknown): StudioStylesheetCandidateEvaluation {
  return {
    diagnostics: [
      {
        code: 'stylesheet-candidate-evaluation-failed',
        document: 'stylesheet',
        message: error instanceof Error ? error.message : String(error),
        severity: 'error'
      }
    ],
    ok: false
  };
}

export function createStylesheetCandidateController(options: StudioStylesheetCandidateControllerOptions): StudioStylesheetCandidateController {
  let context: StudioStylesheetCandidateContext = {
    appliedProjection: options.appliedProjection,
    mapperSource: options.mapperSource,
    mapperText: options.mapperText,
    stylesheetSource: options.stylesheetSource,
    topologySource: options.topologySource,
    topologyText: options.topologyText
  };
  let reusableSources = reusableCandidateSources(context);
  const evaluatePrepared = (candidateContext: StudioStylesheetCandidateContext, text: string) => evaluateStylesheetCandidate(candidateContext, text, reusableSources);
  let state = options.recovery ? restoreStylesheetCandidateRecovery({ ...options, recovery: options.recovery }, evaluatePrepared) : createStylesheetCandidateState(options, evaluatePrepared);
  let timer: ReturnType<typeof setTimeout> | undefined;
  const listeners = new Set<() => void>();
  const debounceMs = options.debounceMs ?? defaultStylesheetCandidateDebounceMs;
  const structuredEvaluationDelayMs = Math.max(0, options.structuredEvaluationDelayMs || 0);
  const evaluator = options.evaluate || evaluatePrepared;

  function emit() {
    for (const listener of listeners) listener();
  }

  function clearPending() {
    if (timer === undefined) return;
    clearTimeout(timer);
    timer = undefined;
  }

  function settle(generation: number, evaluation: StudioStylesheetCandidateEvaluation) {
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
    acceptAppliedRevision(appliedSourceRevision) {
      const next = acceptStylesheetCandidateAppliedRevision(state, appliedSourceRevision);
      if (next === state) return;
      state = next;
      emit();
    },
    dispose() {
      clearPending();
      listeners.clear();
    },
    getSnapshot() {
      return state;
    },
    rebase(initialization) {
      clearPending();
      context = {
        appliedProjection: initialization.appliedProjection,
        mapperSource: initialization.mapperSource,
        mapperText: initialization.mapperText,
        stylesheetSource: initialization.stylesheetSource,
        topologySource: initialization.topologySource,
        topologyText: initialization.topologyText
      };
      reusableSources = reusableCandidateSources(context);
      state = rebaseStylesheetCandidate(state, initialization, evaluatePrepared);
      emit();
    },
    reconcileApplied(initialization, candidateText) {
      clearPending();
      context = {
        appliedProjection: initialization.appliedProjection,
        mapperSource: initialization.mapperSource,
        mapperText: initialization.mapperText,
        stylesheetSource: initialization.stylesheetSource,
        topologySource: initialization.topologySource,
        topologyText: initialization.topologyText
      };
      reusableSources = reusableCandidateSources(context);
      state = reconcileAppliedStylesheetCandidate(state, initialization, candidateText, evaluatePrepared);
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
      if (structuredEvaluationDelayMs === 0) {
        evaluateGeneration(generation, candidateText);
        return;
      }
      timer = setTimeout(() => {
        timer = undefined;
        evaluateGeneration(generation, candidateText);
      }, structuredEvaluationDelayMs);
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
    },
    updateContext(nextContext, updateOptions) {
      clearPending();
      context = {
        appliedProjection: nextContext.appliedProjection,
        mapperSource: nextContext.mapperSource,
        mapperText: nextContext.mapperText,
        stylesheetSource: nextContext.stylesheetSource,
        topologySource: nextContext.topologySource,
        topologyText: nextContext.topologyText
      };
      reusableSources = reusableCandidateSources(context);
      if (updateOptions?.deferProjection && !state.dirty && state.status === 'clean') return;
      state = updateStylesheetCandidateContext(state, context, evaluatePrepared);
      emit();
    }
  };
}
