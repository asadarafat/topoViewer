import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { stringify } from 'yaml';
import type {
  TopoViewerConnectionCreate,
  TopoViewerObjectClick
} from 'topoviewer';
import {
  authoringObjectDisplayName,
  copyAuthoringSelection,
  createAuthoringLayer,
  createAuthoringRegion,
  createBasicMapperRule,
  ingestMapperSamples,
  mapperRuleFromProposal,
  proposeMapperRule,
  pasteAuthoringClipboard,
  planAuthoringAlignment,
  planAuthoringCalloutAttachment,
  planAuthoringDeletion,
  planAuthoringDistribution,
  planAuthoringLayerDeletion,
  planAuthoringLayerMembership,
  planAuthoringLayerRename,
  planAuthoringLayerReorder,
  planAuthoringPositionDelta,
  planAuthoringRegionExpanded,
  planAuthoringReleaseFromRegion,
  planAuthoringResize,
  authoringRegionForNodePosition,
  authoringRegionBounds,
  authoringRegionsForMember,
  resolveAuthoringSelection,
  styleAuthoringMetadata,
  styleAuthoringMetadataByTarget,
  type AuthoringAlignment,
  type AuthoringClipboardItem,
  type AuthoringDistributionAxis,
  type AuthoringEditPlan,
  type AuthoringObjectSelection,
  type CreateAuthoringPathOptions,
  type CreateBasicMapperRuleOptions,
  type MapperRuleProposal,
  type TopoViewerNodeResizeChange,
  type TopoViewerSelectionChange
} from 'topoviewer/authoring';
import type { StyleTargetKind } from 'topoviewer';
import type { StudioCommand, StudioSourceMutation } from '../contracts/commands';
import type {
  StudioMapperFieldEditRequest,
  StudioMapperFieldUnsetRequest,
  StudioMapperStyleEditRequest,
  StudioMapperStyleUnsetRequest
} from '../contracts/mapper';
import type { StudioFieldPreference } from '../contracts/profiles';
import type { StudioStyleEditRequest, StudioStyleUnsetRequest } from '../contracts/inspector';
import type { StudioSelection } from '../contracts/project';
import { createStudioCommandDispatcher, StudioCommandExecutionError } from '../commands';
import type { StudioEdgeTemplateId, StudioPaletteTemplateId, StudioUserPreset } from '../features/palette/types';
import {
  emptyStudioAuthoringProfile,
  migrateStudioAuthoringProfile,
  reorderStudioFieldPreference,
  studioAuthoringProfileKey,
  updateStudioFieldPreference
} from '../features/inspector/profile';
import {
  createStudioDocumentSession,
  createStylesheetCandidateController,
  defaultStructuredCandidateDelayMs,
  migrateInlineStylesToCandidate,
  setCandidateStyleFieldForTargets,
  unsetCandidateStyleField,
  type StudioNormalizationReview,
  type StudioStylesheetTarget
} from '../session';
import {
  createRecoveredStudioSession,
  createExternalChangeActions,
  insertionPlan,
  mutationsForAuthoringEditPlan,
  type RegionAggregateToggle,
  saveRecoveryBeforeReload,
  sameSelection,
  type UseStudioControllerOptions
} from './controllerUtils';
import {
  describeStudioSelection,
  planStudioObjectMove,
  planStudioSelectionResize,
  resolveStudioQuickEditTarget
} from './controllerAuthoring';
import { planStudioEdgeCreation, planStudioPaletteCreation } from './controllerPalette';
import { createStudioInspectorEditCommand, createStudioViewportEditCommand } from './controllerSourceEdit';
import { createStudioStyleActions } from './controllerStyleRules';

function persistentConnectionHandle(handleId?: string): string | undefined {
  return handleId && !/^shape-port-\d+$/.test(handleId) ? handleId : undefined;
}

