import {
  lazy,
  Suspense,
  type Dispatch,
  type RefObject,
  type SetStateAction
} from 'react';
import CoPresentIcon from '@mui/icons-material/CoPresent';
import FeedbackOutlinedIcon from '@mui/icons-material/FeedbackOutlined';
import IosShareIcon from '@mui/icons-material/IosShare';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import RedoIcon from '@mui/icons-material/Redo';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import UndoIcon from '@mui/icons-material/Undo';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import type { StudioProjectLifecycleActions } from '../features/projects/ProjectMenu';
import { StudioSaveButton, StudioSavedState } from '../features/inspector/StyleCandidateFooter';
import type { StudioDockView } from '../features/workspace/workbenchLayout';
import { studioSpace } from '../ui/muiSpacing';
import { studioGeometry } from '../ui/studioTokens';
import { StudioIconButton, StudioMenu, StudioMenuItem, StudioMenuItemIcon, StudioMenuItemText } from '../ui/controls';
import { StudioObjectDrawerIcon } from '../ui/StudioSemanticIcons';
import type { useStudioColorScheme } from '../ui/StudioThemeProvider';
import { StudioAppearanceControl } from './StudioAppearanceControl';
import type { useStudioController } from './useStudioController';

const ProjectMenu = lazy(() =>
  import('../features/projects/ProjectDialogs').then((module) => ({
    default: module.ProjectMenu
  }))
);
const studioFeedbackUrl = 'https://github.com/asadarafat/topoviewer/issues/new?template=studio_preview_feedback.yml';

interface HeaderActions {
  enterPresentation(): void;
  openExportPanel(): void;
  reloadProject(): Promise<void>;
  saveProject(): Promise<void>;
  setActiveDock: Dispatch<SetStateAction<StudioDockView>>;
  setCommandPaletteOpen: Dispatch<SetStateAction<boolean>>;
  setDockCollapsed: Dispatch<SetStateAction<boolean>>;
  setHeaderActionsAnchor: Dispatch<SetStateAction<HTMLElement | null>>;
  setMobileNavigatorOpen: Dispatch<SetStateAction<boolean>>;
  setNavigatorOpen: Dispatch<SetStateAction<boolean>>;
}

interface HeaderState {
  compactHeader: boolean;
  desktop: boolean;
  errorCount: number;
  headerActionsAnchor: HTMLElement | null;
  mobileNavigatorOpen: boolean;
  navigatorOpen: boolean;
  presentationMode: boolean;
}

interface StudioWorkspaceHeaderProps {
  actions: HeaderActions;
  appearance: ReturnType<typeof useStudioColorScheme>;
  controller: ReturnType<typeof useStudioController>;
  guardedProjectLifecycle: StudioProjectLifecycleActions;
  presentationTriggerRef: RefObject<HTMLButtonElement>;
  state: HeaderState;
}

