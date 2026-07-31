import { describe, expect, it, vi } from 'vitest';
import type { StudioProject } from '../../src';
import { stylesheetCandidateContext, stylesheetCandidateInitialization, synchronizeStylesheetCandidate } from '../../src/features/styles/stylesheetCandidateActions';
import { createStudioDocumentSession } from '../../src/session';
import {
  beginStylesheetCandidateValidation,
  createStylesheetCandidateController,
  createStylesheetCandidateState,
  evaluateStylesheetCandidate,
  reconcileAppliedStylesheetCandidate,
  rebaseStylesheetCandidate,
  resolveStylesheetCandidateValidation,
  restoreStylesheetCandidateRecovery,
  revertStylesheetCandidate,
  serializeStylesheetCandidateRecovery,
  setStylesheetCandidateMode,
  updateStylesheetCandidateContext
} from '../../src/session/stylesheetCandidate';
import { parseStudioSource } from '../../src/session/yamlSource';

const topologyText = ['version: "0.2"', 'graph:', '  layers: [{ id: physical, labels: { name: Physical } }]', '  nodes:', '    - id: router-1', '      labels: { name: Router 1 }', '      layers: [physical]', '      position: [100, 100]', '  links: []', ''].join('\n');
const appliedText = 'stylesheet: []\n';
const validDirtyText = ['stylesheet:', '  - selector: \'node[id = "router-1"]\'', '    style:', '      backgroundColor: "#123456"', ''].join('\n');
const invalidDirtyText = 'stylesheet:\n  - selector: node\n    style: [';

function context() {
  return { topologyText };
}

function project(): StudioProject {
  return {
    assets: [],
    documents: {
      topology: { contentHash: 'topology-1', kind: 'topology', path: 'topology.yaml', text: topologyText },
      stylesheet: { contentHash: 'stylesheet-1', kind: 'stylesheet', path: 'stylesheet.yaml', text: appliedText }
    },
    id: 'candidate-project',
    metadata: {
      createdAt: '2026-07-27T00:00:00.000Z',
      profileVersion: 1,
      schemaVersion: 1,
      updatedAt: '2026-07-27T00:00:00.000Z'
    },
    name: 'Candidate project',
    revision: 'candidate-project-1'
  };
}

