import { lazy, Suspense } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { StudioAsset, StudioDiagnostic, StudioDocumentKind, StudioSelection } from '../contracts/project';
import type { StudioEdgeAuthoringTemplateId } from '../features/palette/types';
import type { StudioContextDrawer } from '../features/workspace/workbenchLayout';
import type { StudioViewportPreferences } from '../features/viewport/types';
import { studioSpace } from '../ui/muiSpacing';
import type { StudioOptionalSurface } from './StudioOptionalSurfaceBoundary';
import type { useStudioController } from './useStudioController';

const MapperWorkspace = lazy(() => import('../features/mapper/MapperWorkspace'));
const ObjectPalette = lazy(() =>
  import('../features/palette/ObjectPalette').then((module) => ({
    default: module.ObjectPalette
  }))
);
const ProjectSourceNavigator = lazy(() =>
  import('../features/workspace/ProjectSourceNavigator').then((module) => ({
    default: module.ProjectSourceNavigator
  }))
);
const PropertiesWorkspace = lazy(() =>
  import('../features/inspector/PropertiesWorkspace').then((module) => ({
    default: module.PropertiesWorkspace
  }))
);
const StudioOptionalSurfaceBoundary = lazy(() =>
  import('./StudioOptionalSurfaceBoundary').then((module) => ({
    default: module.StudioOptionalSurfaceBoundary
  }))
);
const StudioOptionalSurfaceFailureProbe = lazy(() =>
  import('./StudioOptionalSurfaceBoundary').then((module) => ({
    default: module.StudioOptionalSurfaceFailureProbe
  }))
);

type StudioController = ReturnType<typeof useStudioController>;

const workspaceViewSx = {
  display: 'grid',
  gridTemplateRows: 'minmax(0, 1fr)',
  height: '100%',
  minHeight: 0,
  minWidth: 0,
  overflow: 'hidden',
  width: '100%',
  '&[hidden]': { display: 'none' }
} as const;

interface StudioAuthoringWorkspaceProps {
  activeEdgeTemplate?: StudioEdgeAuthoringTemplateId;
  controller: StudioController;
  disabled: boolean;
  onClose(): void;
  onCreate(...request: Parameters<StudioController['createPaletteObject']>): boolean;
  onEdgeTemplateChange(templateId?: StudioEdgeAuthoringTemplateId): void;
  open: boolean;
}

export function StudioAuthoringWorkspace({
  activeEdgeTemplate,
  controller,
  disabled,
  onClose,
  onCreate,
  onEdgeTemplateChange,
  open
}: StudioAuthoringWorkspaceProps) {
  return (
    <Box id="studio-add-workspace" sx={workspaceViewSx}>
      <Suspense
        fallback={
          <Box sx={{ p: studioSpace.space12 }}>
            <Typography role="status" variant="body2">
              Opening object palette...
            </Typography>
          </Box>
        }
      >
        <ObjectPalette
          activeEdgeTemplate={activeEdgeTemplate}
          disabled={disabled}
          onCollapse={onClose}
          onCreate={onCreate}
          onDeletePreset={controller.deletePreset}
          onEdgeTemplateChange={onEdgeTemplateChange}
          onPathModeChange={controller.setPathMode}
          onRenamePreset={controller.renamePreset}
          pathMode={controller.pathMode}
          presets={controller.presets}
          selectedNodeCount={controller.snapshot.selection.filter((item) => item.kind === 'node').length}
          state={open ? 'open' : 'closed'}
        />
      </Suspense>
    </Box>
  );
}

interface StudioContextualWorkspaceProps {
  activeDrawer?: StudioContextDrawer;
  controller: StudioController;
  onClose(): void;
  onOpenAttentionPolicy(): void;
  onOpenSource(kind: StudioDocumentKind, path?: Array<string | number>): void;
  onRecoverOptionalSurface(): void;
  onViewportPreferencesChange(patch: Partial<StudioViewportPreferences>): void;
  shouldForceOptionalSurfaceFailure(surface: StudioOptionalSurface): boolean;
  viewportPreferences: StudioViewportPreferences;
  visitedDrawers: ReadonlySet<StudioContextDrawer>;
}

