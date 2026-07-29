import { useState } from 'react';
import type {
  StylesheetDocument,
  TopoDocument,
  TopoViewerConnectionCreate,
  TopoViewerNodePositionChange
} from 'topoviewer';
import {
  authoringRegionBounds,
  authoringRegionForNodePosition,
  authoringRegionsForMember,
  copyAuthoringSelection,
  createAuthoringLayer,
  pasteAuthoringClipboard,
  planAuthoringAlignment,
  planAuthoringCalloutAttachment,
  planAuthoringDistribution,
  planAuthoringLayerDeletion,
  planAuthoringLayerMembership,
  planAuthoringLayerRename,
  planAuthoringLayerReorder,
  planAuthoringPositionDelta,
  planAuthoringRegionExpanded,
  planAuthoringReleaseFromRegion,
  resolveAuthoringSelection,
  type AuthoringAlignment,
  type AuthoringClipboardItem,
  type AuthoringDistributionAxis,
  type AuthoringObjectSelection
} from 'topoviewer/authoring';
import { insertionPlan } from '../../commands/authoringPlans';
import type { StudioCommandExecutor, StudioEditPlanExecutor } from '../../contracts/capabilities';
import type { StudioHost } from '../../contracts/host';
import type { StudioSelection, StudioSessionSnapshot } from '../../contracts/project';
import {
  removeCandidateStyleRulesForDeletedObjects,
  type StudioDocumentSession,
  type StudioStylesheetCandidateController
} from '../../session';
import {
  planStudioEdgeCreation,
  planStudioRegionCreation
} from '../palette/paletteAuthoring';
import type { StudioEdgeAuthoringTemplateId, StudioUserPreset } from '../palette/types';
import { planStudioObjectMove, planStudioSelectionMove } from './canvasAuthoring';
import type { StudioRegionAggregateToggle } from './contracts';
import { planStudioSelectionDeletion } from './deletion';
import { planStudioSelectionDuplication } from './duplication';
import { createStudioResizeActions } from './resizeCapability';
import { useStudioCanvasSelection } from './useStudioCanvasSelection';

interface StudioCanvasCapabilityOptions {
  announce(message: string): void;
  candidate: StudioStylesheetCandidateController;
  execute: StudioCommandExecutor;
  executeEditPlan: StudioEditPlanExecutor;
  host: StudioHost;
  presets: StudioUserPreset[];
  rebaseCandidateAfterDelete(candidateText: string): void;
  session: StudioDocumentSession;
  setError(message?: string): void;
  setSnapshot(snapshot: StudioSessionSnapshot): void;
}

function persistentConnectionHandle(handleId?: string): string | undefined {
  return handleId && !/^shape-port-\d+$/.test(handleId) ? handleId : undefined;
}

