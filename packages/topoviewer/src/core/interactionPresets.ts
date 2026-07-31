import type { TopoViewerProps } from './types';

type InteractionPresetKey =
  | 'connectionHandleMode'
  | 'nodesConnectable'
  | 'nodesDraggable'
  | 'nodesResizable'
  | 'panOnDrag'
  | 'selectionMode'
  | 'selectionOnDrag';

export type TopoViewerInteractionPreset = Readonly<Required<Pick<TopoViewerProps, InteractionPresetKey>>>;

const guidedPanButtons = Object.freeze([1, 2]);

export const TOPOVIEWER_RUNTIME_INTERACTIONS: TopoViewerInteractionPreset = Object.freeze({
  connectionHandleMode: 'full-node',
  nodesConnectable: false,
  nodesDraggable: false,
  nodesResizable: false,
  panOnDrag: true,
  selectionMode: 'full',
  selectionOnDrag: false
});

export const TOPOVIEWER_GUIDED_AUTHORING_INTERACTIONS: TopoViewerInteractionPreset = Object.freeze({
  connectionHandleMode: 'shape-handles',
  nodesConnectable: true,
  nodesDraggable: true,
  nodesResizable: true,
  panOnDrag: guidedPanButtons as number[],
  selectionMode: 'partial',
  selectionOnDrag: true
});

export const TOPOVIEWER_RAPID_AUTHORING_INTERACTIONS: TopoViewerInteractionPreset = Object.freeze({
  ...TOPOVIEWER_GUIDED_AUTHORING_INTERACTIONS,
  connectionHandleMode: 'full-node'
});
