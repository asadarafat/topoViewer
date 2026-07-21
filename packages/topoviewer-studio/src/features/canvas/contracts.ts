import type { Ref } from 'react';
import type {
  TopoViewerConnectionCreate,
  TopoViewerNodePositionChange,
  TopoViewerObjectClick,
  TopoViewerProps
} from 'topoviewer';
import type {
  AuthoringAlignment,
  AuthoringDistributionAxis,
  TopoViewerNodeResizeChange,
  TopoViewerSelectionChange
} from 'topoviewer/authoring';
import type { StudioSelection, StudioSessionSnapshot } from '../../contracts/project';
import type { StudioStylesheetCandidateController } from '../../session';
import type { StudioEdgeAuthoringTemplateId, StudioPaletteTemplateId } from '../palette/types';
import type { StudioViewportPreferences } from '../viewport/types';

export type StudioRegionAggregateToggle = Parameters<NonNullable<TopoViewerProps['onRegionAggregateToggle']>>[0];

export interface StudioCanvasModel {
  readonly canvasRef?: Ref<HTMLElement>;
  readonly canCopy: boolean;
  readonly canCopyFormat: boolean;
  readonly canPaste: boolean;
  readonly canSaveSelectionAsPreset: boolean;
  readonly edgeAuthoringTemplate?: StudioEdgeAuthoringTemplateId;
  readonly formatPainterActive: boolean;
  readonly presentationMode: boolean;
  readonly renderRevision: string;
  readonly snapshot: StudioSessionSnapshot;
  readonly stylesheetCandidate: StudioStylesheetCandidateController;
  readonly viewportPreferences: StudioViewportPreferences;
}

export interface StudioCanvasActions {
  readonly alignSelection: (alignment: AuthoringAlignment) => boolean;
  readonly applyFormat: (object: TopoViewerObjectClick) => boolean;
  readonly commitObjectText: (selection: StudioSelection, value: string) => boolean;
  readonly connectSelected: () => boolean;
  readonly copySelection: () => boolean;
  readonly createConnection: (
    connection: TopoViewerConnectionCreate,
    templateId?: StudioEdgeAuthoringTemplateId
  ) => boolean;
  readonly createLayer: (name?: string) => boolean;
  readonly createNestedRegion: (parentId: string) => boolean;
  readonly createObject: (
    templateId: StudioPaletteTemplateId,
    position: { x: number; y: number }
  ) => boolean;
  readonly cutSelection: () => boolean;
  readonly deleteLayer: (layerId: string, replacementLayerId?: string) => boolean;
  readonly deleteSelection: () => boolean;
  readonly distributeSelection: (axis: AuthoringDistributionAxis) => boolean;
  readonly duplicateSelection: () => boolean;
  readonly isConnectionValid: (
    connection: TopoViewerConnectionCreate,
    templateId?: StudioEdgeAuthoringTemplateId
  ) => boolean;
  readonly moveObjects: (changes: TopoViewerNodePositionChange[]) => boolean;
  readonly nudgeSelection: (delta: { x: number; y: number }) => boolean;
  readonly onAnnouncement: (message: string) => void;
  readonly onCancelEdgeAuthoring: () => void;
  readonly onCancelFormatPainter: () => void;
  readonly onCompleteEdgeAuthoring: () => void;
  readonly onExitPresentation: () => void;
  readonly onPaneSelect: () => void;
  readonly pasteClipboard: () => boolean;
  readonly previewRegionForNode: (
    id: string,
    position: { x: number; y: number }
  ) => string | undefined;
  readonly proposeMapperMetric: (metric: string, selection: StudioSelection) => boolean;
  readonly releaseNodeFromRegion: (nodeId: string, regionId?: string) => boolean;
  readonly renameLayer: (layerId: string, name: string) => boolean;
  readonly reorderLayer: (layerId: string, targetIndex: number) => boolean;
  readonly resizeObject: (change: TopoViewerNodeResizeChange) => boolean;
  readonly resizeSelection: (delta: { width: number; height: number }) => boolean;
  readonly saveSelectionAsPreset: () => boolean;
  readonly selectFromCanvas: (change: TopoViewerSelectionChange) => void;
  readonly selectObject: (object: TopoViewerObjectClick) => void;
  readonly setLayerMembership: (layerId: string, assigned: boolean) => boolean;
  readonly setRegionExpanded: (change: StudioRegionAggregateToggle) => boolean;
  readonly setSelection: (selection: StudioSelection[]) => void;
  readonly startFormatPainter: () => void;
}