describe('stylesheet candidate state', () => {
  it('starts clean with the applied source as the latest valid preview', () => {
    const state = createStylesheetCandidateState({
      ...context(),
      appliedSourceRevision: 'source-1',
      appliedStylesheetText: appliedText,
      mode: 'basic'
    });

    expect(state).toMatchObject({
      appliedSourceRevision: 'source-1',
      appliedText,
      candidateText: appliedText,
      dirty: false,
      generation: 0,
      mode: 'basic',
      status: 'clean',
      validatedGeneration: 0
    });
    expect(state.latestValid.text).toBe(appliedText);
    expect(state.latestValid.projection.document.graph?.nodes?.[0]?.id).toBe('router-1');
  });

  it('accepts a valid dirty candidate without changing the applied source', () => {
    const initial = createStylesheetCandidateState({
      ...context(),
      appliedSourceRevision: 'source-1',
      appliedStylesheetText: appliedText
    });
    const pending = beginStylesheetCandidateValidation(initial, validDirtyText);
    const evaluation = evaluateStylesheetCandidate(context(), validDirtyText);
    const state = resolveStylesheetCandidateValidation(pending.state, pending.generation, evaluation);

    expect(state.status).toBe('valid-dirty');
    expect(state.dirty).toBe(true);
    expect(state.appliedText).toBe(appliedText);
    expect(state.candidateText).toBe(validDirtyText);
    expect(state.latestValid.text).toBe(validDirtyText);
    expect(state.latestValid.projection.document.stylesheet?.[0]?.style?.backgroundColor).toBe('#123456');
  });

  it('retains invalid text and diagnostics while previewing the latest valid candidate', () => {
    const initial = createStylesheetCandidateState({
      ...context(),
      appliedSourceRevision: 'source-1',
      appliedStylesheetText: appliedText
    });
    const validPending = beginStylesheetCandidateValidation(initial, validDirtyText);
    const valid = resolveStylesheetCandidateValidation(validPending.state, validPending.generation, evaluateStylesheetCandidate(context(), validDirtyText));
    const invalidPending = beginStylesheetCandidateValidation(valid, invalidDirtyText);
    const invalid = resolveStylesheetCandidateValidation(invalidPending.state, invalidPending.generation, evaluateStylesheetCandidate(context(), invalidDirtyText));

    expect(invalid.status).toBe('invalid-dirty');
    expect(invalid.candidateText).toBe(invalidDirtyText);
    expect(invalid.diagnostics.some((diagnostic) => diagnostic.severity === 'error')).toBe(true);
    expect(invalid.latestValid.text).toBe(validDirtyText);
    expect(invalid.latestValid.projection.document.stylesheet?.[0]?.style?.backgroundColor).toBe('#123456');
  });

  it('ignores stale validation generations', () => {
    const initial = createStylesheetCandidateState({
      ...context(),
      appliedSourceRevision: 'source-1',
      appliedStylesheetText: appliedText
    });
    const first = beginStylesheetCandidateValidation(initial, invalidDirtyText);
    const second = beginStylesheetCandidateValidation(first.state, validDirtyText);
    const resolvedSecond = resolveStylesheetCandidateValidation(second.state, second.generation, evaluateStylesheetCandidate(context(), validDirtyText));
    const stale = resolveStylesheetCandidateValidation(resolvedSecond, first.generation, evaluateStylesheetCandidate(context(), invalidDirtyText));

    expect(stale).toBe(resolvedSecond);
    expect(stale.status).toBe('valid-dirty');
    expect(stale.candidateText).toBe(validDirtyText);
  });

  it('reverts to applied source and rebases after an applied candidate', () => {
    const initial = createStylesheetCandidateState({
      ...context(),
      appliedSourceRevision: 'source-1',
      appliedStylesheetText: appliedText
    });
    const pending = beginStylesheetCandidateValidation(initial, validDirtyText);
    const dirty = resolveStylesheetCandidateValidation(pending.state, pending.generation, evaluateStylesheetCandidate(context(), validDirtyText));

    const reverted = revertStylesheetCandidate(dirty);
    expect(reverted).toMatchObject({ candidateText: appliedText, dirty: false, status: 'clean' });

    const applied = rebaseStylesheetCandidate(dirty, {
      ...context(),
      appliedSourceRevision: 'source-2',
      appliedStylesheetText: validDirtyText
    });
    expect(applied).toMatchObject({
      appliedSourceRevision: 'source-2',
      appliedText: validDirtyText,
      candidateText: validDirtyText,
      dirty: false,
      status: 'clean'
    });
    expect(applied.mode).toBe(dirty.mode);
  });

  it('adopts a new applied baseline while preserving generated rules in a dirty draft', () => {
    const initial = createStylesheetCandidateState({
      ...context(),
      appliedSourceRevision: 'source-1',
      appliedStylesheetText: appliedText
    });
    const pending = beginStylesheetCandidateValidation(initial, validDirtyText);
    const dirty = resolveStylesheetCandidateValidation(pending.state, pending.generation, evaluateStylesheetCandidate(context(), validDirtyText));
    const nextAppliedText = [
      'stylesheet:',
      '  - selector: \'region[id = "region-1"]\'',
      '    style: { width: 280, height: 180 }',
      ''
    ].join('\n');
    const mergedCandidateText = [
      'stylesheet:',
      '  - selector: \'node[id = "router-1"]\'',
      '    style:',
      '      backgroundColor: "#123456"',
      '  - selector: \'region[id = "region-1"]\'',
      '    style: { width: 280, height: 180 }',
      ''
    ].join('\n');

    const reconciled = reconcileAppliedStylesheetCandidate(dirty, {
      ...context(),
      appliedSourceRevision: 'source-2',
      appliedStylesheetText: nextAppliedText
    }, mergedCandidateText);

    expect(reconciled).toMatchObject({
      appliedSourceRevision: 'source-2',
      appliedText: nextAppliedText,
      candidateText: mergedCandidateText,
      dirty: true,
      status: 'valid-dirty'
    });
    expect(reconciled.latestValid.projection.document.stylesheet).toHaveLength(2);
  });

  it('serializes and restores dirty candidate text separately from applied source', () => {
    const initial = createStylesheetCandidateState({
      ...context(),
      appliedSourceRevision: 'source-1',
      appliedStylesheetText: appliedText
    });
    const pending = beginStylesheetCandidateValidation(initial, invalidDirtyText);
    const invalid = setStylesheetCandidateMode(resolveStylesheetCandidateValidation(pending.state, pending.generation, evaluateStylesheetCandidate(context(), invalidDirtyText)), 'yaml');
    const recovery = serializeStylesheetCandidateRecovery(invalid, '2026-07-14T00:00:00.000Z');

    expect(recovery).toMatchObject({
      appliedSourceRevision: 'source-1',
      candidateText: invalidDirtyText,
      mode: 'yaml'
    });

    const restored = restoreStylesheetCandidateRecovery({
      ...context(),
      appliedSourceRevision: 'source-1',
      appliedStylesheetText: appliedText,
      recovery: recovery!
    });
    expect(restored.status).toBe('invalid-dirty');
    expect(restored.candidateText).toBe(invalidDirtyText);
    expect(restored.latestValid.text).toBe(appliedText);
  });

  it('recomposes the valid candidate after topology context changes', () => {
    const initial = createStylesheetCandidateState({
      ...context(),
      appliedSourceRevision: 'source-1',
      appliedStylesheetText: appliedText
    });
    const pending = beginStylesheetCandidateValidation(initial, validDirtyText);
    const dirty = resolveStylesheetCandidateValidation(pending.state, pending.generation, evaluateStylesheetCandidate(context(), validDirtyText));
    const nextTopology = topologyText.replaceAll('router-1', 'router-2');

    const updated = updateStylesheetCandidateContext(dirty, { topologyText: nextTopology });

    expect(updated.status).toBe('valid-dirty');
    expect(updated.candidateText).toBe(validDirtyText);
    expect(updated.latestValid.projection.document.graph?.nodes?.[0]?.id).toBe('router-2');
  });

  it('uses the current applied projection when an invalid candidate context changes', () => {
    const initial = createStylesheetCandidateState({
      ...context(),
      appliedSourceRevision: 'source-1',
      appliedStylesheetText: appliedText
    });
    const pending = beginStylesheetCandidateValidation(initial, invalidDirtyText);
    const invalid = resolveStylesheetCandidateValidation(pending.state, pending.generation, evaluateStylesheetCandidate(context(), invalidDirtyText));
    const nextTopology = topologyText.replaceAll('router-1', 'router-2');

    const updated = updateStylesheetCandidateContext(invalid, { topologyText: nextTopology });

    expect(updated.status).toBe('invalid-dirty');
    expect(updated.candidateText).toBe(invalidDirtyText);
    expect(updated.latestValid.text).toBe(appliedText);
    expect(updated.latestValid.projection.document.graph?.nodes?.[0]?.id).toBe('router-2');
  });

  it('evaluates a clean candidate once when project context changes', () => {
    const initial = createStylesheetCandidateState({
      ...context(),
      appliedSourceRevision: 'source-1',
      appliedStylesheetText: appliedText
    });
    const evaluate = vi.fn(evaluateStylesheetCandidate);

    const updated = updateStylesheetCandidateContext(initial, { topologyText: topologyText.replaceAll('router-1', 'router-2') }, evaluate);

    expect(evaluate).toHaveBeenCalledTimes(1);
    expect(updated.status).toBe('clean');
    expect(updated.latestValid.projection.document.graph?.nodes?.[0]?.id).toBe('router-2');
  });

  it('adopts the session projection without reevaluating a clean stylesheet', () => {
    const initial = createStylesheetCandidateState({
      ...context(),
      appliedSourceRevision: 'source-1',
      appliedStylesheetText: appliedText
    });
    const nextTopology = topologyText.replaceAll('router-1', 'router-2');
    const projected = evaluateStylesheetCandidate({ topologyText: nextTopology }, appliedText);
    const stylesheetSource = parseStudioSource('stylesheet', appliedText);
    if (!projected.ok || !stylesheetSource.ok) throw new Error('Clean context fixture must be valid.');
    const evaluate = vi.fn(evaluateStylesheetCandidate);

    const updated = updateStylesheetCandidateContext(
      initial,
      {
        appliedProjection: projected.preview.projection,
        stylesheetSource: stylesheetSource.source,
        topologyText: nextTopology
      },
      evaluate
    );

    expect(evaluate).not.toHaveBeenCalled();
    expect(updated.latestValid.projection).toBe(projected.preview.projection);
    expect(updated.latestValid.projection.document.graph?.nodes?.[0]?.id).toBe('router-2');
  });
});

