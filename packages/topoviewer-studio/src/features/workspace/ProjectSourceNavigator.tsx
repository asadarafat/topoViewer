import {
  lazy,
  Suspense,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactElement
} from 'react';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import AddIcon from '@mui/icons-material/Add';
import DataObjectOutlinedIcon from '@mui/icons-material/DataObjectOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FolderOpenOutlinedIcon from '@mui/icons-material/FolderOpenOutlined';
import HubOutlinedIcon from '@mui/icons-material/HubOutlined';
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined';
import PaletteOutlinedIcon from '@mui/icons-material/PaletteOutlined';
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import SensorsOutlinedIcon from '@mui/icons-material/SensorsOutlined';
import FilterCenterFocusOutlinedIcon from '@mui/icons-material/FilterCenterFocusOutlined';
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import Divider from '@mui/material/Divider';
import InputAdornment from '@mui/material/InputAdornment';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type {
  StudioAsset,
  StudioDiagnostic,
  StudioDocumentKind,
  StudioSessionSnapshot
} from '../../contracts/project';
import type {
  StudioSourceDraftController,
  StudioStylesheetCandidateController
} from '../../session';
import { summarizeAuthoringAttention, type AuthoringAttentionAction } from 'topoviewer/authoring/attention';
import {
  StudioAccordion,
  StudioAccordionDetails,
  StudioAccordionSummary,
  StudioIconButton,
  StudioListItemButton,
  StudioTextField
} from '../../ui/controls';
import { studioMuiIconSize } from '../../ui/createStudioTheme';
import { studioSpace } from '../../ui/muiSpacing';
import {
  StudioCalloutIcon,
  StudioObjectDrawerIcon,
  StudioPathIcon,
  StudioRegionIcon,
  StudioShapeIcon,
  StudioTextIcon
} from '../../ui/StudioSemanticIcons';
import { listStudioProjectSources } from './sourceDocumentModel';
import type { StudioContextDrawer } from './workbenchLayout';

const LayerControls = lazy(() =>
  import('../layers/LayerControls').then((module) => ({
    default: module.LayerControls
  }))
);

const AttentionControls = lazy(() =>
  import('../attention/AttentionControls').then((module) => ({
    default: module.AttentionControls
  }))
);

export interface StudioNavigatorLayerActions {
  createLayer(name: string): string | undefined;
  deleteLayer(layerId: string, replacementLayerId?: string): boolean;
  renameLayer(layerId: string, name: string): boolean;
  reorderLayer(layerId: string, targetIndex: number): boolean;
  selectLayer(layerId: string): void;
  setLayerMembership(layerId: string, assigned: boolean): boolean;
}

export interface StudioNavigatorAttentionActions {
  applyAttentionAction(action: AuthoringAttentionAction): Promise<boolean>;
}

interface ProjectSourceNavigatorProps {
  activeDocument: StudioDocumentKind;
  attentionActions: StudioNavigatorAttentionActions;
  authoringDisabled?: boolean;
  candidate: StudioStylesheetCandidateController;
  hiddenLayerIds: string[];
  hostName: string;
  layerActions: StudioNavigatorLayerActions;
  onOpenAsset(asset: StudioAsset): void;
  onOpenContext(drawer: StudioContextDrawer): void;
  onOpenDocument(kind: StudioDocumentKind, path?: Array<string | number>): void;
  onOpenProblem(diagnostic: StudioDiagnostic): void;
  setHiddenLayerIds(layerIds: string[]): void;
  snapshot: StudioSessionSnapshot;
  sourceDrafts: StudioSourceDraftController;
}

const documentIcons: Record<StudioDocumentKind, ReactElement> = {
  mapper: <SensorsOutlinedIcon fontSize="small" />,
  stylesheet: <PaletteOutlinedIcon fontSize="small" />,
  topology: <DataObjectOutlinedIcon fontSize="small" />
};

interface OutlineEntry {
  count: number;
  icon: ReactElement;
  label: string;
  path: Array<string | number>;
}

function matches(query: string, ...values: Array<string | undefined>) {
  const normalized = query.trim().toLocaleLowerCase();
  return !normalized || values.some((value) => value?.toLocaleLowerCase().includes(normalized));
}