export function StudioWorkspaceHeader({
  actions,
  appearance,
  controller,
  guardedProjectLifecycle,
  presentationTriggerRef,
  state
}: StudioWorkspaceHeaderProps) {
  const { snapshot } = controller;
  const validationMessage = state.errorCount ? `${state.errorCount} validation errors` : 'Project validation passed';
  const validate = () => {
    actions.setActiveDock('problems');
    actions.setDockCollapsed(false);
    controller.announce(validationMessage);
  };

  return (
    <Box
      className="studio-header"
      component="header"
      role="banner"
      sx={{
        alignItems: 'center',
        bgcolor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
        display: state.presentationMode ? 'none' : 'grid',
        gridArea: 'header',
        gridTemplateAreas: {
          lg: '"identity state actions"',
          xs: '"identity actions"'
        },
        gridTemplateColumns: {
          lg: 'minmax(360px, 1fr) auto minmax(360px, 1fr)',
          xs: 'minmax(0, 1fr) auto'
        },
        gridTemplateRows: 'var(--studio-command-bar-height)',
        minWidth: 0,
        px: studioSpace.space6
      }}
    >
      <Box
        sx={{
          alignItems: 'center',
          display: 'flex',
          gap: studioSpace.space4,
          gridArea: 'identity',
          minWidth: 0,
          overflow: 'hidden'
        }}
      >
        <StudioIconButton
          aria-expanded={state.desktop ? state.navigatorOpen : state.mobileNavigatorOpen}
          aria-label={
            state.desktop
              ? `${state.navigatorOpen ? 'Hide' : 'Show'} project source`
              : `${state.mobileNavigatorOpen ? 'Close' : 'Open'} project source`
          }
          onClick={() => {
            if (state.desktop) actions.setNavigatorOpen((open) => !open);
            else actions.setMobileNavigatorOpen((open) => !open);
          }}
          title={
            state.desktop
              ? `${state.navigatorOpen ? 'Hide' : 'Show'} project source`
              : `${state.mobileNavigatorOpen ? 'Close' : 'Open'} project source`
          }
        >
          <StudioObjectDrawerIcon
            data-material-icon="VerticalSplitOutlined"
            data-mirrored-axis="vertical"
            data-studio-semantic-icon="project-source-toggle"
            fontSize="small"
            sx={{ transform: 'scaleX(-1)' }}
          />
        </StudioIconButton>
        <Typography
          className="studio-brand-heading"
          component="h1"
          data-testid="studio-brand-mark"
          noWrap
          sx={{ flexShrink: 0, mr: studioSpace.space4 }}
          variant="subtitle2"
        >
          TopoViewer Studio
        </Typography>
        <Suspense
          fallback={
            <Typography
              component="span"
              noWrap
              sx={{ maxWidth: studioGeometry.projectNameMaximumWidth }}
              variant="body2"
            >
              {snapshot.project.name}
            </Typography>
          }
        >
          <ProjectMenu actions={guardedProjectLifecycle} project={snapshot.project} />
        </Suspense>
      </Box>
      <Box
        sx={{
          display: { lg: 'block', xs: 'none' },
          gridArea: 'state',
          justifySelf: 'center',
          minWidth: 186
        }}
      >
        <StudioSavedState
          candidate={controller.stylesheetCandidate}
          projectStatus={snapshot.status}
          sourceDrafts={controller.sourceDrafts}
        />
      </Box>
      <Box
        className="studio-header-actions"
        sx={{
          alignItems: 'center',
          display: 'flex',
          gap: studioSpace.space2,
          gridArea: 'actions',
          justifySelf: 'end',
          minWidth: 0
        }}
      >
        <StudioIconButton
          aria-label="Undo"
          disabled={!controller.canUndo}
          onClick={controller.undo}
          sx={{ display: { sm: 'inline-flex', xs: 'none' } }}
          title="Undo"
        >
          <UndoIcon fontSize="small" />
        </StudioIconButton>
        <StudioIconButton
          aria-label="Redo"
          disabled={!controller.canRedo}
          onClick={controller.redo}
          sx={{ display: { sm: 'inline-flex', xs: 'none' } }}
          title="Redo"
        >
          <RedoIcon fontSize="small" />
        </StudioIconButton>
        <Divider
          flexItem
          orientation="vertical"
          sx={{
            display: { sm: 'block', xs: 'none' },
            mx: studioSpace.space4,
            my: studioSpace.space8
          }}
        />
        <StudioIconButton
          aria-label="Search objects and commands"
          onClick={() => actions.setCommandPaletteOpen(true)}
          title="Search and commands (Ctrl+K)"
        >
          <SearchIcon fontSize="small" />
        </StudioIconButton>
        <StudioIconButton
          aria-label="Validate project"
          onClick={validate}
          sx={{ display: { sm: 'inline-flex', xs: 'none' } }}
          title="Validate project"
        >
          <VerifiedUserOutlinedIcon fontSize="small" />
        </StudioIconButton>
        <StudioSaveButton
          candidate={controller.stylesheetCandidate}
          onSave={() => void actions.saveProject()}
          projectStatus={snapshot.status}
          sourceDrafts={controller.sourceDrafts}
        />
        <StudioAppearanceControl appearance={appearance} />
        <StudioIconButton
          aria-label="Open export panel"
          onClick={actions.openExportPanel}
          sx={{ display: { sm: 'inline-flex', xs: 'none' } }}
          title="Export"
        >
          <IosShareIcon fontSize="small" />
        </StudioIconButton>
        <StudioIconButton
          aria-controls={state.headerActionsAnchor ? 'studio-more-actions' : undefined}
          aria-expanded={Boolean(state.headerActionsAnchor)}
          aria-haspopup="menu"
          aria-label="More Studio actions"
          onClick={(event) => actions.setHeaderActionsAnchor(event.currentTarget)}
          ref={presentationTriggerRef}
          title="More actions"
        >
          <MoreVertIcon fontSize="small" />
        </StudioIconButton>
        <StudioMenu
          anchorEl={state.headerActionsAnchor}
          disableRestoreFocus
          id="studio-more-actions"
          onClose={() => {
            actions.setHeaderActionsAnchor(null);
            requestAnimationFrame(() => presentationTriggerRef.current?.focus());
          }}
          open={Boolean(state.headerActionsAnchor)}
        >
          {state.compactHeader ? (
            <>
              <StudioMenuItem
                onClick={() => {
                  actions.setHeaderActionsAnchor(null);
                  validate();
                }}
              >
                <StudioMenuItemIcon>
                  <VerifiedUserOutlinedIcon fontSize="small" />
                </StudioMenuItemIcon>
                <StudioMenuItemText>Validate project</StudioMenuItemText>
              </StudioMenuItem>
              <StudioMenuItem
                onClick={() => {
                  actions.setHeaderActionsAnchor(null);
                  actions.openExportPanel();
                }}
              >
                <StudioMenuItemIcon>
                  <IosShareIcon fontSize="small" />
                </StudioMenuItemIcon>
                <StudioMenuItemText>Export</StudioMenuItemText>
              </StudioMenuItem>
            </>
          ) : null}
          <StudioMenuItem
            onClick={() => {
              actions.setHeaderActionsAnchor(null);
              actions.enterPresentation();
            }}
          >
            <StudioMenuItemIcon>
              <CoPresentIcon fontSize="small" />
            </StudioMenuItemIcon>
            <StudioMenuItemText>Presentation mode</StudioMenuItemText>
          </StudioMenuItem>
          <StudioMenuItem
            onClick={() => {
              actions.setHeaderActionsAnchor(null);
              void actions.reloadProject();
            }}
          >
            <StudioMenuItemIcon>
              <RefreshIcon fontSize="small" />
            </StudioMenuItemIcon>
            <StudioMenuItemText>Reload project</StudioMenuItemText>
          </StudioMenuItem>
          <StudioMenuItem
            component="a"
            href={studioFeedbackUrl}
            onClick={() => actions.setHeaderActionsAnchor(null)}
            rel="noopener noreferrer"
            target="_blank"
          >
            <StudioMenuItemIcon>
              <FeedbackOutlinedIcon fontSize="small" />
            </StudioMenuItemIcon>
            <StudioMenuItemText>Preview feedback</StudioMenuItemText>
          </StudioMenuItem>
        </StudioMenu>
      </Box>
    </Box>
  );
}