describe('stylesheet candidate controller', () => {
  it('debounces raw text and ignores an older asynchronous result', async () => {
    vi.useFakeTimers();
    const pending: Array<{
      resolve: (evaluation: ReturnType<typeof evaluateStylesheetCandidate>) => void;
      text: string;
    }> = [];
    const controller = createStylesheetCandidateController({
      ...context(),
      appliedSourceRevision: 'source-1',
      appliedStylesheetText: appliedText,
      debounceMs: 250,
      evaluate: (_candidateContext, text) => new Promise((resolve) => pending.push({ resolve, text }))
    });

    controller.replaceRawText(invalidDirtyText);
    expect(controller.getSnapshot().status).toBe('validating');
    await vi.advanceTimersByTimeAsync(249);
    expect(pending).toHaveLength(0);
    await vi.advanceTimersByTimeAsync(1);
    expect(pending.map((item) => item.text)).toEqual([invalidDirtyText]);

    controller.replaceRawText(validDirtyText);
    await vi.advanceTimersByTimeAsync(250);
    expect(pending.map((item) => item.text)).toEqual([invalidDirtyText, validDirtyText]);

    pending[1].resolve(evaluateStylesheetCandidate(context(), validDirtyText));
    await vi.runAllTicks();
    await Promise.resolve();
    expect(controller.getSnapshot()).toMatchObject({ candidateText: validDirtyText, status: 'valid-dirty' });

    pending[0].resolve(evaluateStylesheetCandidate(context(), invalidDirtyText));
    await vi.runAllTicks();
    await Promise.resolve();
    expect(controller.getSnapshot()).toMatchObject({ candidateText: validDirtyText, status: 'valid-dirty' });

    controller.dispose();
    vi.useRealTimers();
  });

  it('evaluates a structured edit immediately and notifies subscribers', () => {
    const controller = createStylesheetCandidateController({
      ...context(),
      appliedSourceRevision: 'source-1',
      appliedStylesheetText: appliedText
    });
    const listener = vi.fn();
    controller.subscribe(listener);

    controller.replaceStructuredText(validDirtyText);

    expect(controller.getSnapshot()).toMatchObject({ candidateText: validDirtyText, status: 'valid-dirty' });
    expect(listener).toHaveBeenCalledTimes(2);
    controller.dispose();
  });

  it('can defer structured evaluation while publishing candidate text immediately', async () => {
    vi.useFakeTimers();
    const controller = createStylesheetCandidateController({
      ...context(),
      appliedSourceRevision: 'source-1',
      appliedStylesheetText: appliedText,
      structuredEvaluationDelayMs: 32
    });

    controller.replaceStructuredText(validDirtyText);
    expect(controller.getSnapshot()).toMatchObject({
      candidateText: validDirtyText,
      status: 'validating'
    });
    await vi.advanceTimersByTimeAsync(31);
    expect(controller.getSnapshot().status).toBe('validating');
    await vi.advanceTimersByTimeAsync(1);
    expect(controller.getSnapshot().status).toBe('valid-dirty');

    controller.dispose();
    vi.useRealTimers();
  });

  it('updates project context without replacing a dirty candidate', () => {
    const controller = createStylesheetCandidateController({
      ...context(),
      appliedSourceRevision: 'source-1',
      appliedStylesheetText: appliedText
    });
    controller.replaceStructuredText(validDirtyText);

    controller.updateContext({ topologyText: topologyText.replaceAll('router-1', 'router-2') });

    expect(controller.getSnapshot()).toMatchObject({
      candidateText: validDirtyText,
      dirty: true,
      status: 'valid-dirty'
    });
    expect(controller.getSnapshot().latestValid.projection.document.graph?.nodes?.[0]?.id).toBe('router-2');
    controller.dispose();
  });

  it('synchronizes a clean position-only context without publishing a redundant canvas update', () => {
    const session = createStudioDocumentSession(project());
    const controller = createStylesheetCandidateController(stylesheetCandidateInitialization(session));
    const listener = vi.fn();
    controller.subscribe(listener);
    const before = session.snapshot();

    session.setValue('topology', ['graph', 'nodes', 0, 'position', 0], 160);
    synchronizeStylesheetCandidate(
      session,
      controller,
      before,
      session.snapshot(),
      'automatic',
      [{ document: 'topology', kind: 'set-value', path: ['graph', 'nodes', 0, 'position', 0], value: 160 }]
    );

    expect(listener).not.toHaveBeenCalled();
    expect(controller.getSnapshot()).toMatchObject({ dirty: false, status: 'clean' });
    expect(controller.getSnapshot().latestValid.projection.document.graph?.nodes?.[0]?.position).toEqual([160, 100]);
    controller.dispose();
  });

  it('publishes context updates by default', () => {
    const session = createStudioDocumentSession(project());
    const controller = createStylesheetCandidateController(stylesheetCandidateInitialization(session));
    const listener = vi.fn();
    controller.subscribe(listener);

    session.setValue('topology', ['graph', 'nodes', 0, 'position', 0], 160);
    controller.updateContext(stylesheetCandidateContext(session));

    expect(listener).toHaveBeenCalledTimes(1);
    expect(controller.getSnapshot().latestValid.projection.document.graph?.nodes?.[0]?.position).toEqual([160, 100]);
    controller.dispose();
  });

  it('publishes context when a topology update contains position and derived mutations', () => {
    const session = createStudioDocumentSession(project());
    const controller = createStylesheetCandidateController(stylesheetCandidateInitialization(session));
    const listener = vi.fn();
    controller.subscribe(listener);
    const before = session.snapshot();

    session.setValue('topology', ['graph', 'nodes', 0, 'position', 0], 160);
    synchronizeStylesheetCandidate(
      session,
      controller,
      before,
      session.snapshot(),
      'automatic',
      [
        { document: 'topology', kind: 'set-value', path: ['graph', 'nodes', 0, 'position', 0], value: 160 },
        { document: 'topology', kind: 'set-value', path: ['graph', 'regions', 0, 'members'], value: ['router-1'] }
      ]
    );

    expect(listener).toHaveBeenCalledTimes(1);
    expect(controller.getSnapshot().latestValid.projection.document.graph?.nodes?.[0]?.position).toEqual([160, 100]);
    controller.dispose();
  });
});
