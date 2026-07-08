import type { TopoViewerConnectionCreate } from 'topoviewer';
import type { MutationResult, TopoObjectSelection } from '../shared/topologyMutations';
import { applyCanvasAuthoringCommand, layersForCanvasTool, type CanvasAuthoringPoint, type CanvasAuthoringRect } from './canvasAuthoring';

type ApplyTopologyTransaction = (label: string, update: (topologyText: string) => MutationResult) => void;
type SetSelectedObjects = (objects: TopoObjectSelection[]) => void;

function selectLastGraphObject(
  result: MutationResult,
  collection: 'links' | 'nodes' | 'paths',
  kind: TopoObjectSelection['kind'],
  setSelectedObjects: SetSelectedObjects
) {
  const objects = result.document.graph?.[collection] || [];
  const createdId = objects[objects.length - 1]?.id;
  if (createdId) setSelectedObjects([{ kind, id: String(createdId) }]);
}

export function placeCanvasNodeAction({
  applyTopologyTransaction,
  position,
  selectedLayerIds,
  setSelectedObjects
}: {
  applyTopologyTransaction: ApplyTopologyTransaction;
  position: CanvasAuthoringPoint;
  selectedLayerIds: string[];
  setSelectedObjects: SetSelectedObjects;
}) {
  applyTopologyTransaction('Place node', (topologyText) => {
    const result = applyCanvasAuthoringCommand(topologyText, {
      layers: layersForCanvasTool('node', selectedLayerIds),
      position,
      preset: 'node',
      type: 'insertNodeAt'
    });
    selectLastGraphObject(result, 'nodes', 'node', setSelectedObjects);
    return result;
  });
}

export function createCanvasConnectionAction({
  applyTopologyTransaction,
  connection,
  selectedLayerIds,
  setSelectedObjects
}: {
  applyTopologyTransaction: ApplyTopologyTransaction;
  connection: TopoViewerConnectionCreate;
  selectedLayerIds: string[];
  setSelectedObjects: SetSelectedObjects;
}) {
  applyTopologyTransaction('Draw link', (topologyText) => {
    const result = applyCanvasAuthoringCommand(topologyText, {
      layers: layersForCanvasTool('link', selectedLayerIds),
      source: { nodeId: connection.sourceId, handleId: connection.sourceHandleId },
      target: { nodeId: connection.targetId, handleId: connection.targetHandleId },
      type: 'insertLinkBetween'
    });
    selectLastGraphObject(result, 'links', 'link', setSelectedObjects);
    return result;
  });
}

export function createCanvasPathAction({
  applyTopologyTransaction,
  selectedLayerIds,
  sequence,
  setSelectedObjects
}: {
  applyTopologyTransaction: ApplyTopologyTransaction;
  selectedLayerIds: string[];
  sequence: string[];
  setSelectedObjects: SetSelectedObjects;
}) {
  applyTopologyTransaction('Create path', (topologyText) => {
    const result = applyCanvasAuthoringCommand(topologyText, {
      layers: layersForCanvasTool('path', selectedLayerIds),
      sequence,
      type: 'insertPathSequence'
    });
    selectLastGraphObject(result, 'paths', 'path', setSelectedObjects);
    return result;
  });
}

export function createCanvasRegionAction({
  applyTopologyTransaction,
  bounds,
  members,
  selectedLayerIds,
  setSelectedObjects
}: {
  applyTopologyTransaction: ApplyTopologyTransaction;
  bounds?: CanvasAuthoringRect;
  members: string[];
  selectedLayerIds: string[];
  setSelectedObjects: SetSelectedObjects;
}) {
  applyTopologyTransaction('Create region', (topologyText) => {
    const result = bounds
      ? applyCanvasAuthoringCommand(topologyText, {
        bounds,
        layers: layersForCanvasTool('region', selectedLayerIds),
        members,
        type: 'insertRegionFromBounds'
      })
      : applyCanvasAuthoringCommand(topologyText, {
        layers: layersForCanvasTool('region', selectedLayerIds),
        members,
        type: 'insertRegionFromSelection'
      });
    const regions = result.document.graph?.regions || [];
    const createdId = regions[regions.length - 1]?.id;
    if (createdId) setSelectedObjects([{ kind: 'region', id: String(createdId) }]);
    return result;
  });
}
