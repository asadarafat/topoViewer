import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';
import SensorsOutlinedIcon from '@mui/icons-material/SensorsOutlined';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import type { ReactElement } from 'react';
import { StudioTab, StudioTabs, StudioTooltip } from '../../ui/controls';
import type { StudioWorkspaceView } from './workspaceTransitions';
export type { StudioWorkspaceView } from './workspaceTransitions';

interface WorkspaceRailProps {
  onChange(view: StudioWorkspaceView): void;
  value: StudioWorkspaceView;
}

const workspaceViews = [
  {
    icon: <AddBoxOutlinedIcon fontSize="small" />,
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
  }
] satisfies Array<{
  icon: ReactElement;
  label: string;
  value: StudioWorkspaceView;
}>;

export function WorkspaceRail({ onChange, value }: WorkspaceRailProps) {
  return (
    <Paper
      aria-label="Studio workspaces"
      className="studio-workspace-rail"
      component="nav"
      elevation={0}
      square
      sx={{
        borderRight: 1,
        borderColor: 'divider',
        gridArea: '1 / 1',
        minHeight: 0,
        minWidth: 0,
        overflow: 'hidden',
        position: 'relative',
        zIndex: 20
      }}
    >
      <StudioTabs
        aria-label="Workspace views"
        className="studio-workspace-tabs"
        onChange={(_event, next: StudioWorkspaceView) => onChange(next)}
        orientation="vertical"
        selectionFollowsFocus
        value={value}
        variant="standard"
        sx={{ height: '100%', minHeight: 0, width: 'var(--studio-rail-width)' }}
      >
        {workspaceViews.map((view) => (
          <StudioTab
            aria-label={view.label}
            aria-controls={value === view.value ? `studio-${view.value}-workspace` : undefined}
            key={view.value}
            label={
              <StudioTooltip placement="right" title={view.label}>
                <Box aria-hidden="true" component="span" sx={{ alignItems: 'center', display: 'inline-flex' }}>
                  {view.icon}
                </Box>
              </StudioTooltip>
            }
            sx={{ minHeight: 52, minWidth: 'var(--studio-rail-width)', p: 0 }}
            title={view.label}
            value={view.value}
          />
        ))}
      </StudioTabs>
    </Paper>
  );
}