export function StudioContextualWorkspace({
  activeDrawer,
  controller,
  onClose,
  onOpenAttentionPolicy,
  onOpenSource,
  onRecoverOptionalSurface,
  onViewportPreferencesChange,
  shouldForceOptionalSurfaceFailure,
  viewportPreferences,
  visitedDrawers
}: StudioContextualWorkspaceProps) {
  const { snapshot } = controller;
  return (
    <>
      {visitedDrawers.has('properties') ? (
        <Box hidden={activeDrawer !== 'properties'} id="studio-properties-workspace" sx={workspaceViewSx}>
          <Suspense fallback={<Box>Opening Properties...</Box>}>
            <PropertiesWorkspace
              candidate={controller.stylesheetCandidate}
              onApplyAttentionAction={controller.applyAttentionAction}
              onApplyStyle={controller.applyStylesheetCandidate}
              onCollapse={onClose}
              onCommitObject={controller.commitInspector}
              onCommitStyle={controller.commitCandidateStyle}
              onCommitViewport={controller.commitViewport}
              onCopyId={(id) => {
                void controller.copyObjectId(id);
              }}
              onOpenAttentionPolicy={onOpenAttentionPolicy}
              onOpenSource={onOpenSource}
              onPreviewObjectIdRename={controller.previewObjectIdRename}
              onRenameObjectId={controller.renameObjectId}
              onRevertStyle={controller.revertStylesheetCandidate}
              onUnsetObject={controller.unsetInspector}
              onUnsetStyle={controller.unsetCandidateStyle}
              onViewportPreferencesChange={onViewportPreferencesChange}
              snapshot={snapshot}
              viewportPreferences={viewportPreferences}
            />
          </Suspense>
        </Box>
      ) : null}
      {visitedDrawers.has('mapper') ? (
        <Box hidden={activeDrawer !== 'mapper'} id="studio-mapper-workspace" sx={workspaceViewSx}>
          <Suspense fallback={<Box>Opening telemetry mapper...</Box>}>
            <StudioOptionalSurfaceBoundary
              message="Telemetry mapper is unavailable."
              onClose={onClose}
              onRetry={onRecoverOptionalSurface}
              panelLabel="Telemetry mapper workspace"
              resetKey={activeDrawer === 'mapper' ? 'open' : 'closed'}
              surfaceLabel="Telemetry mapper"
            >
              {activeDrawer === 'mapper' && shouldForceOptionalSurfaceFailure('mapper') ? (
                <StudioOptionalSurfaceFailureProbe surface="mapper" />
              ) : null}
              <MapperWorkspace
                onClose={onClose}
                onCommitField={controller.commitMapperField}
                onCommitProposal={controller.commitMapperProposal}
                onCommitStyle={controller.commitMapperStyle}
                onCreateRule={controller.createMapperRule}
                onExport={() => void controller.exportMapper()}
                onIngestSamples={controller.setMapperSampleInput}
                onOpenSource={(path) => onOpenSource('mapper', path)}
                onProposeMetric={controller.proposeMapperMetric}
                onRemove={controller.removeMapper}
                onSelectCoverageObject={(kind, id) =>
                  controller.setSelection([{ id, kind: kind as StudioSelection['kind'] }])
                }
                onUnsetField={controller.unsetMapperField}
                onUnsetStyle={controller.unsetMapperStyle}
                profile={controller.authoringProfile}
                proposal={controller.mapperProposal}
                snapshot={snapshot}
                variant="panel"
              />
            </StudioOptionalSurfaceBoundary>
          </Suspense>
        </Box>
      ) : null}
    </>
  );
}

interface StudioProjectSourceProps {
  activeDocument: StudioDocumentKind;
  attentionExpanded: boolean;
  controller: StudioController;
  disabled: boolean;
  hiddenLayerIds: string[];
  hostName: string;
  onOpenAsset(asset: StudioAsset): void;
  onOpenContext(drawer: StudioContextDrawer): void;
  onOpenDocument(document: StudioDocumentKind, path?: Array<string | number>): void;
  onOpenProblem(diagnostic: StudioDiagnostic): void;
  onAttentionExpandedChange(expanded: boolean): void;
  setHiddenLayerIds(layerIds: string[]): void;
}

export function StudioProjectSource({
  activeDocument,
  attentionExpanded,
  controller,
  disabled,
  hiddenLayerIds,
  hostName,
  onOpenAsset,
  onOpenContext,
  onOpenDocument,
  onOpenProblem,
  onAttentionExpandedChange,
  setHiddenLayerIds
}: StudioProjectSourceProps) {
  return (
    <Suspense
      fallback={
        <Box aria-label="Loading project source" role="status" sx={{ height: '100%', minHeight: 0, width: '100%' }} />
      }
    >
      <ProjectSourceNavigator
        activeDocument={activeDocument}
        attentionActions={{
          applyAttentionAction: controller.applyAttentionAction
        }}
        attentionExpanded={attentionExpanded}
        authoringDisabled={disabled}
        candidate={controller.stylesheetCandidate}
        hiddenLayerIds={hiddenLayerIds}
        hostName={hostName}
        layerActions={{
          createLayer: controller.createLayer,
          deleteLayer: controller.deleteLayer,
          renameLayer: controller.renameLayer,
          reorderLayer: controller.reorderLayer,
          selectLayer: (layerId) => controller.setSelection([{ id: layerId, kind: 'layer' }]),
          setLayerMembership: controller.setLayerMembership
        }}
        onOpenAsset={onOpenAsset}
        onOpenContext={onOpenContext}
        onOpenDocument={onOpenDocument}
        onOpenProblem={onOpenProblem}
        onAttentionExpandedChange={onAttentionExpandedChange}
        setHiddenLayerIds={setHiddenLayerIds}
        snapshot={controller.snapshot}
        sourceDrafts={controller.sourceDrafts}
      />
    </Suspense>
  );
}
