import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined';
import SensorsOutlinedIcon from '@mui/icons-material/SensorsOutlined';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import Box from '@mui/material/Box';
import type { ReactElement } from 'react';
import { StudioIconButton, StudioTab, StudioTabs, StudioTooltip } from '../../ui/controls';
import { studioSpace } from '../../ui/muiSpacing';
import { studioGeometry } from '../../ui/studioTokens';
import type { StudioWorkspaceView } from './workspaceLayout';
export type { StudioWorkspaceView } from './workspaceLayout';

interface WorkspaceRailProps {
  /** Narrow layouts stack the rail above the panel instead of beside it. */
  compact: boolean;
  /** Select a destination (and open the panel if it is closed). */
  onSelect(view: StudioWorkspaceView): void;
  /** Show or hide the panel. Selecting a destination never hides it. */
  onToggle(): void;
  panelOpen: boolean;
  value: StudioWorkspaceView;
}

/**
 * Rail order follows the authoring sequence: add objects, refine them, bind
 * telemetry, then review what the project contains.
 */
const workspaceViews = [
  {
    icon: <AddOutlinedIcon fontSize="small" />,
    label: 'Add',
    value: 'add'
  },
  {
    icon: <TuneOutlinedIcon fontSize="small" />,
    label: 'Properties',
    value: 'properties'
  },
  {
    icon: <SensorsOutlinedIcon fontSize="small" />,
    label: 'Mapper',
    value: 'mapper'
  },
  {
    icon: <LayersOutlinedIcon fontSize="small" />,
    label: 'Project',
    value: 'project'
  }
] satisfies Array<{
  icon: ReactElement;
  label: string;
  value: StudioWorkspaceView;
}>;

export function WorkspaceRail({ compact, onSelect, onToggle, panelOpen, value }: WorkspaceRailProps) {
  const toggleLabel = `${panelOpen ? 'Close' : 'Open'} workspace panel`;

  return (
    <Box
      aria-label="Studio workspaces"
      className="studio-workspace-rail"
      component="nav"
      sx={{
        alignItems: 'center',
        bgcolor: 'background.paper',
        borderColor: 'divider',
        display: 'flex',
        minHeight: 0,
        minWidth: 0,
        overflow: 'hidden',
        ...(compact
          ? {
              borderBottom: 1,
              flexDirection: 'row',
              height: studioGeometry.commandBarHeight,
              px: studioSpace.space4,
              width: '100%'
            }
          : {
              /* With the panel open the resize handle owns the hairline against the canvas. */
              borderLeft: panelOpen ? 0 : 1,
              flexDirection: 'column',
              pb: studioSpace.space6,
              width: 'var(--studio-rail-width)'
            })
      }}
    >
      <StudioTabs
        aria-label="Workspace views"
        className="studio-workspace-tabs"
        onChange={(_event, next: StudioWorkspaceView) => onSelect(next)}
        orientation={compact ? 'horizontal' : 'vertical'}
        selectionFollowsFocus
        value={value}
        variant="standard"
        sx={{
          flex: 1,
          minHeight: 0,
          minWidth: 0,
          ...(compact
            ? { '& .MuiTabs-indicator': { bottom: 0, height: 2 } }
            : {
                width: 'var(--studio-rail-width)',
                '& .MuiTabs-indicator': { left: 'auto', right: 0, width: 2 }
              })
        }}
      >
        {workspaceViews.map((view) => (
          <StudioTab
            aria-label={view.label}
            aria-controls={value === view.value ? `studio-${view.value}-workspace` : undefined}
            key={view.value}
            label={
              <StudioTooltip
                placement={compact ? 'bottom' : 'left'}
                slotProps={{ popper: { disablePortal: false } }}
                title={view.label}
              >
                <Box aria-hidden="true" component="span" sx={{ alignItems: 'center', display: 'inline-flex' }}>
                  {view.icon}
                </Box>
              </StudioTooltip>
            }
            sx={{
              minHeight: compact ? studioGeometry.commandBarHeight : studioGeometry.railWidth,
              minWidth: compact ? studioGeometry.railWidth : 'var(--studio-rail-width)',
              p: 0
            }}
            title={view.label}
            value={view.value}
          />
        ))}
      </StudioTabs>
      {/* Narrow layouts already carry the dock toggle in the command bar. */}
      {compact ? null : (
        <StudioIconButton aria-expanded={panelOpen} aria-label={toggleLabel} onClick={onToggle} title={toggleLabel}>
          {panelOpen ? <ChevronRightIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />}
        </StudioIconButton>
      )}
    </Box>
  );
}
