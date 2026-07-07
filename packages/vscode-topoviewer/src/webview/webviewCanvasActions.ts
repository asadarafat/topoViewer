import type { TopoViewerConnectionCreate } from 'topoviewer';
import type { MutationResult, TopoObjectSelection } from '../shared/topologyMutations';
import { applyCanvasAuthoringCommand, type CanvasAuthoringPoint } from './canvasAuthoring';

type ApplyTopologyTransaction = (label: string, update: (topologyText: string) => MutationResult) => void;
type SetSelectedObjects = (objects: TopoObjectSelection[]) => void;

function selectLastGraphObject(
  result: MutationResult,
  collection: 'links' | 'nodes',
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
      layers: selectedLayerIds,
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
      layers: selectedLayerIds,
      source: { nodeId: connection.sourceId, handleId: connection.sourceHandleId },
      target: { nodeId: connection.targetId, handleId: connection.targetHandleId },
      type: 'insertLinkBetween'
    });
    selectLastGraphObject(result, 'links', 'link', setSelectedObjects);
    return result;
  });
}
