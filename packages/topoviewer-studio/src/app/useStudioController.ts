import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  TopoViewerConnectionCreate,
  TopoViewerObjectClick
} from 'topoviewer';
import {
  authoringObjectDisplayName,
  copyAuthoringSelection,
  createAuthoringLayer,
  createAuthoringCallout,
  createAuthoringLink,
  createAuthoringNode,
  createAuthoringPath,
  createAuthoringRegion,
  createAuthoringShape,
  createBasicMapperRule,
  mapperRuleFromProposal,
  proposeMapperRule,
  graphHasLinkBetween,
  pasteAuthoringClipboard,
  planAuthoringAlignment,
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
  type AuthoringNodeKind,
  type AuthoringObjectSelection,
  type CreateAuthoringPathOptions,
  type CreateBasicMapperRuleOptions,
  type MapperRuleProposal,
  type MapperSampleIngestionResult,
  type TopoViewerNodeResizeChange,
  type TopoViewerSelectionChange
} from 'topoviewer/authoring';
import type { StyleTargetKind } from 'topoviewer';
import type { StudioCommand, StudioSourceMutation } from '../contracts/commands';
import type { StudioStyleEditRequest, StudioStyleUnsetRequest } from '../contracts/inspector';
import type {
  StudioMapperFieldEditRequest,
  StudioMapperFieldUnsetRequest,
  StudioMapperStyleEditRequest,
  StudioMapperStyleUnsetRequest
} from '../contracts/mapper';
import type { StudioFieldPreference } from '../contracts/profiles';
import type { StudioSelection } from '../contracts/project';
import { createStudioCommandDispatcher, StudioCommandExecutionError } from '../commands';
import type { StudioPaletteTemplateId, StudioUserPreset } from '../features/palette/types';
import {
  emptyStudioAuthoringProfile,
  migrateStudioAuthoringProfile,
  reorderStudioFieldPreference,
  studioAuthoringProfileKey,
  updateStudioFieldPreference
} from '../features/inspector/profile';
import { createStudioDocumentSession, type StudioNormalizationReview } from '../session';
import {
  createRecoveredStudioSession,
  createExternalChangeActions,
  insertionPlan,
  mutationForAuthoringUpdate,
  positionOf,
  type RegionAggregateToggle,
  sameSelection,
  type UseStudioControllerOptions,
  valueAtNestedPath
} from './controllerUtils';
import {
  describeStudioSelection,
  planStudioObjectMove,
  planStudioSelectionResize
} from './controllerAuthoring';