function candidateContext(session: ReturnType<typeof createStudioDocumentSession>) {
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

function candidateInitialization(session: ReturnType<typeof createStudioDocumentSession>) {
  const current = session.snapshot();
  return {
    ...candidateContext(session),
    appliedSourceRevision: current.projection.sourceRevision,
    appliedStylesheetText: current.project.documents.stylesheet.text
  };
}

export function useStudioController({ host, onReload, project, recovery }: UseStudioControllerOptions) {
  const session = useMemo(() => {
    return createRecoveredStudioSession(project, recovery);
  }, [project, recovery]);
  const dispatcher = useMemo(() => createStudioCommandDispatcher(session), [session]);
  const stylesheetCandidate = useMemo(() => createStylesheetCandidateController({
    ...candidateInitialization(session),
    recovery: recovery?.stylesheetCandidate,
    structuredEvaluationDelayMs: defaultStructuredCandidateDelayMs
  }), [recovery?.stylesheetCandidate, session]);
  const [snapshot, setSnapshot] = useState(session.snapshot());
  const [clipboard, setClipboard] = useState<AuthoringClipboardItem[]>([]);
  const [presets, setPresets] = useState<StudioUserPreset[]>([]);
  const [pathMode, setPathMode] = useState<NonNullable<CreateAuthoringPathOptions['mode']>>('shortest');
  const [authoringProfile, setAuthoringProfile] = useState(emptyStudioAuthoringProfile);
  const [commandError, setCommandError] = useState<string>();
  const [announcement, setAnnouncement] = useState('Studio ready');
  const mapperSampleInputRef = useRef<string>();
  const [mapperProposal, setMapperProposal] = useState<MapperRuleProposal>();
  const [normalizationReview, setNormalizationReview] = useState<StudioNormalizationReview>();
  const normalizationReviewOwner = useRef<'candidate' | 'session'>('session');
  const semanticSelectionGuard = useRef<{ expiresAt: number; selection: StudioSelection[] }>();
  const candidateLifecycleGeneration = useRef(0);
  const currentStylesheetCandidate = useRef(stylesheetCandidate);
  currentStylesheetCandidate.current = stylesheetCandidate;

  useEffect(() => {
    const generation = ++candidateLifecycleGeneration.current;
    return () => {
      queueMicrotask(() => {
        if (
          currentStylesheetCandidate.current !== stylesheetCandidate
          || candidateLifecycleGeneration.current === generation
        ) {
          stylesheetCandidate.dispose();
        }
      });
    };
  }, [stylesheetCandidate]);

  useEffect(() => {
    let active = true;
    host.readPreference<ReturnType<typeof emptyStudioAuthoringProfile>>(studioAuthoringProfileKey).then((result) => {
      if (!active || !result.ok || !result.value) return;
      const migration = migrateStudioAuthoringProfile(result.value, styleAuthoringMetadata);
      setAuthoringProfile(migration.migrated);
      if (migration.warnings.length) setAnnouncement(migration.warnings.join(' '));
    });
    return () => {
      active = false;
    };
  }, [host]);

  function refresh() {
    setSnapshot(session.snapshot());
  }

  function synchronizeStylesheetCandidate(
    before: ReturnType<typeof session.snapshot>,
    after: ReturnType<typeof session.snapshot>,
    policy: 'automatic' | 'rebase' = 'automatic'
  ) {
    const stylesheetChanged = before.project.documents.stylesheet.text !== after.project.documents.stylesheet.text;
    const contextChanged = before.project.documents.topology.text !== after.project.documents.topology.text
      || before.project.documents.mapper?.text !== after.project.documents.mapper?.text;
    if (stylesheetChanged) {
      if (policy === 'rebase' || !stylesheetCandidate.getSnapshot().dirty) {
        stylesheetCandidate.rebase(candidateInitialization(session));
      } else if (contextChanged) {
        stylesheetCandidate.updateContext(candidateContext(session));
      }
      return;
    }
    if (contextChanged) stylesheetCandidate.updateContext(candidateContext(session));
  }

  function execute(command: StudioCommand, candidatePolicy: 'automatic' | 'rebase' = 'automatic') {
    const before = session.snapshot();
    try {
      const result = dispatcher.dispatch(command);
      synchronizeStylesheetCandidate(before, session.snapshot(), candidatePolicy);
      setCommandError(undefined);
      setNormalizationReview(undefined);
      setAnnouncement(result.summary);
      refresh();
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (error instanceof StudioCommandExecutionError && error.review) {
        setNormalizationReview(error.review);
      }
      setCommandError(message);
      setAnnouncement(`Command failed: ${message}`);
      refresh();
      return false;
    }
  }

  const {
    commitStyleInspector,
    createStyleRule,
    deleteStyleRule,
    duplicateStyleRule,
    moveStyleRule,
    renameStyleRule,
    unsetStyleInspector
  } = createStudioStyleActions({ execute, session });

  function candidateStyleTargets(): StudioStylesheetTarget[] {
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
    path: Array<string | number>
  ): StudioNormalizationReview {
    const beforeLines = before.split(/\r?\n/);
    const afterLines = after.split(/\r?\n/);
    let prefix = 0;
    while (prefix < beforeLines.length && prefix < afterLines.length && beforeLines[prefix] === afterLines[prefix]) {
      prefix += 1;
    }
    normalizationReviewOwner.current = 'candidate';
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

  function commitCandidateStyle(request: StudioStyleEditRequest) {
    const targets = candidateStyleTargets();
    const result = setCandidateStyleFieldForTargets(
      stylesheetCandidate.getSnapshot().candidateText,
      targets,
      request.fieldPath,
      request.value
    );
    if (result.status === 'applied') {
      stylesheetCandidate.replaceStructuredText(result.text);
      setCommandError(undefined);
      setAnnouncement(`Updated ${request.fieldPath.join('.')} in Style draft`);
      return true;
    }
    if (result.status === 'unchanged') return true;
    if (result.status === 'normalization-required') {
      setNormalizationReview(candidateNormalizationReview(
        result.before,
        result.after,
        result.reason,
        request.fieldPath
      ));
      setCommandError(result.reason);
      setAnnouncement('Style edit requires normalization review');
      return false;
    }
    const message = result.diagnostics.map((diagnostic) => diagnostic.message).join('; ');
    setCommandError(message);
    setAnnouncement(`Style edit rejected: ${message}`);
    return false;
  }

  function unsetCandidateStyle(request: StudioStyleUnsetRequest) {
    const targets = candidateStyleTargets();
    let text = stylesheetCandidate.getSnapshot().candidateText;
    for (const target of targets) {
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
          request.fieldPath
        ));
        setCommandError(result.reason);
        setAnnouncement('Style reset requires normalization review');
        return false;
      }
      const message = result.diagnostics.map((diagnostic) => diagnostic.message).join('; ');
      setCommandError(message);
      setAnnouncement(`Style reset rejected: ${message}`);
      return false;
    }
    if (text !== stylesheetCandidate.getSnapshot().candidateText) {
      stylesheetCandidate.replaceStructuredText(text);
      setAnnouncement(`Reset ${request.fieldPath.join('.')} in Style draft`);
    }
    setCommandError(undefined);
    return true;
  }

  function migrateInlineCandidateStyle(fieldPaths: Array<Array<string | number>>) {
    const target = candidateStyleTargets()[0];
    const current = session.snapshot();
    if (!target || current.selection.length !== 1) return false;
    const migration = migrateInlineStylesToCandidate({
      fieldPaths,
      stylesheetText: stylesheetCandidate.getSnapshot().candidateText,
      target,
      topologyText: current.project.documents.topology.text
    });
    if (migration.status === 'unchanged') return true;
    if (migration.status === 'normalization-required') {
      setCommandError(migration.reason);
      setAnnouncement('Inline style migration requires source normalization');
      return false;
    }
    if (migration.status === 'invalid') {
      const message = migration.diagnostics.map((diagnostic) => diagnostic.message).join('; ');
      setCommandError(message);
      setAnnouncement(`Inline style migration rejected: ${message}`);
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
      setCommandError(undefined);
      setAnnouncement(`Moved ${target.id} inline style to stylesheet`);
    }
    return applied;
  }

  function executeEditPlan(
    id: string,
    label: string,
    plan: AuthoringEditPlan,
    selection?: StudioSelection[],
    additionalMutations: StudioSourceMutation[] = []
  ) {
    const mutations = mutationsForAuthoringEditPlan(
      plan, (path) => Boolean(session.sourceRange('topology', path)), additionalMutations
    );
    return execute({
      id,
      label,
      execute: () => ({
        mutations,
        selection: selection || plan.insertions.map((insertion) => insertion.selection as StudioSelection),
        summary: label
      })
    });
  }

  function createPaletteObject(templateId: StudioPaletteTemplateId, position?: { x: number; y: number }) {
    const current = session.snapshot();
    try {
      const creation = planStudioPaletteCreation({
        document: current.projection.document,
        pathMode,
        position,
        presets,
        selection: current.selection,
        stylesheet: session.sourceValue('stylesheet'),
        templateId
      });
      return executeEditPlan(
        creation.commandId,
        creation.label,
        creation.plan,
        undefined,
        creation.additionalMutations
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setCommandError(message);
      const family = templateId === 'path'
        ? 'Path'
        : templateId === 'link' || templateId === 'parallel-link' || templateId === 'parent-link-pipe'
          ? 'Link'
          : 'Object';
      setAnnouncement(`${family} rejected: ${message}`);
      return false;
    }
  }

  function createLayer(name = 'New Layer') {
    const current = session.snapshot();
    const value = createAuthoringLayer(current.projection.document, name);
    return executeEditPlan(`create-layer-${value.id}`, `Create ${value.name || value.id}`, insertionPlan(
      ['graph', 'layers'], { id: value.id, kind: 'layer' }, value as unknown as Record<string, unknown>
    ), current.selection);
  }

  function renameLayer(layerId: string, name: string) {
    const current = session.snapshot();
    return executeEditPlan(`rename-layer-${layerId}`, 'Rename layer',
      planAuthoringLayerRename(current.projection.document, layerId, name), current.selection);
  }

  function reorderLayer(layerId: string, targetIndex: number) {
    const current = session.snapshot();
    return executeEditPlan(`reorder-layer-${layerId}`, 'Reorder layer',
      planAuthoringLayerReorder(current.projection.document, layerId, targetIndex), current.selection);
  }

  function setLayerMembership(layerId: string, assigned: boolean) {
    const current = session.snapshot();
    if (!current.selection.length) return false;
    return executeEditPlan(`membership-layer-${layerId}`, `${assigned ? 'Assign to' : 'Remove from'} layer`,
      planAuthoringLayerMembership(
        current.projection.document,
        current.selection as AuthoringObjectSelection[],
        layerId,
        assigned
      ), current.selection);
  }

  function deleteLayer(layerId: string, replacementLayerId?: string) {
    const current = session.snapshot();
    return executeEditPlan(`delete-layer-${layerId}`, 'Delete layer',
      planAuthoringLayerDeletion(current.projection.document, layerId, replacementLayerId), current.selection);
  }

  function setSelection(selection: StudioSelection[]) {
    const current = session.snapshot();
    if (sameSelection(current.selection, selection)) return;
    session.setSelection(selection);
    setAnnouncement(describeStudioSelection(current.projection.document, selection));
    refresh();
  }

  async function copyObjectId(id: string) {
    const result = await host.copyText(id);
    if (result.ok) {
      setAnnouncement(`Copied object ID ${id}`);
      return true;
    }
    setCommandError(result.error.message);
    setAnnouncement(`Could not copy object ID: ${result.error.message}`);
    return false;
  }

  function selectObject(object: TopoViewerObjectClick) {
    const current = session.snapshot();
    const selection = resolveAuthoringSelection(current.projection.document, object.id) as StudioSelection | undefined;
    if (!selection) return;
    const additive = object.modifiers?.ctrlKey || object.modifiers?.metaKey || object.modifiers?.shiftKey;
    const exists = current.selection.some((candidate) => candidate.id === selection.id && candidate.kind === selection.kind);
    const next = !additive
      ? [selection]
      : exists
        ? current.selection.filter((candidate) => candidate.id !== selection.id || candidate.kind !== selection.kind)
        : [...current.selection, selection];
    if (selection.kind !== 'node') {
      semanticSelectionGuard.current = { expiresAt: Date.now() + 250, selection: next };
    }
    setSelection(next);
  }

  const selectFromCanvas = useCallback((change: TopoViewerSelectionChange) => {
    const guard = semanticSelectionGuard.current;
    if (guard && Date.now() < guard.expiresAt) {
      const current = session.snapshot();
      if (!sameSelection(current.selection, guard.selection)) {
        session.setSelection(guard.selection);
        setSnapshot(session.snapshot());
      }
      return;
    }
    semanticSelectionGuard.current = undefined;
    const current = session.snapshot();
    const selection = change.objects.flatMap((object) => {
      const resolved = resolveAuthoringSelection(current.projection.document, object.id);
      return resolved ? [resolved as StudioSelection] : [];
    });
    if (sameSelection(current.selection, selection)) return;
    session.setSelection(selection);
    setAnnouncement(describeStudioSelection(current.projection.document, selection));
    setSnapshot(session.snapshot());
  }, [session]);

  function moveObject(id: string, position: { x: number; y: number }, dragDelta?: { x: number; y: number }) {
    const planned = planStudioObjectMove(session.snapshot().projection.document, id, position, dragDelta);
    return planned ? executeEditPlan(`move-${id}`, planned.label, planned.plan, [planned.selection]) : false;
  }

  function resizeObject(change: TopoViewerNodeResizeChange) {
    const topology = session.snapshot().projection.document;
    const selection = resolveAuthoringSelection(topology, change.id);
    if (!selection) return false;
    return executeEditPlan(`resize-${selection.id}`, `Resize ${authoringObjectDisplayName(topology, selection)}`,
      planAuthoringResize(topology, selection, change.position, change.size), [selection as StudioSelection]);
  }

  function resizeSelection(delta: { width: number; height: number }) {
    const current = session.snapshot();
    if (current.selection.length !== 1) return false;
    const planned = planStudioSelectionResize(current.projection.document, current.selection[0], delta);
    return planned
      ? executeEditPlan(`resize-${planned.selection.id}`, planned.label, planned.plan, [planned.selection])
      : false;
  }

  function createConnection(connection: TopoViewerConnectionCreate, templateId: StudioEdgeTemplateId = 'link') {
    try {
      const topology = session.snapshot().projection.document;
      const source = resolveAuthoringSelection(topology, connection.sourceId);
      const target = resolveAuthoringSelection(topology, connection.targetId);
      const callout = source?.kind === 'callout' ? source : target?.kind === 'callout' ? target : undefined;
      const node = source?.kind === 'node' ? source : target?.kind === 'node' ? target : undefined;
      if (callout && node) {
        if (templateId !== 'link') throw new Error('Only the Link tool can attach a callout leader.');
        return executeEditPlan(`attach-${callout.id}-${node.id}`, 'Attach callout leader',
          planAuthoringCalloutAttachment(topology, callout.id, node.id), [callout as StudioSelection]);
      }
      if (source?.kind !== 'node' || target?.kind !== 'node') {
        throw new Error('Connections require two nodes or one callout and one node.');
      }
      const creation = planStudioEdgeCreation({
        document: topology,
        source: connection.sourceId,
        sourceHandle: persistentConnectionHandle(connection.sourceHandleId),
        target: connection.targetId,
        targetHandle: persistentConnectionHandle(connection.targetHandleId),
        templateId
      });
      const firstSelection = creation.plan.insertions[0]?.selection as StudioSelection | undefined;
      return executeEditPlan(
        creation.commandId,
        creation.label,
        creation.plan,
        templateId === 'parallel-link' ? [] : firstSelection ? [firstSelection] : [],
        creation.additionalMutations
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setCommandError(message);
      setAnnouncement(`Connection rejected: ${message}`);
      return false;
    }
  }

  function isConnectionValid(connection: TopoViewerConnectionCreate, templateId: StudioEdgeTemplateId = 'link') {
    if (connection.sourceId === connection.targetId) return false;
    const topology = session.snapshot().projection.document;
    const source = resolveAuthoringSelection(topology, connection.sourceId);
    const target = resolveAuthoringSelection(topology, connection.targetId);
    const connectsNodes = source?.kind === 'node' && target?.kind === 'node';
    if (templateId === 'parallel-link' || templateId === 'parent-link-pipe' || templateId === 'directional-link') {
      return connectsNodes;
    }
    return connectsNodes
      || (source?.kind === 'callout' && target?.kind === 'node')
      || (source?.kind === 'node' && target?.kind === 'callout');
  }

  function previewRegionForNode(id: string, position: { x: number; y: number }) {
    const topology = session.snapshot().projection.document;
    const selection = resolveAuthoringSelection(topology, id);
    return selection?.kind === 'node' ? authoringRegionForNodePosition(topology, id, position) : undefined;
  }

  function releaseNodeFromRegion(nodeId: string, regionId?: string) {
    const topology = session.snapshot().projection.document;
    const containingRegionId = regionId || authoringRegionsForMember(topology, nodeId)[0];
    if (!containingRegionId) return false;
    return executeEditPlan(`release-${nodeId}-${containingRegionId}`, 'Release from region',
      planAuthoringReleaseFromRegion(topology, nodeId, containingRegionId), [{ id: nodeId, kind: 'node' }]);
  }

  function createNestedRegion(parentId: string) {
    const topology = session.snapshot().projection.document;
    const bounds = authoringRegionBounds(topology, parentId);
    if (!bounds) return false;
    try {
      const value = createAuthoringRegion(topology, {
        parentId,
        position: { x: bounds.x + 22, y: bounds.y + 46 },
        size: { width: Math.min(160, bounds.width - 44), height: Math.min(96, bounds.height - 68) }
      });
      return executeEditPlan(`create-${value.id}`, 'Create nested region', insertionPlan(
        ['graph', 'regions'], { id: value.id, kind: 'region' }, value as unknown as Record<string, unknown>
      ));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setCommandError(message);
      setAnnouncement(`Nested region rejected: ${message}`);
      return false;
    }
  }

  function setRegionExpanded(change: RegionAggregateToggle) {
    const topology = session.snapshot().projection.document;
    return executeEditPlan(`${change.expanded ? 'expand' : 'collapse'}-${change.regionId}`,
      `${change.expanded ? 'Expand' : 'Collapse'} region`,
      planAuthoringRegionExpanded(topology, change.regionId, change.expanded, change.groupId));
  }

  function connectSelected() {
    const nodes = session.snapshot().selection.filter((selection): selection is StudioSelection & { kind: 'node' } => selection.kind === 'node');
    if (nodes.length !== 2) return false;
    return createConnection({
      sourceId: nodes[0].id, sourceRuntimeId: nodes[0].id,
      targetId: nodes[1].id, targetRuntimeId: nodes[1].id
    });
  }

  function copySelection() {
    const current = session.snapshot();
    const next = copyAuthoringSelection(current.projection.document, current.selection as AuthoringObjectSelection[]);
    setClipboard(next);
    setAnnouncement(`${next.length} object${next.length === 1 ? '' : 's'} copied`);
    return next.length > 0;
  }

  function pasteClipboard() {
    if (!clipboard.length) return false;
    return executeEditPlan('paste-selection', 'Paste selection', pasteAuthoringClipboard(session.snapshot().projection.document, clipboard));
  }

  function cutSelection() {
    const current = session.snapshot();
    const copied = copyAuthoringSelection(current.projection.document, current.selection as AuthoringObjectSelection[]);
    if (!copied.length) return false;
    setClipboard(copied);
    return deleteSelection();
  }

  function duplicateSelection() {
    const current = session.snapshot();
    const copied = copyAuthoringSelection(current.projection.document, current.selection as AuthoringObjectSelection[]);
    if (!copied.length) return false;
    return executeEditPlan('duplicate-selection', 'Duplicate selection', pasteAuthoringClipboard(current.projection.document, copied));
  }

  function deleteSelection() {
    const current = session.snapshot();
    if (!current.selection.length) return false;
    return executeEditPlan('delete-selection', 'Delete selection',
      planAuthoringDeletion(current.projection.document, current.selection as AuthoringObjectSelection[]), []);
  }

  function nudgeSelection(delta: { x: number; y: number }) {
    const current = session.snapshot();
    if (!current.selection.length) return false;
    return executeEditPlan('nudge-selection', 'Nudge selection',
      planAuthoringPositionDelta(current.projection.document, current.selection as AuthoringObjectSelection[], delta), current.selection);
  }

  function alignSelection(alignment: AuthoringAlignment) {
    const current = session.snapshot();
    return executeEditPlan(`align-${alignment}`, `Align ${alignment}`,
      planAuthoringAlignment(current.projection.document, current.selection as AuthoringObjectSelection[], alignment), current.selection);
  }

  function distributeSelection(axis: AuthoringDistributionAxis) {
    const current = session.snapshot();
    return executeEditPlan(`distribute-${axis}`, `Distribute ${axis}`,
      planAuthoringDistribution(current.projection.document, current.selection as AuthoringObjectSelection[], axis), current.selection);
  }

  function saveSelectionAsPreset() {
    const current = session.snapshot();
    const item = copyAuthoringSelection(current.projection.document, current.selection as AuthoringObjectSelection[])[0];
    if (!item || item.selection.kind === 'link' || item.selection.kind === 'linkDirection' || item.selection.kind === 'path') return false;
    const name = `${authoringObjectDisplayName(current.projection.document, item.selection)} preset`;
    const id = `preset-${presets.length + 1}`;
    setPresets((current) => [...current, { id, item, name }]);
    setAnnouncement(`${name} saved`);
    return true;
  }

  function commitInspector(path: Array<string | number>, value: unknown, scopePath: Array<string | number>) {
    const selection = session.snapshot().selection.slice(0, 1);
    return execute(createStudioInspectorEditCommand({
      existing: Boolean(session.sourceRange('topology', path)), path, scopePath, selection, value
    }));
  }

  function commitViewport(path: Array<string | number>, value: unknown, scopePath: Array<string | number>) {
    return execute(createStudioViewportEditCommand({
      existing: Boolean(session.sourceRange('stylesheet', path)), path, scopePath,
      selection: session.snapshot().selection, value
    }));
  }

  function commitObjectText(selection: StudioSelection, value: string) {
    const current = session.snapshot();
    const target = resolveStudioQuickEditTarget(current.projection.document, selection);
    if (!target) return false;
    const path = [...target.scopePath, target.field];
    const existing = session.sourceRange('topology', path);
    return execute({
      coalescingKey: `${selection.kind}:${selection.id}:quick-text`,
      id: `quick-text-${selection.kind}-${selection.id}`,
      label: `Edit ${target.label}`,
      execute: () => ({
        mutations: [existing
          ? { document: 'topology', kind: 'set-value', path, value }
          : { document: 'topology', kind: 'upsert-value', path, scopePath: target.scopePath, value }],
        selection: [selection],
        summary: `Edited ${target.label}`
      })
    });
  }

  function unsetInspector(path: Array<string | number>, scopePath: Array<string | number>) {
    const selection = session.snapshot().selection[0];
    if (!session.sourceRange('topology', path)) return false;
    return execute({
      id: `unset-${path.join('-')}`,
      label: `Unset ${String(path.at(-1))}`,
      execute: () => ({
        mutations: [{ document: 'topology', kind: 'remove-value', path, scopePath }],
        selection: selection ? [selection] : undefined,
        summary: `Unset ${String(path.at(-1))}`
      })
    });
  }

  function sourceRange(document: 'topology' | 'stylesheet' | 'mapper', path: Array<string | number>) {
    return session.sourceRange(document, path);
  }

  function sourcePathForSelection(selection = session.snapshot().selection[0]) {
    return selection ? session.sourcePathForSelection(selection) : undefined;
  }

  function selectSourcePath(document: 'topology' | 'stylesheet' | 'mapper', path: Array<string | number>) {
    const semanticId = session.semanticIdForPath(document, path);
    if (!semanticId) return false;
    const separator = semanticId.indexOf(':');
    const kind = semanticId.slice(0, separator) as StudioSelection['kind'];
    const id = semanticId.slice(separator + 1);
    if (!id) return false;
    setSelection([{ id, kind }]);
    return true;
  }

  function selectSourceOffset(document: 'topology' | 'stylesheet' | 'mapper', offset: number) {
    const path = session.sourcePathAtOffset(document, offset);
    return path ? selectSourcePath(document, path) : false;
  }

  function persistAuthoringProfile(next: ReturnType<typeof emptyStudioAuthoringProfile>, summary: string) {
    setAuthoringProfile(next);
    setAnnouncement(summary);
    void host.writePreference(studioAuthoringProfileKey, next).then((result) => {
      if (result.ok) return;
      setCommandError(`Profile update failed: ${result.error.message}`);
      setAnnouncement(`Profile update failed: ${result.error.message}`);
    });
  }

  function updateFieldProfile(
    target: StyleTargetKind,
    path: string,
    patch: Partial<Pick<StudioFieldPreference, 'hidden' | 'level' | 'order'>>
  ) {
    persistAuthoringProfile(
      updateStudioFieldPreference(authoringProfile, target, path, patch),
      `Updated ${path} authoring preference`
    );
  }

  function reorderFieldProfile(target: StyleTargetKind, path: string, direction: -1 | 1) {
    persistAuthoringProfile(
      reorderStudioFieldPreference(authoringProfile, target, styleAuthoringMetadataByTarget[target], path, direction),
      `Reordered ${path}`
    );
  }

  function resetAuthoringProfile() {
    persistAuthoringProfile(emptyStudioAuthoringProfile(), 'Reset authoring field profile');
  }

  function removeMapper() {
    if (!session.snapshot().project.documents.mapper) return true;
    return execute({
      id: 'remove-mapper',
      label: 'Remove telemetry mapper',
      execute: () => ({
        mutations: [{ document: 'mapper', kind: 'remove-document' }],
        summary: 'Removed telemetry mapper'
      })
    });
  }

  function createMapperRule(options: CreateBasicMapperRuleOptions) {
    const existingMapper = session.sourceValue('mapper');
    const mapper = existingMapper || { version: 1, rules: [] };
    try {
      const value = createBasicMapperRule(mapper, options);
      if (!existingMapper) {
        return execute({
          id: `create-mapper-with-rule-${value.id}`,
          label: `Create mapper rule ${value.id}`,
          execute: () => ({
            mutations: [{
              document: 'mapper',
              kind: 'create-document',
              path: 'mapper.yaml',
              text: stringify({ version: 1, rules: [value] })
            }],
            summary: `Created mapper with rule ${value.id}`
          })
        });
      }
      const hasRules = Array.isArray(mapper.rules);
      return execute({
        id: `create-mapper-rule-${value.id}`,
        label: `Create mapper rule ${value.id}`,
        execute: () => ({
          mutations: [hasRules
            ? { document: 'mapper', kind: 'insert-value', path: ['rules'], value }
            : { document: 'mapper', kind: 'upsert-value', path: ['rules'], scopePath: [], value: [value] }],
          summary: `Created mapper rule ${value.id}`
        })
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setCommandError(message);
      setAnnouncement(`Mapper rule rejected: ${message}`);
      return false;
    }
  }

  function setMapperSampleInput(input: string) {
    mapperSampleInputRef.current = input;
    setMapperProposal(undefined);
  }

  function proposeMapperMetric(metric: string, explicitSelection?: StudioSelection) {
    const current = session.snapshot();
    const selection = explicitSelection || current.selection[0];
    if (!selection) {
      setCommandError('Select or drop onto a topology object before proposing a mapper rule.');
      return false;
    }
    if (!mapperSampleInputRef.current?.trim()) {
      setCommandError('Load local telemetry samples before proposing a mapper rule.');
      return false;
    }
    const ingestion = ingestMapperSamples(mapperSampleInputRef.current);
    if (!ingestion.samples.length) {
      setCommandError(ingestion.diagnostics.map((diagnostic) => diagnostic.message).join('; ') || 'No valid telemetry samples were loaded.');
      return false;
    }
    const proposal = proposeMapperRule(
      current.projection.document,
      ingestion.samples,
      metric,
      selection as AuthoringObjectSelection
    );
    setMapperProposal(proposal);
    setCommandError(undefined);
    setAnnouncement(`Proposed ${metric} for ${selection.kind} ${selection.id}`);
    return true;
  }

  function commitMapperProposal(candidateId?: string) {
    const mapper = session.sourceValue('mapper');
    if (!mapper || !mapperProposal) return false;
    try {
      const proposed = mapperRuleFromProposal(mapper, mapperProposal, candidateId);
      const collection = mapper[proposed.collection];
      const value = proposed.value as Record<string, unknown>;
      const created = execute({
        id: `create-inferred-mapper-${String(value.id || mapperProposal.metric)}`,
        label: `Create inferred mapper rule for ${mapperProposal.metric}`,
        execute: () => ({
          mutations: [Array.isArray(collection)
            ? { document: 'mapper', kind: 'insert-value', path: [proposed.collection], value }
            : {
                document: 'mapper', kind: 'upsert-value', path: [proposed.collection],
                scopePath: [], value: [value]
              }],
          summary: `Created inferred mapper rule for ${mapperProposal.metric}`
        })
      });
      if (created) setMapperProposal(undefined);
      return created;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setCommandError(message);
      setAnnouncement(`Mapper proposal rejected: ${message}`);
      return false;
    }
  }

  function commitMapperField(request: StudioMapperFieldEditRequest) {
    if (!session.snapshot().project.documents.mapper) return false;
    const existing = session.sourceRange('mapper', request.path);
    return execute({
      coalescingKey: `mapper:${request.path.join('.')}`,
      id: `mapper-field-${request.path.join('-')}`,
      label: `Edit mapper ${request.field.label}`,
      execute: () => ({
        mutations: [existing
          ? { document: 'mapper', kind: 'set-value', path: request.path, value: request.value }
          : {
              document: 'mapper', kind: 'upsert-value', path: request.path,
              scopePath: request.scopePath, value: request.value
            }],
        summary: `Edited mapper ${request.field.label}`
      })
    });
  }

  function unsetMapperField(request: StudioMapperFieldUnsetRequest) {
    if (!session.sourceRange('mapper', request.path)) return false;
    return execute({
      id: `unset-mapper-${request.path.join('-')}`,
      label: `Unset mapper ${String(request.path.at(-1))}`,
      execute: () => ({
        mutations: [{
          document: 'mapper', kind: 'remove-value', path: request.path,
          scopePath: request.scopePath
        }],
        summary: `Unset mapper ${String(request.path.at(-1))}`
      })
    });
  }

  function commitMapperStyle(request: StudioMapperStyleEditRequest) {
    const topLevelField = request.fieldPath[0];
    const compatible = styleAuthoringMetadataByTarget[request.target]
      ?.some((field) => field.path === topLevelField);
    if (!compatible) {
      setCommandError(`${topLevelField} is not compatible with ${request.target} mapper targets.`);
      setAnnouncement(`Mapper style rejected: incompatible ${topLevelField}`);
      return false;
    }
    const existing = session.sourceRange('mapper', request.path);
    return execute({
      coalescingKey: `mapper-style:${request.path.join('.')}`,
      id: `mapper-style-${request.path.join('-')}`,
      label: `Edit mapper ${topLevelField} style`,
      execute: () => ({
        mutations: [existing
          ? { document: 'mapper', kind: 'set-value', path: request.path, value: request.value }
          : {
              document: 'mapper', kind: 'upsert-value', path: request.path,
              scopePath: request.scopePath, value: request.value
            }],
        summary: `Edited mapper ${topLevelField} style`
      })
    });
  }

  function unsetMapperStyle(request: StudioMapperStyleUnsetRequest) {
    return unsetMapperField(request);
  }

  function applySourceDraft(document: 'topology' | 'stylesheet' | 'mapper', text: string) {
    if (document === 'stylesheet') {
      stylesheetCandidate.replaceStructuredText(text);
      const candidate = stylesheetCandidate.getSnapshot();
      if (candidate.status === 'invalid-dirty') {
        setCommandError(candidate.diagnostics.map((diagnostic) => diagnostic.message).join('; '));
        setAnnouncement(`stylesheet YAML contains ${candidate.diagnostics.length} diagnostic${candidate.diagnostics.length === 1 ? '' : 's'}`);
        return false;
      }
      return applyStylesheetCandidate();
    }
    const source = session.snapshot().project.documents[document];
    if (!source || source.text === text) return false;
    const validation = createStudioDocumentSession(session.snapshot().project).replaceDraft(document, text);
    if (validation.status === 'invalid') {
      session.replaceDraft(document, text);
      setCommandError(validation.diagnostics.map((diagnostic) => diagnostic.message).join('; '));
      setAnnouncement(`${document} YAML contains ${validation.diagnostics.length} diagnostic${validation.diagnostics.length === 1 ? '' : 's'}`);
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

  function applyStylesheetCandidate() {
    const candidate = stylesheetCandidate.getSnapshot();
    if (!candidate.dirty) return true;
    if (candidate.status !== 'valid-dirty') {
      setCommandError('Resolve the stylesheet diagnostics before applying this Style draft.');
      setAnnouncement('Style draft cannot be applied because it is invalid');
      return false;
    }
    const applied = execute({
      id: 'apply-stylesheet-candidate',
      label: 'Apply Style draft',
      execute: () => ({
        mutations: [{ document: 'stylesheet', kind: 'replace-source', text: candidate.candidateText }],
        summary: 'Applied Style draft'
      })
    }, 'rebase');
    if (applied) {
      setCommandError(undefined);
      setAnnouncement('Style draft applied to stylesheet.yaml');
    }
    return applied;
  }

  function revertStylesheetCandidateDraft() {
    if (!stylesheetCandidate.getSnapshot().dirty) return false;
    stylesheetCandidate.revert();
    setCommandError(undefined);
    setAnnouncement('Style draft reverted');
    return true;
  }

  function replaceStylesheetCandidateRaw(text: string) {
    stylesheetCandidate.replaceRawText(text);
  }

  function replaceStylesheetCandidateStructured(text: string) {
    stylesheetCandidate.replaceStructuredText(text);
  }

  function discardInvalidDraft(document: 'topology' | 'stylesheet' | 'mapper') {
    session.discardInvalidDraft(document);
    setCommandError(undefined);
    setAnnouncement(`Reverted invalid ${document} draft`);
    refresh();
  }

  function confirmNormalizationReview() {
    if (!normalizationReview) return false;
    const review = normalizationReview;
    if (normalizationReviewOwner.current === 'candidate') {
      stylesheetCandidate.replaceStructuredText(review.after);
      setNormalizationReview(undefined);
      setCommandError(undefined);
      setAnnouncement('Confirmed Style draft normalization');
      normalizationReviewOwner.current = 'session';
      return true;
    }
    const applied = execute({
      id: `confirm-${review.id}`,
      label: `Confirm ${review.document} normalization`,
      execute: () => ({
        mutations: [{ document: review.document, kind: 'replace-source', text: review.after }],
        summary: `Confirmed ${review.document} normalization`
      })
    });
    if (applied) setNormalizationReview(undefined);
    return applied;
  }

  function cancelNormalizationReview() {
    setNormalizationReview(undefined);
    setCommandError(undefined);
    setAnnouncement('Normalization review cancelled');
    normalizationReviewOwner.current = 'session';
  }

  async function exportMapper() {
    if (!applyStylesheetCandidate()) return false;
    const mapper = session.snapshot().project.documents.mapper;
    if (!mapper) return false;
    const result = await host.exportArtifact({
      artifact: {
        bytes: new TextEncoder().encode(mapper.text),
        mediaType: 'application/yaml',
        name: mapper.path.split('/').at(-1) || 'mapper.yaml'
      },
      kind: 'files',
      suggestedName: mapper.path.split('/').at(-1) || 'mapper.yaml'
    });
    if (!result.ok) {
      setCommandError(`Mapper export failed: ${result.error.message}`);
      setAnnouncement(`Mapper export failed: ${result.error.message}`);
      return false;
    }
    setCommandError(undefined);
    setAnnouncement('Mapper exported');
    return true;
  }

  async function save() {
    if (!applyStylesheetCandidate()) return false;
    session.setStatus('saving');
    refresh();
    const current = session.snapshot();
    const result = await host.saveProject({ expectedRevision: current.project.revision, project: current.project });
    if (!result.ok) {
      session.setStatus(result.error.code === 'conflict' ? 'conflict' : 'modified');
      setCommandError(`Save failed: ${result.error.message}`);
      setAnnouncement(`Save failed: ${result.error.message}`);
      refresh();
      return false;
    }
    session.markSaved(result.value.revision, result.value.savedAt);
    setCommandError(undefined);
    setAnnouncement('Project saved');
    refresh();
    return true;
  }

  async function flushRecovery() {
    const result = await saveRecoveryBeforeReload(session, host, stylesheetCandidate);
    if (result.ok) return true;
    setCommandError(`Recovery save failed: ${result.error.message}`);
    setAnnouncement(`Project switch blocked: ${result.error.message}`);
    return false;
  }

  const externalChangeActions = createExternalChangeActions(
    session,
    setCommandError,
    setAnnouncement,
    refresh,
    stylesheetCandidate
  );

  function undo() {
    const before = session.snapshot();
    const result = dispatcher.undo();
    if (result) setAnnouncement(`Undid ${result.summary}`);
    if (result) synchronizeStylesheetCandidate(before, session.snapshot());
    refresh();
  }

  function redo() {
    const before = session.snapshot();
    const result = dispatcher.redo();
    if (result) setAnnouncement(`Redid ${result.summary}`);
    if (result) synchronizeStylesheetCandidate(before, session.snapshot());
    refresh();
  }

  return {
    alignSelection,
    announce: (message: string) => setAnnouncement(message),
    announcement,
    applySourceDraft,
    applyStylesheetCandidate,
    authoringProfile,
    canCopy: snapshot.selection.length > 0,
    canPaste: clipboard.length > 0,
    canRedo: dispatcher.canRedo(),
    canUndo: dispatcher.canUndo(),
    commandError,
    cancelNormalizationReview,
    commitInspector,
    commitObjectText,
    commitMapperField,
    commitMapperProposal,
    commitMapperStyle,
    commitStyleInspector,
    commitCandidateStyle,
    commitViewport,
    connectSelected,
    copySelection,
    copyObjectId,
    cutSelection,
    createConnection,
    createLayer,
    createMapperRule,
    createNestedRegion,
    createPaletteObject,
    createStyleRule,
    confirmNormalizationReview,
    deleteSelection,
    deleteStyleRule,
    deleteLayer,
    distributeSelection,
    duplicateSelection,
    duplicateStyleRule,
    discardInvalidDraft,
    exportMapper,
    flushRecovery,
    isConnectionValid,
    ...externalChangeActions,
    mapperProposal,
    mapperSampleInput: mapperSampleInputRef.current,
    migrateInlineCandidateStyle,
    moveObject,
    moveStyleRule,
    nudgeSelection,
    normalizationReview,
    pasteClipboard,
    pathMode,
    previewRegionForNode,
    proposeMapperMetric,
    presets,
    redo,
    replaceStylesheetCandidateRaw,
    replaceStylesheetCandidateStructured,
    renameStyleRule,
    renameLayer,
    releaseNodeFromRegion,
    removeMapper,
    reload: onReload,
    resizeObject,
    resizeSelection,
    reorderLayer,
    reorderFieldProfile,
    resetAuthoringProfile,
    revertStylesheetCandidate: revertStylesheetCandidateDraft,
    save,
    saveSelectionAsPreset,
    selectFromCanvas,
    selectObject,
    setSelection,
    setPathMode,
    setLayerMembership,
    setMapperSampleInput,
    setRegionExpanded,
    snapshot,
    stylesheetCandidate,
    sourceRange,
    sourcePathForSelection,
    selectSourceOffset,
    selectSourcePath,
    historyEntries: dispatcher.historyEntries(),
    undo,
    unsetInspector,
    unsetMapperField,
    unsetMapperStyle,
    unsetStyleInspector,
    unsetCandidateStyle,
    updateFieldProfile
  };
}