export function ProjectSourceNavigator({
  activeDocument,
  attentionActions,
  authoringDisabled = false,
  candidate,
  hiddenLayerIds,
  hostName,
  layerActions,
  onOpenAsset,
  onOpenContext,
  onOpenDocument,
  onOpenProblem,
  setHiddenLayerIds,
  snapshot,
  sourceDrafts
}: ProjectSourceNavigatorProps) {
  const [query, setQuery] = useState('');
  const [attentionExpanded, setAttentionExpanded] = useState(false);
  const [layersExpanded, setLayersExpanded] = useState(false);
  const [createLayerDialogOpen, setCreateLayerDialogOpen] = useState(false);
  const candidateState = useSyncExternalStore(
    candidate.subscribe,
    candidate.getSnapshot,
    candidate.getSnapshot
  );
  const sourceDraftState = useSyncExternalStore(
    sourceDrafts.subscribe,
    sourceDrafts.getSnapshot,
    sourceDrafts.getSnapshot
  );
  const sources = listStudioProjectSources(snapshot, candidateState, sourceDraftState);
  const diagnostics = useMemo(
    () => [
      ...snapshot.projection.diagnostics,
      ...Object.values(snapshot.invalidDrafts).flatMap((draft) => draft?.diagnostics || []),
      ...candidateState.diagnostics.filter(
        (diagnostic) =>
          !snapshot.projection.diagnostics.some(
            (existing) =>
              existing.code === diagnostic.code &&
              existing.document === diagnostic.document &&
              existing.line === diagnostic.line
          )
      )
    ],
    [candidateState.diagnostics, snapshot.invalidDrafts, snapshot.projection.diagnostics]
  );
  const topology = snapshot.projection.document;
  const outline: OutlineEntry[] = [
    {
      count: topology.graph?.layers?.length || 0,
      icon: <LayersOutlinedIcon fontSize="small" />,
      label: 'Layers',
      path: ['graph', 'layers']
    },
    {
      count: topology.graph?.nodes?.length || 0,
      icon: <HubOutlinedIcon fontSize="small" />,
      label: 'Nodes',
      path: ['graph', 'nodes']
    },
    {
      count: topology.graph?.links?.length || 0,
      icon: <AccountTreeOutlinedIcon fontSize="small" />,
      label: 'Edges',
      path: ['graph', 'links']
    },
    {
      count: topology.graph?.paths?.length || 0,
      icon: (
        <StudioPathIcon
          data-material-icon="TimelineOutlined"
          data-studio-semantic-icon="path"
          fontSize="small"
        />
      ),
      label: 'Paths',
      path: ['graph', 'paths']
    },
    {
      count: topology.graph?.regions?.length || 0,
      icon: (
        <StudioRegionIcon
          data-material-icon="SelectAllOutlined"
          data-studio-semantic-icon="region"
          fontSize="small"
        />
      ),
      label: 'Regions',
      path: ['graph', 'regions']
    },
    {
      count: topology.diagram?.shapes?.length || 0,
      icon: (
        <StudioShapeIcon
          data-material-icon="ShapeLineOutlined"
          data-studio-semantic-icon="shape"
          fontSize="small"
        />
      ),
      label: 'Shapes',
      path: ['diagram', 'shapes']
    },
    {
      count: topology.diagram?.callouts?.length || 0,
      icon: (
        <StudioCalloutIcon
          data-material-icon="ChatBubbleOutlineOutlined"
          data-studio-semantic-icon="callout"
          fontSize="small"
        />
      ),
      label: 'Callouts',
      path: ['diagram', 'callouts']
    },
    {
      count: topology.diagram?.texts?.length || 0,
      icon: (
        <StudioTextIcon
          data-material-icon="TextFieldsOutlined"
          data-studio-semantic-icon="text"
          fontSize="small"
        />
      ),
      label: 'Text',
      path: ['diagram', 'texts']
    },
    {
      count: topology.attention ? 1 : 0,
      icon: <FilterCenterFocusOutlinedIcon fontSize="small" />,
      label: 'Attention',
      path: ['attention']
    }
  ];
  const visibleSources = sources.filter((source) =>
    matches(query, source.path, source.label, source.kind)
  );
  const visibleAssets = snapshot.project.assets.filter((asset) =>
    matches(query, asset.path, asset.mediaType)
  );
  const visibleOutline = outline.filter((entry) => matches(query, entry.label));
  const objectCount = outline.reduce((total, entry) => total + (entry.label === 'Attention' ? 0 : entry.count), 0);
  const attentionSummary = summarizeAuthoringAttention(topology);
  const showWorkspace =
    matches(query, snapshot.project.name, 'workspace') ||
    Boolean(visibleSources.length) ||
    Boolean(visibleAssets.length);
  const showAuthoring =
    matches(query, 'Object drawer', 'drag to canvas') ||
    matches(query, 'Style selectors', 'stylesheet') ||
    matches(query, 'Telemetry rules', 'mapper');

  function toggleLayers() {
    setLayersExpanded((expanded) => {
      if (expanded) setCreateLayerDialogOpen(false);
      return !expanded;
    });
  }

  return (
    <Box
      aria-label="Project source"
      component="nav"
      sx={{
        bgcolor: 'background.paper',
        borderRight: 1,
        borderColor: 'divider',
        display: 'grid',
        gridTemplateRows: '38px auto minmax(0, 1fr) auto',
        minHeight: 0,
        minWidth: 0,
        overflow: 'hidden'
      }}
    >
      <Stack
        direction="row"
        sx={{
          alignItems: 'center',
          borderBottom: 1,
          borderColor: 'divider',
          justifyContent: 'space-between',
          minHeight: 38,
          px: studioSpace.space10
        }}
      >
        <Typography component="h2" variant="overline">
          Project source
        </Typography>
        <Typography color="text.secondary" variant="overline">
          {sources.filter((source) => source.exists).length} YAML
        </Typography>
      </Stack>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', p: studioSpace.space8 }}>
        <StudioTextField
          aria-label="Filter project source"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Filter project"
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchOutlinedIcon fontSize="small" />
                </InputAdornment>
              )
            }
          }}
          sx={{ width: '100%', '& .MuiInputBase-root': { height: 30 } }}
          type="search"
          value={query}
        />
      </Box>

      <Box sx={{ minHeight: 0, overflowY: 'auto', p: studioSpace.space6 }}>
        {showWorkspace ? (
          <Box component="section" sx={{ mb: studioSpace.space4 }}>
            <Stack
              direction="row"
              sx={{ alignItems: 'center', justifyContent: 'space-between', minHeight: 27, px: studioSpace.space6 }}
            >
              <Typography color="text.secondary" component="h3" variant="overline">
                Workspace
              </Typography>
              <Typography color="text.secondary" variant="overline">
                v{snapshot.project.metadata.schemaVersion}
              </Typography>
            </Stack>
            {matches(query, snapshot.project.name, 'workspace') ? (
              <StudioListItemButton
                onClick={() => onOpenDocument('topology')}
                sx={{ minHeight: 30, px: studioSpace.space6 }}
              >
                <ListItemIcon sx={{ minWidth: 28 }}>
                  <FolderOpenOutlinedIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={snapshot.project.name}
                  slotProps={{ primary: { noWrap: true, variant: 'body2' } }}
                />
              </StudioListItemButton>
            ) : null}
            {visibleSources.map((source) => (
              <StudioListItemButton
                aria-current={activeDocument === source.kind ? 'page' : undefined}
                key={source.kind}
                onClick={() => onOpenDocument(source.kind)}
                selected={activeDocument === source.kind}
                sx={{ minHeight: 30, pl: studioSpace.space16, pr: studioSpace.space6 }}
                title={source.path}
              >
                <ListItemIcon sx={{ minWidth: 28 }}>
                  {documentIcons[source.kind]}
                </ListItemIcon>
                <ListItemText
                  primary={source.path.split(/[\\/]/).filter(Boolean).at(-1) || source.path}
                  slotProps={{
                    primary: { noWrap: true, variant: 'body2' }
                  }}
                  sx={{ minWidth: 0 }}
                />
                {!source.exists ? (
                  <Typography
                    color="text.secondary"
                    data-source-status="optional"
                    noWrap
                    sx={{ flexShrink: 0, ml: studioSpace.space6 }}
                    title="Optional source is not created"
                    variant="caption"
                  >
                    Optional
                  </Typography>
                ) : null}
                {source.invalid ? (
                  <Typography aria-label={`${source.path} has an invalid draft`} color="error" variant="caption">
                    !
                  </Typography>
                ) : source.dirty ? (
                  <Box
                    aria-label={`${source.path} is modified`}
                    component="span"
                    sx={{ bgcolor: 'warning.main', borderRadius: '50%', height: 6, width: 6 }}
                  />
                ) : null}
              </StudioListItemButton>
            ))}
            {visibleAssets.length ? (
              <StudioAccordion
                disableGutters
                elevation={0}
                square
                sx={{ '&::before': { display: 'none' } }}
              >
                <StudioAccordionSummary
                  aria-controls="studio-project-assets-content"
                  expandIcon={<ExpandMoreIcon fontSize="small" />}
                  id="studio-project-assets-heading"
                  sx={{ minHeight: 30, pl: studioSpace.space16, pr: studioSpace.space6 }}
                >
                  <ListItemIcon sx={{ minWidth: 28 }}>
                    <FolderOpenOutlinedIcon fontSize="small" />
                  </ListItemIcon>
                  <Typography sx={{ flex: 1 }} variant="body2">
                    assets
                  </Typography>
                  <Typography color="text.secondary" variant="caption">
                    {snapshot.project.assets.length}
                  </Typography>
                </StudioAccordionSummary>
                <StudioAccordionDetails id="studio-project-assets-content" sx={{ p: 0 }}>
                  {visibleAssets.map((asset) => (
                    <StudioListItemButton
                      aria-label={`Preview asset ${asset.path}`}
                      key={asset.path}
                      onClick={() => onOpenAsset(asset)}
                      sx={{ minHeight: 28, pl: studioSpace.space24, pr: studioSpace.space6 }}
                    >
                      <ListItemIcon sx={{ minWidth: 28 }}>
                        <DataObjectOutlinedIcon
                          color="action"
                          sx={{ fontSize: studioMuiIconSize.inline }}
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={asset.path}
                        secondary={`${asset.mediaType} · ${asset.size.toLocaleString()} bytes`}
                        slotProps={{
                          primary: { noWrap: true, title: asset.path, variant: 'caption' },
                          secondary: { noWrap: true, variant: 'caption' }
                        }}
                      />
                    </StudioListItemButton>
                  ))}
                </StudioAccordionDetails>
              </StudioAccordion>
            ) : null}
          </Box>
        ) : null}

        {showWorkspace && showAuthoring ? (
          <Divider
            aria-label="Workspace and Authoring"
            sx={{ borderColor: 'divider', my: studioSpace.space4 }}
          />
        ) : null}

        {showAuthoring ? (
          <Box component="section" sx={{ mb: studioSpace.space4 }}>
            <Stack
              direction="row"
              sx={{ alignItems: 'center', justifyContent: 'space-between', minHeight: 27, px: studioSpace.space6 }}
            >
              <Typography color="text.secondary" component="h3" variant="overline">
                Authoring
              </Typography>
              <Typography color="text.secondary" variant="overline">
                Edit mode
              </Typography>
            </Stack>
            {matches(query, 'Object drawer', 'drag to canvas') ? (
              <StudioListItemButton
                aria-label="Object drawer"
                disabled={authoringDisabled}
                onClick={() => onOpenContext('add')}
                sx={{ minHeight: 30, px: studioSpace.space6 }}
              >
                <ListItemIcon sx={{ minWidth: 28 }}>
                  <StudioObjectDrawerIcon
                    data-material-icon="VerticalSplitOutlined"
                    data-studio-semantic-icon="object-drawer"
                    fontSize="small"
                  />
                </ListItemIcon>
                <ListItemText primary="Object drawer" slotProps={{ primary: { variant: 'body2' } }} />
                <Typography color="text.secondary" variant="caption">
                  {authoringDisabled ? 'source invalid' : 'drag to canvas'}
                </Typography>
              </StudioListItemButton>
            ) : null}
            {matches(query, 'Style selectors', 'stylesheet') ? (
              <StudioListItemButton
                onClick={() => onOpenContext('properties')}
                sx={{ minHeight: 30, px: studioSpace.space6 }}
              >
                <ListItemIcon sx={{ minWidth: 28 }}>
                  <PaletteOutlinedIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Style selectors" slotProps={{ primary: { variant: 'body2' } }} />
                <Typography color="text.secondary" variant="caption">
                  {(topology.stylesheet || []).length || 'YAML'}
                </Typography>
              </StudioListItemButton>
            ) : null}
            {matches(query, 'Telemetry rules', 'mapper') ? (
              <StudioListItemButton
                onClick={() => onOpenContext('mapper')}
                sx={{ minHeight: 30, px: studioSpace.space6 }}
              >
                <ListItemIcon sx={{ minWidth: 28 }}>
                  <SensorsOutlinedIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Telemetry rules" slotProps={{ primary: { variant: 'body2' } }} />
                <Typography color="text.secondary" variant="caption">
                  {snapshot.project.documents.mapper ? 'Visual' : 'Create'}
                </Typography>
              </StudioListItemButton>
            ) : null}
          </Box>
        ) : null}

        {visibleOutline.length && (showWorkspace || showAuthoring) ? (
          <Divider
            aria-label={
              showAuthoring
                ? 'Authoring and Topology outline'
                : 'Workspace and Topology outline'
            }
            sx={{ borderColor: 'divider', my: studioSpace.space4 }}
          />
        ) : null}

        {visibleOutline.length ? (
          <Box component="section" sx={{ mb: studioSpace.space8 }}>
            <Stack
              direction="row"
              sx={{ alignItems: 'center', justifyContent: 'space-between', minHeight: 27, px: studioSpace.space6 }}
            >
              <Typography color="text.secondary" component="h3" variant="overline">
                Topology outline
              </Typography>
              <Typography color="text.secondary" variant="overline">
                {objectCount} objects
              </Typography>
            </Stack>
            {visibleOutline.map((entry) =>
              entry.label === 'Layers' ? (
                <Box key={entry.label}>
                  <Box
                    sx={{
                      alignItems: 'center',
                      display: 'grid',
                      gridTemplateColumns: 'minmax(0, 1fr) 30px 30px'
                    }}
                  >
                    <StudioListItemButton
                      aria-controls="studio-project-layers-content"
                      aria-expanded={layersExpanded}
                      onClick={toggleLayers}
                      sx={{ minHeight: 30, px: studioSpace.space6 }}
                    >
                      <ListItemIcon sx={{ minWidth: 28 }}>{entry.icon}</ListItemIcon>
                      <ListItemText
                        primary={entry.label}
                        slotProps={{ primary: { noWrap: true, variant: 'body2' } }}
                      />
                      <Typography color="text.secondary" variant="caption">
                        {entry.count}
                      </Typography>
                    </StudioListItemButton>
                    <StudioIconButton
                      aria-label="Add layer"
                      disabled={authoringDisabled}
                      onClick={() => {
                        setLayersExpanded(true);
                        setCreateLayerDialogOpen(true);
                      }}
                      size="small"
                      title={authoringDisabled ? 'Fix the invalid source draft before adding a layer' : 'Add layer'}
                    >
                      <AddIcon fontSize="small" />
                    </StudioIconButton>
                    <StudioIconButton
                      aria-label={layersExpanded ? 'Collapse layers' : 'Expand layers'}
                      aria-controls="studio-project-layers-content"
                      aria-expanded={layersExpanded}
                      onClick={toggleLayers}
                      size="small"
                      title={layersExpanded ? 'Collapse layers' : 'Expand layers'}
                    >
                      <ExpandMoreIcon
                        fontSize="small"
                        sx={{ transform: layersExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: (theme) => theme.transitions.create('transform') }}
                      />
                    </StudioIconButton>
                  </Box>
                  <Collapse in={layersExpanded} timeout="auto" unmountOnExit>
                    {layersExpanded ? (
                      <Box id="studio-project-layers-content" sx={{ p: studioSpace.space6 }}>
                        <Suspense
                          fallback={
                            <Typography color="text.secondary" role="status" variant="caption">
                              Opening layer controls...
                            </Typography>
                          }
                        >
                          <LayerControls
                            createDialogOpen={createLayerDialogOpen}
                            createLayer={layerActions.createLayer}
                            deleteLayer={layerActions.deleteLayer}
                            disabled={authoringDisabled}
                            hiddenLayerIds={hiddenLayerIds}
                            onCreateDialogClose={() => setCreateLayerDialogOpen(false)}
                            onOpenSource={() => onOpenDocument('topology', entry.path)}
                            onSelectLayer={(layerId) => {
                              layerActions.selectLayer(layerId);
                              onOpenContext('properties');
                            }}
                            renameLayer={layerActions.renameLayer}
                            reorderLayer={layerActions.reorderLayer}
                            setHiddenLayerIds={setHiddenLayerIds}
                            setLayerMembership={layerActions.setLayerMembership}
                            snapshot={snapshot}
                          />
                        </Suspense>
                      </Box>
                    ) : null}
                  </Collapse>
                </Box>
              ) : entry.label === 'Attention' ? (
                <Box key={entry.label}>
                  <Box
                    sx={{
                      alignItems: 'center',
                      display: 'grid',
                      gridTemplateColumns: 'minmax(0, 1fr) 30px'
                    }}
                  >
                    <StudioListItemButton
                      aria-controls="studio-project-attention-content"
                      aria-expanded={attentionExpanded}
                      onClick={() => setAttentionExpanded((expanded) => !expanded)}
                      sx={{ minHeight: 30, px: studioSpace.space6 }}
                    >
                      <ListItemIcon sx={{ minWidth: 28 }}>{entry.icon}</ListItemIcon>
                      <ListItemText
                        primary={entry.label}
                        slotProps={{ primary: { noWrap: true, variant: 'body2' } }}
                      />
                      <Typography color="text.secondary" variant="caption">
                        {attentionSummary.configured
                          ? `${attentionSummary.activeFeatureCount} active`
                          : 'Not set'}
                      </Typography>
                    </StudioListItemButton>
                    <StudioIconButton
                      aria-label={attentionExpanded ? 'Collapse attention' : 'Expand attention'}
                      aria-controls="studio-project-attention-content"
                      aria-expanded={attentionExpanded}
                      onClick={() => setAttentionExpanded((expanded) => !expanded)}
                      size="small"
                      title={attentionExpanded ? 'Collapse attention' : 'Expand attention'}
                    >
                      <ExpandMoreIcon
                        fontSize="small"
                        sx={{
                          transform: attentionExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: (theme) => theme.transitions.create('transform')
                        }}
                      />
                    </StudioIconButton>
                  </Box>
                  <Collapse in={attentionExpanded} timeout="auto" unmountOnExit>
                    {attentionExpanded ? (
                      <Box id="studio-project-attention-content" sx={{ p: studioSpace.space8 }}>
                        <Suspense
                          fallback={
                            <Typography color="text.secondary" role="status" variant="caption">
                              Opening attention controls...
                            </Typography>
                          }
                        >
                          <AttentionControls
                            applyAction={attentionActions.applyAttentionAction}
                            disabled={authoringDisabled}
                            onOpenSource={() => onOpenDocument('topology', entry.path)}
                            snapshot={snapshot}
                          />
                        </Suspense>
                      </Box>
                    ) : null}
                  </Collapse>
                </Box>
              ) : (
                <StudioListItemButton
                  key={entry.label}
                  onClick={() => onOpenDocument('topology', entry.path)}
                  sx={{ minHeight: 30, px: studioSpace.space6 }}
                >
                  <ListItemIcon sx={{ minWidth: 28 }}>{entry.icon}</ListItemIcon>
                  <ListItemText
                    primary={entry.label}
                    slotProps={{ primary: { noWrap: true, variant: 'body2' } }}
                  />
                  <Typography color="text.secondary" variant="caption">
                    {entry.count}
                  </Typography>
                </StudioListItemButton>
              )
            )}
          </Box>
        ) : null}

        {diagnostics.length && matches(query, 'Problems', ...diagnostics.map((diagnostic) => diagnostic.message)) ? (
          <Box component="section">
            <Typography color="text.secondary" component="h3" sx={{ minHeight: 27, px: studioSpace.space6 }} variant="overline">
              Problems
            </Typography>
            {diagnostics.slice(0, 20).map((diagnostic, index) => (
              <StudioListItemButton
                key={`${diagnostic.document}-${diagnostic.code}-${index}`}
                onClick={() => onOpenProblem(diagnostic)}
                sx={{ alignItems: 'flex-start', minHeight: 30, px: studioSpace.space6 }}
              >
                <ListItemIcon sx={{ minWidth: 28 }}>
                  <ReportProblemOutlinedIcon
                    color={diagnostic.severity === 'error' ? 'error' : 'warning'}
                    fontSize="small"
                  />
                </ListItemIcon>
                <ListItemText
                  primary={diagnostic.message}
                  secondary={`${diagnostic.document}${diagnostic.line ? `:${diagnostic.line}` : ''}`}
                  slotProps={{
                    primary: { noWrap: true, variant: 'caption' },
                    secondary: { noWrap: true, variant: 'caption' }
                  }}
                />
              </StudioListItemButton>
            ))}
          </Box>
        ) : null}
      </Box>

      <Box sx={{ borderTop: 1, borderColor: 'divider', p: studioSpace.space6 }}>
        <Stack
          direction="row"
          sx={{
            alignItems: 'center',
            borderRadius: 1,
            minHeight: 30,
            px: studioSpace.space6
          }}
        >
          <Box
            aria-hidden="true"
            sx={{ bgcolor: 'success.main', borderRadius: '50%', height: 7, mr: studioSpace.space8, width: 7 }}
          />
          <Typography noWrap sx={{ flex: 1 }} variant="caption">
            {hostName}
          </Typography>
          <Typography color="text.secondary" variant="caption">
            watching
          </Typography>
        </Stack>
      </Box>
    </Box>
  );
}
