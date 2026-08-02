import { useDeferredValue, useMemo, useState, type ReactNode } from 'react';
import DataObjectOutlinedIcon from '@mui/icons-material/DataObjectOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FilterCenterFocusOutlinedIcon from '@mui/icons-material/FilterCenterFocusOutlined';
import PaletteOutlinedIcon from '@mui/icons-material/PaletteOutlined';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Collapse from '@mui/material/Collapse';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { buildAttentionIndexCached } from 'topoviewer';
import {
  authoringObjectSourcePath,
  findAuthoringObject,
  type AuthoringObjectSelection
} from 'topoviewer/authoring';
import type { AuthoringAttentionAction } from 'topoviewer/authoring/attention';
import type {
  StudioIdentityRenamePreview,
  StudioStyleEditRequest,
  StudioStyleUnsetRequest
} from '../../contracts/inspector';
import type {
  StudioDocumentKind,
  StudioSessionSnapshot
} from '../../contracts/project';
import type { StudioStylesheetCandidateController } from '../../session';
import { StudioButton, StudioButtonBase, StudioIconButton } from '../../ui/controls';
import { studioSpace } from '../../ui/muiSpacing';
import { StudioPanelHeader } from '../../ui/StudioPanel';
import { Inspector } from './Inspector';
import { StyleCandidateFooter } from './StyleCandidateFooter';
import { StyleWorkspace } from './StyleWorkspace';
import { projectStudioAttentionSelection } from '../attention/attentionSelection';
import type { StudioViewportPreferences } from '../viewport/types';

function EditSection({
  action,
  children,
  icon,
  id,
  title
}: {
  action?: ReactNode;
  children: ReactNode;
  icon: ReactNode;
  id: string;
  title: string;
}) {
  const contentId = `${id}-content`;
  const headingId = `${id}-heading`;
  const [expanded, setExpanded] = useState(true);

  return (
    <Box className="studio-edit-section">
      <Box
        sx={{
          alignItems: 'stretch',
          display: 'grid',
          gridTemplateColumns: action ? 'minmax(0, 1fr) auto' : 'minmax(0, 1fr)'
        }}
      >
        <StudioButtonBase
          aria-controls={contentId}
          aria-expanded={expanded}
          className="studio-edit-section-heading"
          id={headingId}
          onClick={() => setExpanded((current) => !current)}
          sx={{
            alignItems: 'center',
            display: 'flex',
            minHeight: 40,
            px: studioSpace.space12,
            textAlign: 'left',
            width: '100%'
          }}
        >
          <Box
            sx={{
              alignItems: 'center',
              display: 'flex',
              gap: studioSpace.space8,
              minWidth: 0,
              width: '100%'
            }}
          >
            {icon}
            <Typography component="h3" sx={{ flex: 1 }} variant="subtitle2">
              {title}
            </Typography>
            <ExpandMoreIcon
              aria-hidden="true"
              fontSize="small"
              sx={{
                transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: (theme) =>
                  theme.transitions.create('transform', {
                    duration: theme.transitions.duration.shortest
                  })
              }}
            />
          </Box>
        </StudioButtonBase>
        {action ? (
          <Box sx={{ alignItems: 'center', display: 'flex', pr: studioSpace.space8 }}>
            {action}
          </Box>
        ) : null}
      </Box>
      <Collapse in={expanded}>
        <Box aria-labelledby={headingId} id={contentId} role="region">
          {children}
        </Box>
      </Collapse>
    </Box>
  );
}

interface PropertiesWorkspaceProps {
  candidate: StudioStylesheetCandidateController;
  onApplyStyle(): boolean;
  onApplyAttentionAction(action: AuthoringAttentionAction): Promise<boolean>;
  onCollapse(): void;
  onCommitObject(
    path: Array<string | number>,
    value: unknown,
    scopePath: Array<string | number>
  ): void;
  onCommitStyle(request: StudioStyleEditRequest): boolean;
  onCommitViewport(
    path: Array<string | number>,
    value: unknown,
    scopePath: Array<string | number>
  ): void;
  onCopyId(id: string): void;
  onOpenSource(document: StudioDocumentKind, path?: Array<string | number>): void;
  onOpenAttentionPolicy(): void;
  onPreviewObjectIdRename(
    selection: AuthoringObjectSelection,
    nextId: string
  ): StudioIdentityRenamePreview;
  onRenameObjectId(selection: AuthoringObjectSelection, nextId: string): boolean;
  onRevertStyle(): boolean;
  onUnsetObject(
    path: Array<string | number>,
    scopePath: Array<string | number>
  ): void;
  onUnsetStyle(request: StudioStyleUnsetRequest): boolean;
  onViewportPreferencesChange(patch: Partial<StudioViewportPreferences>): void;
  snapshot: StudioSessionSnapshot;
  viewportPreferences: StudioViewportPreferences;
}