export function useStudioCanvasCapability({
  announce,
  candidate,
  execute,
  executeEditPlan,
  host,
  presets,
  rebaseCandidateAfterDelete,
  session,
  setError,
  setSnapshot
}: StudioCanvasCapabilityOptions) {
  const [clipboard, setClipboard] = useState<AuthoringClipboardItem[]>([]);
  const selection = useStudioCanvasSelection({ session, setAnnouncement: announce, setSnapshot });

  function createLayer(name = 'New Layer') {
    const current = session.snapshot();
    const value = createAuthoringLayer(current.projection.document, name);
    return executeEditPlan(
      `create-layer-${value.id}`,
      `Create ${String(value.labels?.name || value.id)}`,
      insertionPlan(['graph', 'layers'], { id: value.id, kind: 'layer' }, value as unknown as Record<string, unknown>),
      current.selection
    );
  }

  function renameLayer(layerId: string, name: string) {
    const current = session.snapshot();
    return executeEditPlan(
      `rename-layer-${layerId}`,
      'Rename layer',
      planAuthoringLayerRename(current.projection.document, layerId, name),
      current.selection
    );
  }

  function reorderLayer(layerId: string, targetIndex: number) {
    const current = session.snapshot();
    return executeEditPlan(
      `reorder-layer-${layerId}`,
      'Reorder layer',
      planAuthoringLayerReorder(current.projection.document, layerId, targetIndex),
      current.selection
    );
  }

  function setLayerMembership(layerId: string, assigned: boolean) {
    const current = session.snapshot();
    if (!current.selection.length) return false;
    return executeEditPlan(
      `membership-layer-${layerId}`,
      `${assigned ? 'Assign to' : 'Remove from'} layer`,
      planAuthoringLayerMembership(
        current.projection.document,
        current.selection as AuthoringObjectSelection[],
        layerId,
        assigned
      ),
      current.selection
    );
  }

  function deleteLayer(layerId: string, replacementLayerId?: string) {
    const current = session.snapshot();
    return executeEditPlan(
      `delete-layer-${layerId}`,
      'Delete layer',
      planAuthoringLayerDeletion(current.projection.document, layerId, replacementLayerId),
      current.selection
    );
  }

  async function copyObjectId(id: string) {
    const result = await host.copyText(id);
    if (result.ok) {
      announce(`Copied object ID ${id}`);
      return true;
    }
    setError(result.error.message);
    announce(`Could not copy object ID: ${result.error.message}`);
    return false;
  }

  function moveObject(id: string, position: { x: number; y: number }, dragDelta?: { x: number; y: number }) {
    const planned = planStudioObjectMove(session.snapshot().projection.document, id, position, dragDelta);
    return planned ? executeEditPlan(`move-${id}`, planned.label, planned.plan, [planned.selection]) : false;
  }

  function moveObjects(changes: TopoViewerNodePositionChange[]) {
    const current = session.snapshot();
    const planned = planStudioSelectionMove(current.projection.document, current.selection, changes);
    return planned ? executeEditPlan('move-selection', planned.label, planned.plan, planned.selection) : false;
  }

  const resize = createStudioResizeActions({
    candidate,
    execute,
    executeEditPlan,
    session,
    setAnnouncement: announce,
    setError
  });

  function createConnection(
    connection: TopoViewerConnectionCreate,
    templateId: StudioEdgeAuthoringTemplateId = 'link'
  ) {
    try {
      const topology = session.snapshot().projection.document;
      const source = resolveAuthoringSelection(topology, connection.sourceId);
      const target = resolveAuthoringSelection(topology, connection.targetId);
      const callout = source?.kind === 'callout' ? source : target?.kind === 'callout' ? target : undefined;
      const node = source?.kind === 'node' ? source : target?.kind === 'node' ? target : undefined;
      if (callout && node) {
        if (templateId !== 'link') throw new Error('Only the Link tool can attach a callout leader.');
        return executeEditPlan(
          `attach-${callout.id}-${node.id}`,
          'Attach callout leader',
          planAuthoringCalloutAttachment(topology, callout.id, node.id),
          [callout as StudioSelection]
        );
      }
      if (source?.kind !== 'node' || target?.kind !== 'node') {
        throw new Error('Connections require two nodes or one callout and one node.');
      }
      const creation = planStudioEdgeCreation({
        document: topology,
        presets,
        source: connection.sourceId,
        sourceHandle: persistentConnectionHandle(connection.sourceHandleId),
        stylesheet: session.sourceValue('stylesheet'),
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
      setError(message);
      announce(`Connection rejected: ${message}`);
      return false;
    }
  }

  function isConnectionValid(
    connection: TopoViewerConnectionCreate,
    templateId: StudioEdgeAuthoringTemplateId = 'link'
  ) {
    if (connection.sourceId === connection.targetId) return false;
    const topology = session.snapshot().projection.document;
    const source = resolveAuthoringSelection(topology, connection.sourceId);
    const target = resolveAuthoringSelection(topology, connection.targetId);
    const connectsNodes = source?.kind === 'node' && target?.kind === 'node';
    if (
      templateId.startsWith('preset:')
      || templateId === 'parallel-link'
      || templateId === 'parent-link-pipe'
      || templateId === 'directional-link'
    ) {
      return connectsNodes;
    }
    return connectsNodes
      || (source?.kind === 'callout' && target?.kind === 'node')
      || (source?.kind === 'node' && target?.kind === 'callout');
  }

  function previewRegionForNode(id: string, position: { x: number; y: number }) {
    const topology = session.snapshot().projection.document;
    const resolved = resolveAuthoringSelection(topology, id);
    return resolved?.kind === 'node' ? authoringRegionForNodePosition(topology, id, position) : undefined;
  }

  function releaseNodeFromRegion(nodeId: string, regionId?: string) {
    const topology = session.snapshot().projection.document;
    const containingRegionId = regionId || authoringRegionsForMember(topology, nodeId)[0];
    if (!containingRegionId) return false;
    return executeEditPlan(
      `release-${nodeId}-${containingRegionId}`,
      'Release from region',
      planAuthoringReleaseFromRegion(topology, nodeId, containingRegionId),
      [{ id: nodeId, kind: 'node' }]
    );
  }

  function createNestedRegion(parentId: string) {
    const topology = session.snapshot().projection.document;
    const bounds = authoringRegionBounds(topology, parentId);
    if (!bounds) return false;
    try {
      const creation = planStudioRegionCreation({
        document: topology,
        parentId,
        position: { x: bounds.x + 22, y: bounds.y + 46 },
        size: {
          width: Math.min(160, bounds.width - 44),
          height: Math.min(96, bounds.height - 68)
        },
        stylesheet: session.sourceValue('stylesheet')
      });
      return executeEditPlan(creation.commandId, creation.label, creation.plan, undefined, creation.additionalMutations);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setError(message);
      announce(`Nested region rejected: ${message}`);
      return false;
    }
  }

  function setRegionExpanded(change: StudioRegionAggregateToggle) {
    const topology = session.snapshot().projection.document;
    return executeEditPlan(
      `${change.expanded ? 'expand' : 'collapse'}-${change.regionId}`,
      `${change.expanded ? 'Expand' : 'Collapse'} region`,
      planAuthoringRegionExpanded(topology, change.regionId, change.expanded, change.groupId)
    );
  }

  function connectSelected() {
    const nodes = session.snapshot().selection.filter(
      (item): item is StudioSelection & { kind: 'node' } => item.kind === 'node'
    );
    if (nodes.length !== 2) return false;
    return createConnection({
      sourceId: nodes[0].id,
      sourceRuntimeId: nodes[0].id,
      targetId: nodes[1].id,
      targetRuntimeId: nodes[1].id
    });
  }

  function copySelection() {
    const current = session.snapshot();
    const next = copyAuthoringSelection(current.projection.document, current.selection as AuthoringObjectSelection[]);
    setClipboard(next);
    announce(`${next.length} object${next.length === 1 ? '' : 's'} copied`);
    return next.length > 0;
  }

  function pasteClipboard() {
    if (!clipboard.length) return false;
    return executeEditPlan(
      'paste-selection',
      'Paste selection',
      pasteAuthoringClipboard(session.snapshot().projection.document, clipboard)
    );
  }

  function duplicateSelection() {
    const current = session.snapshot();
    if (!current.selection.length) return false;
    const duplication = planStudioSelectionDuplication(
      current.projection.document,
      session.sourceValue('stylesheet'),
      current.selection as AuthoringObjectSelection[]
    );
    if (!duplication.plan.insertions.length) return false;
    return executeEditPlan(
      'duplicate-selection',
      'Duplicate selection',
      duplication.plan,
      undefined,
      duplication.additionalMutations
    );
  }

  function deleteSelection() {
    const current = session.snapshot();
    if (!current.selection.length) return false;
    const deletion = planStudioSelectionDeletion(
      session.sourceValue('topology') as TopoDocument,
      session.sourceValue('stylesheet') as StylesheetDocument | undefined,
      current.selection as AuthoringObjectSelection[]
    );
    const candidateState = candidate.getSnapshot();
    const candidateCleanup = candidateState.dirty
      ? removeCandidateStyleRulesForDeletedObjects(candidateState.candidateText, deletion.deletedSelections)
      : undefined;
    if (candidateCleanup?.status === 'invalid') {
      const message = `Cannot safely clean the active Style draft: ${candidateCleanup.diagnostics
        .map((diagnostic) => diagnostic.message)
        .join('; ')}`;
      setError(message);
      announce('Delete selection rejected because the Style draft is not valid YAML');
      return false;
    }
    const deleted = executeEditPlan(
      'delete-selection',
      'Delete selection',
      deletion.plan,
      [],
      deletion.additionalMutations
    );
    if (deleted && candidateState.dirty && candidateCleanup) {
      rebaseCandidateAfterDelete(candidateCleanup.text);
    }
    return deleted;
  }

  function cutSelection() {
    const current = session.snapshot();
    const copied = copyAuthoringSelection(current.projection.document, current.selection as AuthoringObjectSelection[]);
    if (!copied.length) return false;
    setClipboard(copied);
    return deleteSelection();
  }

  function nudgeSelection(delta: { x: number; y: number }) {
    const current = session.snapshot();
    if (!current.selection.length) return false;
    return executeEditPlan(
      'nudge-selection',
      'Nudge selection',
      planAuthoringPositionDelta(current.projection.document, current.selection as AuthoringObjectSelection[], delta),
      current.selection
    );
  }

  function alignSelection(alignment: AuthoringAlignment) {
    const current = session.snapshot();
    return executeEditPlan(
      `align-${alignment}`,
      `Align ${alignment}`,
      planAuthoringAlignment(current.projection.document, current.selection as AuthoringObjectSelection[], alignment),
      current.selection
    );
  }

  function distributeSelection(axis: AuthoringDistributionAxis) {
    const current = session.snapshot();
    return executeEditPlan(
      `distribute-${axis}`,
      `Distribute ${axis}`,
      planAuthoringDistribution(current.projection.document, current.selection as AuthoringObjectSelection[], axis),
      current.selection
    );
  }

  return {
    alignSelection,
    canCopy: session.snapshot().selection.length > 0,
    canPaste: clipboard.length > 0,
    connectSelected,
    copyObjectId,
    copySelection,
    createConnection,
    createLayer,
    createNestedRegion,
    cutSelection,
    deleteLayer,
    deleteSelection,
    distributeSelection,
    duplicateSelection,
    isConnectionValid,
    moveObject,
    moveObjects,
    nudgeSelection,
    pasteClipboard,
    previewRegionForNode,
    releaseNodeFromRegion,
    renameLayer,
    reorderLayer,
    ...resize,
    ...selection,
    setLayerMembership,
    setRegionExpanded
  };
}