export function useStudioController({ host, onReload, project, recovery }: UseStudioControllerOptions) {
  const session = useMemo(() => {
    return createRecoveredStudioSession(project, recovery);
  }, [project, recovery]);
  const dispatcher = useMemo(() => createStudioCommandDispatcher(session), [session]);
  const [snapshot, setSnapshot] = useState(session.snapshot());
  const [clipboard, setClipboard] = useState<AuthoringClipboardItem[]>([]);
  const [presets, setPresets] = useState<StudioUserPreset[]>([]);
  const [pathMode, setPathMode] = useState<NonNullable<CreateAuthoringPathOptions['mode']>>('loose');
  const [authoringProfile, setAuthoringProfile] = useState(emptyStudioAuthoringProfile);
  const [commandError, setCommandError] = useState<string>();
  const [announcement, setAnnouncement] = useState('Studio ready');
  const [mapperSamples, setMapperSamples] = useState<MapperSampleIngestionResult>();
  const [mapperProposal, setMapperProposal] = useState<MapperRuleProposal>();
  const [normalizationReview, setNormalizationReview] = useState<StudioNormalizationReview>();
  const semanticSelectionGuard = useRef<{ expiresAt: number; selection: StudioSelection }>();

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

  function execute(command: StudioCommand) {
    try {
      const result = dispatcher.dispatch(command);
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

  function executeEditPlan(id: string, label: string, plan: AuthoringEditPlan, selection?: StudioSelection[]) {
    const mutations: StudioSourceMutation[] = [
      ...plan.updates.map((update) => mutationForAuthoringUpdate(
        update,
        Boolean(session.sourceRange('topology', update.path))
      )),
      ...plan.removals.map((removal): StudioSourceMutation => ({
        document: 'topology', kind: 'remove-value', path: removal.path, scopePath: removal.scopePath
      })),
      ...plan.insertions.map((insertion): StudioSourceMutation => ({
        document: 'topology', kind: 'insert-value', path: insertion.path, value: insertion.value
      }))
    ];
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
    const topology = current.projection.document;
    const count = topology.graph?.nodes?.length || 0;
    const target = position || { x: 140 + (count % 4) * 140, y: 120 + Math.floor(count / 4) * 100 };
    if (templateId.startsWith('preset:')) {
      const preset = presets.find((candidate) => `preset:${candidate.id}` === templateId);
      if (!preset) return false;
      const sourcePosition = positionOf(preset.item.value.position) || { x: 0, y: 0 };
      const plan = pasteAuthoringClipboard(topology, [preset.item], {
        x: target.x - sourcePosition.x,
        y: target.y - sourcePosition.y
      });
      return executeEditPlan(`create-${preset.id}`, `Create ${preset.name}`, plan);
    }
    if (templateId === 'path') {
      try {
        const value = createAuthoringPath(topology, {
          mode: pathMode,
          sequence: current.selection.filter((selection) => selection.kind === 'node').map((selection) => selection.id)
        });
        return executeEditPlan(`create-${value.id}`, 'Create path', insertionPlan(
          ['graph', 'paths'], { id: value.id, kind: 'path' }, value as unknown as Record<string, unknown>
        ));
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        setCommandError(message);
        setAnnouncement(`Path rejected: ${message}`);
        return false;
      }
    }
    if (templateId === 'region') {
      const value = createAuthoringRegion(topology, {
        members: current.selection.filter((selection) => selection.kind === 'node').map((selection) => selection.id),
        position: target
      });
      return executeEditPlan(`create-${value.id}`, 'Create region', insertionPlan(
        ['graph', 'regions'], { id: value.id, kind: 'region' }, value as unknown as Record<string, unknown>
      ));
    }
    if (templateId === 'shape') {
      const value = createAuthoringShape(topology, { position: target });
      return executeEditPlan(`create-${value.id}`, 'Create shape', insertionPlan(
        ['diagram', 'shapes'], { id: value.id, kind: 'shape' }, value as unknown as Record<string, unknown>
      ));
    }
    if (templateId === 'callout') {
      const value = createAuthoringCallout(topology, { position: target });
      return executeEditPlan(`create-${value.id}`, 'Create callout', insertionPlan(
        ['diagram', 'callouts'], { id: value.id, kind: 'callout' }, value as unknown as Record<string, unknown>
      ));
    }
    const kind = (templateId === 'asset-router' ? 'router' : templateId) as AuthoringNodeKind;
    const value = createAuthoringNode(topology, { kind, position: target, selectedLayerIds: ['physical'] });
    if (templateId === 'asset-router') {
      value.icon = 'router.generic';
      value.name = 'Router Icon';
    }
    return executeEditPlan(`create-${value.id}`, `Create ${value.name}`, insertionPlan(
      ['graph', 'nodes'], { id: value.id, kind: 'node' }, value as unknown as Record<string, unknown>
    ));
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

  function selectObject(object: TopoViewerObjectClick) {
    const current = session.snapshot();
    const selection = resolveAuthoringSelection(current.projection.document, object.id) as StudioSelection | undefined;
    if (!selection) return;
    if (selection.kind === 'linkDirection') {
      semanticSelectionGuard.current = { expiresAt: Date.now() + 250, selection };
    }
    const additive = object.modifiers?.ctrlKey || object.modifiers?.metaKey || object.modifiers?.shiftKey;
    if (!additive) {
      setSelection([selection]);
      return;
    }
    const exists = current.selection.some((candidate) => candidate.id === selection.id && candidate.kind === selection.kind);
    setSelection(exists
      ? current.selection.filter((candidate) => candidate.id !== selection.id || candidate.kind !== selection.kind)
      : [...current.selection, selection]);
  }

  const selectFromCanvas = useCallback((change: TopoViewerSelectionChange) => {
    const guard = semanticSelectionGuard.current;
    if (guard && Date.now() < guard.expiresAt) {
      const current = session.snapshot();
      if (!sameSelection(current.selection, [guard.selection])) {
        session.setSelection([guard.selection]);
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

  function createConnection(connection: TopoViewerConnectionCreate) {
    try {
      const topology = session.snapshot().projection.document;
      if (graphHasLinkBetween(topology, connection.sourceId, connection.targetId)) {
        setAnnouncement(`Link between ${connection.sourceId} and ${connection.targetId} already exists`);
        return true;
      }
      const value = createAuthoringLink(topology, {
        selectedLayerIds: ['physical'],
        source: connection.sourceId,
        sourceHandle: connection.sourceHandleId,
        target: connection.targetId,
        targetHandle: connection.targetHandleId
      });
      return executeEditPlan(`create-${value.id}`, 'Create link', insertionPlan(
        ['graph', 'links'], { id: value.id, kind: 'link' }, value as unknown as Record<string, unknown>
      ));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setCommandError(message);
      setAnnouncement(`Connection rejected: ${message}`);
      return false;
    }
  }

  function isConnectionValid(connection: TopoViewerConnectionCreate) {
    if (connection.sourceId === connection.targetId) return false;
    const topology = session.snapshot().projection.document;
    const source = resolveAuthoringSelection(topology, connection.sourceId);
    const target = resolveAuthoringSelection(topology, connection.targetId);
    return source?.kind === 'node'
      && target?.kind === 'node'
      && !graphHasLinkBetween(topology, connection.sourceId, connection.targetId);
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
    const selection = session.snapshot().selection[0];
    const existing = session.sourceRange('topology', path);
    execute({
      coalescingKey: selection ? `${selection.kind}:${selection.id}:${path.join('.')}` : undefined,
      id: `inspect-${path.join('-')}`,
      label: `Edit ${String(path.at(-1))}`,
      execute: () => ({
        mutations: [existing
          ? { document: 'topology', kind: 'set-value', path, value }
          : { document: 'topology', kind: 'upsert-value', path, scopePath, value }],
        selection: selection ? [selection] : undefined,
        summary: `Edit ${String(path.at(-1))}`
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

  function commitStyleInspector(request: StudioStyleEditRequest) {
    const selection = session.snapshot().selection[0];
    if (request.scope.kind === 'new-rule') {
      const selector = request.scope.selector;
      const value = {
        selector,
        style: valueAtNestedPath(request.fieldPath, request.value)
      };
      return execute({
        id: `create-style-rule-${request.fieldPath.join('-')}`,
        label: `Create ${selector} style rule`,
        execute: () => ({
          mutations: [{ document: 'stylesheet', kind: 'insert-value', path: ['stylesheet'], value }],
          selection: selection ? [selection] : undefined,
          summary: `Created style rule ${selector}`
        })
      });
    }
    const document = request.scope.kind === 'object' ? 'topology' as const : 'stylesheet' as const;
    const scopePath = request.scope.kind === 'object'
      ? request.objectPath
      : ['stylesheet', request.scope.ruleIndex];
    const path = request.scope.kind === 'object'
      ? [...request.objectPath, 'style', ...request.fieldPath]
      : ['stylesheet', request.scope.ruleIndex, 'style', ...request.fieldPath];
    const existing = session.sourceRange(document, path);
    return execute({
      coalescingKey: selection ? `${selection.kind}:${selection.id}:${document}:${path.join('.')}` : undefined,
      id: `style-${document}-${path.join('-')}`,
      label: `Edit ${request.fieldPath.at(-1)}`,
      execute: () => ({
        mutations: [existing
          ? { document, kind: 'set-value', path, value: request.value }
          : { document, kind: 'upsert-value', path, scopePath, value: request.value }],
        selection: selection ? [selection] : undefined,
        summary: `Edit ${request.fieldPath.at(-1)}`
      })
    });
  }

  function unsetStyleInspector(request: StudioStyleUnsetRequest) {
    const selection = session.snapshot().selection[0];
    const document = request.scope.kind === 'object' ? 'topology' as const : 'stylesheet' as const;
    const scopePath = request.scope.kind === 'object'
      ? request.objectPath
      : ['stylesheet', request.scope.ruleIndex];
    const path = request.scope.kind === 'object'
      ? [...request.objectPath, 'style', ...request.fieldPath]
      : ['stylesheet', request.scope.ruleIndex, 'style', ...request.fieldPath];
    if (!session.sourceRange(document, path)) return false;
    return execute({
      id: `unset-style-${document}-${path.join('-')}`,
      label: `Unset ${request.fieldPath.at(-1)}`,
      execute: () => ({
        mutations: [{ document, kind: 'remove-value', path, scopePath }],
        selection: selection ? [selection] : undefined,
        summary: `Unset ${request.fieldPath.at(-1)}`
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

  function enableMapper() {
    if (session.snapshot().project.documents.mapper) return true;
    return execute({
      id: 'enable-mapper',
      label: 'Enable telemetry mapper',
      execute: () => ({
        mutations: [{
          document: 'mapper',
          kind: 'create-document',
          path: 'mapper.yaml',
          text: 'version: 1\nrules: []\n'
        }],
        summary: 'Enabled telemetry mapper'
      })
    });
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
    const mapper = session.sourceValue('mapper');
    if (!mapper) {
      setCommandError('Enable the telemetry mapper before creating a rule.');
      return false;
    }
    try {
      const value = createBasicMapperRule(mapper, options);
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

  function setMapperSampleResult(result: MapperSampleIngestionResult) {
    setMapperSamples(result);
    setMapperProposal(undefined);
    setAnnouncement(`Loaded ${result.samples.length} local telemetry samples`);
  }

  function proposeMapperMetric(metric: string, explicitSelection?: StudioSelection) {
    const current = session.snapshot();
    const selection = explicitSelection || current.selection[0];
    if (!selection) {
      setCommandError('Select or drop onto a topology object before proposing a mapper rule.');
      return false;
    }
    if (!mapperSamples?.samples.length) {
      setCommandError('Load local telemetry samples before proposing a mapper rule.');
      return false;
    }
    const proposal = proposeMapperRule(
      current.projection.document,
      mapperSamples.samples,
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

  function discardInvalidDraft(document: 'topology' | 'stylesheet' | 'mapper') {
    session.discardInvalidDraft(document);
    setCommandError(undefined);
    setAnnouncement(`Reverted invalid ${document} draft`);
    refresh();
  }

  function confirmNormalizationReview() {
    if (!normalizationReview) return false;
    const review = normalizationReview;
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
  }

  async function exportMapper() {
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
    session.setStatus('saving');
    refresh();
    const current = session.snapshot();
    const result = await host.saveProject({ expectedRevision: current.project.revision, project: current.project });
    if (!result.ok) {
      session.setStatus(result.error.code === 'conflict' ? 'conflict' : 'modified');
      setCommandError(`Save failed: ${result.error.message}`);
      setAnnouncement(`Save failed: ${result.error.message}`);
      refresh();
      return;
    }
    session.markSaved(result.value.revision, result.value.savedAt);
    setCommandError(undefined);
    setAnnouncement('Project saved');
    refresh();
  }

  const externalChangeActions = createExternalChangeActions(session, setCommandError, setAnnouncement, refresh);

  function undo() {
    const result = dispatcher.undo();
    if (result) setAnnouncement(`Undid ${result.summary}`);
    refresh();
  }

  function redo() {
    const result = dispatcher.redo();
    if (result) setAnnouncement(`Redid ${result.summary}`);
    refresh();
  }

  return {
    alignSelection,
    announce: (message: string) => setAnnouncement(message),
    announcement,
    applySourceDraft,
    authoringProfile,
    canCopy: snapshot.selection.length > 0,
    canPaste: clipboard.length > 0,
    canRedo: dispatcher.canRedo(),
    canUndo: dispatcher.canUndo(),
    commandError,
    cancelNormalizationReview,
    commitInspector,
    commitMapperField,
    commitMapperProposal,
    commitMapperStyle,
    commitStyleInspector,
    connectSelected,
    copySelection,
    cutSelection,
    createConnection,
    createLayer,
    createMapperRule,
    createNestedRegion,
    createPaletteObject,
    confirmNormalizationReview,
    deleteSelection,
    deleteLayer,
    distributeSelection,
    duplicateSelection,
    discardInvalidDraft,
    enableMapper,
    exportMapper,
    isConnectionValid,
    ...externalChangeActions,
    mapperProposal,
    mapperSamples,
    moveObject,
    nudgeSelection,
    normalizationReview,
    pasteClipboard,
    pathMode,
    previewRegionForNode,
    proposeMapperMetric,
    presets,
    redo,
    renameLayer,
    releaseNodeFromRegion,
    removeMapper,
    reload: onReload,
    resizeObject,
    resizeSelection,
    reorderLayer,
    reorderFieldProfile,
    resetAuthoringProfile,
    save,
    saveSelectionAsPreset,
    selectFromCanvas,
    selectObject,
    setSelection,
    setPathMode,
    setLayerMembership,
    setMapperSampleResult,
    setRegionExpanded,
    snapshot,
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
    updateFieldProfile
  };
}