export function PropertiesWorkspace({
  candidate,
  onApplyAttentionAction,
  onApplyStyle,
  onCollapse,
  onCommitObject,
  onCommitStyle,
  onCommitViewport,
  onCopyId,
  onOpenSource,
  onOpenAttentionPolicy,
  onPreviewObjectIdRename,
  onRenameObjectId,
  onRevertStyle,
  onUnsetObject,
  onUnsetStyle,
  onViewportPreferencesChange,
  snapshot,
  viewportPreferences
}: PropertiesWorkspaceProps) {
  const selection = snapshot.selection[0];
  const selectedObject = useMemo(
    () =>
      findAuthoringObject(
        snapshot.projection.document,
        selection as AuthoringObjectSelection | undefined
      ),
    [selection, snapshot.projection.document]
  );
  const selectedPath = useMemo(
    () =>
      selection
        ? authoringObjectSourcePath(
            snapshot.projection.document,
            selection as AuthoringObjectSelection
          )
        : undefined,
    [selection, snapshot.projection.document]
  );
  const selectionKinds = [...new Set(snapshot.selection.map((item) => item.kind))];
  const attentionIndex = useMemo(
    () => buildAttentionIndexCached(snapshot.projection.document),
    [snapshot.projection.document]
  );
  const attentionSelection = useMemo(
    () => projectStudioAttentionSelection(attentionIndex, snapshot.selection),
    [attentionIndex, snapshot.selection]
  );
  const focusedIds = snapshot.projection.document.attention?.query?.ids || [];
  const focusedIdSet = new Set(focusedIds);
  const focusSelectionIds = attentionSelection.focusIds;
  const addFocusIds = [
    ...focusedIds,
    ...focusSelectionIds.filter((id) => !focusedIdSet.has(id))
  ];
  const removeFocusIdSet = new Set(focusSelectionIds);
  const remainingFocusIds = focusedIds.filter((id) => !removeFocusIdSet.has(id));
  const aggregateCandidate = attentionSelection.aggregateCandidate;
  const aggregateAlreadyConfigured = Boolean(
    aggregateCandidate && snapshot.projection.document.attention?.aggregate?.groups?.some((group) =>
      group.by === aggregateCandidate.by &&
      (group.by === 'region' ? group.regionId : group.parentId) === aggregateCandidate.sourceId
    )
  );
  const deferredPropertiesSnapshot = useDeferredValue(snapshot);
  const propertiesSelectionPending =
    deferredPropertiesSnapshot.selection.map((item) => `${item.kind}:${item.id}`).join('|')
    !== snapshot.selection.map((item) => `${item.kind}:${item.id}`).join('|');
  const topologyBlocked = Boolean(snapshot.invalidDrafts.topology);
  const selectionLabel =
    snapshot.selection.length > 1
      ? `${snapshot.selection.length} ${
          selectionKinds.length === 1 ? `${selectionKinds[0]}s` : 'objects'
        }`
      : String(
          (selectedObject?.labels &&
          typeof selectedObject.labels === 'object' &&
          !Array.isArray(selectedObject.labels)
            ? (selectedObject.labels as Record<string, unknown>).name
            : undefined) ||
            selectedObject?.title ||
            selectedObject?.text ||
            selection?.id ||
            'Canvas'
        );
  const selectionId =
    snapshot.selection.length > 1
      ? snapshot.selection.map((item) => item.id).join(', ')
      : selection?.id || 'Viewport and interaction settings';
  const sourceButton = (
    document: StudioDocumentKind,
    path: Array<string | number>,
    label: string,
    icon: ReactNode
  ) => (
    <StudioIconButton
      aria-label={label}
      onClick={(event) => {
        event.stopPropagation();
        onOpenSource(document, path);
      }}
      title={label}
    >
      {icon}
    </StudioIconButton>
  );

  return (
    <Box
      aria-label="Properties workspace"
      className="studio-properties-workspace"
      component="aside"
      data-mode="visual"
      sx={{
        bgcolor: 'background.paper',
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr)',
        gridTemplateRows: 'auto auto minmax(0, 1fr) auto',
        height: '100%',
        minHeight: 0,
        minWidth: 0,
        overflow: 'hidden'
      }}
    >
      <StudioPanelHeader onCollapse={onCollapse} title="Properties" />

      <Stack
        className="studio-edit-selection-summary"
        direction="row"
        spacing={studioSpace.space8}
        sx={{
          alignItems: 'center',
          borderBottom: 1,
          borderColor: 'divider',
          minHeight: 48,
          minWidth: 0,
          px: studioSpace.space12,
          py: studioSpace.space6
        }}
      >
        <Avatar
          aria-hidden="true"
          sx={{
            bgcolor: 'background.default',
            border: 1,
            borderColor: 'divider',
            color: 'text.secondary',
            height: 28,
            width: 28
          }}
          variant="rounded"
        >
          {(selection?.kind || 'canvas').slice(0, 1).toLocaleUpperCase()}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography component="div" noWrap title={selectionLabel} variant="subtitle2">
            {selectionLabel}
          </Typography>
          <Typography
            color="text.secondary"
            component="div"
            noWrap
            title={selectionId}
            variant="caption"
          >
            {selectionId}
          </Typography>
        </Box>
        {selection ? <Chip label={selection.kind} size="small" variant="outlined" /> : null}
      </Stack>

      <Box
        className="studio-edit-visual"
        component="section"
        sx={{ minHeight: 0, minWidth: 0, overflowY: 'auto' }}
      >
        {selection ? (
          <>
            <EditSection
              action={sourceButton(
                'topology',
                selectedPath || ['graph'],
                'Open topology source',
                <DataObjectOutlinedIcon fontSize="small" />
              )}
              icon={<TuneOutlinedIcon fontSize="small" />}
              id="studio-edit-topology"
              title="Topology"
            >
              {topologyBlocked ? (
                <Alert severity="warning" sx={{ m: studioSpace.space8 }}>
                  Correct or revert the invalid topology draft before changing object facts visually.
                </Alert>
              ) : null}
              <Box
                aria-busy={propertiesSelectionPending || undefined}
                component="fieldset"
                disabled={topologyBlocked || propertiesSelectionPending}
                sx={{
                  border: 0,
                  m: 0,
                  minWidth: 0,
                  opacity: propertiesSelectionPending ? 0.72 : 1,
                  p: 0,
                  pointerEvents: propertiesSelectionPending ? 'none' : 'auto',
                  transition: (theme) =>
                    theme.transitions.create('opacity', {
                      duration: theme.transitions.duration.shortest
                    })
                }}
              >
                <Inspector
                  ariaLabel="Topology properties"
                  documentView="object"
                  embedded
                  onCommit={onCommitObject}
                  onCommitViewport={onCommitViewport}
                  onCopyId={onCopyId}
                  onPreviewIdRename={onPreviewObjectIdRename}
                  onRenameId={onRenameObjectId}
                  onUnset={onUnsetObject}
                  onViewportPreferencesChange={onViewportPreferencesChange}
                  snapshot={deferredPropertiesSnapshot}
                  viewportPreferences={viewportPreferences}
                />
              </Box>
            </EditSection>
            <EditSection
              icon={<FilterCenterFocusOutlinedIcon fontSize="small" />}
              id="studio-edit-attention"
              title="Attention"
            >
              <Box sx={{ px: studioSpace.space12, pb: studioSpace.space12 }}>
                <Typography color="text.secondary" sx={{ mb: studioSpace.space8 }} variant="caption">
                  These shortcuts update the project-wide Attention policy. Global modes and parallel-link grouping stay in the policy manager.
                </Typography>
                {attentionSelection.unsupportedCount ? (
                  <Typography color="text.secondary" sx={{ display: 'block', mb: studioSpace.space8 }} variant="caption">
                    {attentionSelection.unsupportedCount} selected {attentionSelection.unsupportedCount === 1 ? 'object is' : 'objects are'} not a supported focus target.
                  </Typography>
                ) : null}
                <Stack
                  direction="row"
                  sx={{ flexWrap: 'wrap', gap: studioSpace.space6 }}
                  useFlexGap
                >
                  <StudioButton
                    disabled={topologyBlocked || propertiesSelectionPending || !focusSelectionIds.length}
                    onClick={() => void onApplyAttentionAction({ type: 'set-focus-ids', ids: focusSelectionIds })}
                    size="small"
                    variant="outlined"
                  >
                    Focus selection
                  </StudioButton>
                  <StudioButton
                    disabled={
                      topologyBlocked ||
                      propertiesSelectionPending ||
                      !focusSelectionIds.length ||
                      !focusedIds.length ||
                      addFocusIds.length === focusedIds.length
                    }
                    onClick={() => void onApplyAttentionAction({ type: 'set-focus-ids', ids: addFocusIds })}
                    size="small"
                  >
                    Add selection to focus
                  </StudioButton>
                  <StudioButton
                    disabled={
                      topologyBlocked ||
                      propertiesSelectionPending ||
                      !focusSelectionIds.some((id) => focusedIdSet.has(id))
                    }
                    onClick={() => void onApplyAttentionAction({ type: 'set-focus-ids', ids: remainingFocusIds })}
                    size="small"
                  >
                    Remove selection from focus
                  </StudioButton>
                  <StudioButton
                    disabled={
                      topologyBlocked ||
                      propertiesSelectionPending ||
                      !aggregateCandidate ||
                      aggregateAlreadyConfigured
                    }
                    onClick={() => aggregateCandidate && void onApplyAttentionAction({
                      type: 'add-aggregate-group',
                      ...aggregateCandidate
                    })}
                    size="small"
                  >
                    Aggregate selected structure
                  </StudioButton>
                </Stack>
                <Typography color="text.secondary" sx={{ display: 'block', mt: studioSpace.space8 }} variant="caption">
                  {aggregateCandidate
                    ? aggregateAlreadyConfigured
                      ? `${aggregateCandidate.sourceId} is already aggregated.`
                      : `${aggregateCandidate.by === 'region' ? 'Region' : 'Parent'} ${aggregateCandidate.sourceId} can be aggregated.`
                    : 'Select one region or a parent node with children to create an aggregate.'}
                </Typography>
                <StudioButton
                  onClick={onOpenAttentionPolicy}
                  size="small"
                  startIcon={<FilterCenterFocusOutlinedIcon fontSize="small" />}
                  sx={{ mt: studioSpace.space8 }}
                >
                  Open Attention policy
                </StudioButton>
              </Box>
            </EditSection>
            <EditSection
              action={sourceButton(
                'stylesheet',
                ['stylesheet'],
                'Open stylesheet source',
                <DataObjectOutlinedIcon fontSize="small" />
              )}
              icon={<PaletteOutlinedIcon fontSize="small" />}
              id="studio-edit-appearance"
              title="Appearance"
            >
              <Box
                aria-busy={propertiesSelectionPending || undefined}
                component="fieldset"
                disabled={propertiesSelectionPending}
                sx={{
                  border: 0,
                  m: 0,
                  opacity: propertiesSelectionPending ? 0.72 : 1,
                  p: 0,
                  pointerEvents: propertiesSelectionPending ? 'none' : 'auto',
                  transition: (theme) =>
                    theme.transitions.create('opacity', {
                      duration: theme.transitions.duration.shortest
                    })
                }}
              >
                <StyleWorkspace
                  candidate={candidate}
                  onApply={onApplyStyle}
                  onCommit={onCommitStyle}
                  onRevert={onRevertStyle}
                  onUnset={onUnsetStyle}
                  showFooter={false}
                  showSummary={false}
                  snapshot={deferredPropertiesSnapshot}
                />
              </Box>
            </EditSection>
          </>
        ) : (
          <Box>
            <Box
              sx={{
                alignItems: 'center',
                display: 'flex',
                justifyContent: 'flex-end',
                px: studioSpace.space8,
                pt: studioSpace.space6
              }}
            >
              {sourceButton(
                'topology',
                ['graph'],
                'Open canvas source',
                <DataObjectOutlinedIcon fontSize="small" />
              )}
            </Box>
            <Inspector
              ariaLabel="Canvas properties"
              documentView="viewport"
              embedded
              onCommit={onCommitObject}
              onCommitViewport={onCommitViewport}
              onCopyId={onCopyId}
              onPreviewIdRename={onPreviewObjectIdRename}
              onRenameId={onRenameObjectId}
              onUnset={onUnsetObject}
              onViewportPreferencesChange={onViewportPreferencesChange}
              snapshot={snapshot}
              viewportPreferences={viewportPreferences}
            />
          </Box>
        )}
      </Box>
      <StyleCandidateFooter
        candidate={candidate}
        onApply={onApplyStyle}
        onRevert={onRevertStyle}
      />
    </Box>
  );
}
