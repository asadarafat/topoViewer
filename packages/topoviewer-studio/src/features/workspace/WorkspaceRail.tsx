import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import PaletteOutlinedIcon from '@mui/icons-material/PaletteOutlined';
import SensorsOutlinedIcon from '@mui/icons-material/SensorsOutlined';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import type { ReactElement } from 'react';
import { StudioTab, StudioTabs } from '../../ui/controls';

export type StudioWorkspaceView = 'topo' | 'object' | 'style' | 'viewport' | 'mapper';

interface WorkspaceRailProps {
  onChange(view: StudioWorkspaceView): void;
  value: StudioWorkspaceView;
}

const workspaceViews = [
  { icon: <AccountTreeOutlinedIcon fontSize="small" />, label: 'Topo', value: 'topo' },
  { icon: <DescriptionOutlinedIcon fontSize="small" />, label: 'Object', value: 'object' },
  { icon: <PaletteOutlinedIcon fontSize="small" />, label: 'Style', value: 'style' },
  { icon: <TuneOutlinedIcon fontSize="small" />, label: 'Viewport', value: 'viewport' },
  { icon: <SensorsOutlinedIcon fontSize="small" />, label: 'Mapper', value: 'mapper' }
] satisfies Array<{ icon: ReactElement; label: string; value: StudioWorkspaceView }>;

export function WorkspaceRail({ onChange, value }: WorkspaceRailProps) {
  return (
    <nav aria-label="Studio workspaces" className="studio-workspace-rail">
      <StudioTabs
        aria-label="Workspace views"
        className="studio-workspace-tabs"
        onChange={(_event, next: StudioWorkspaceView) => onChange(next)}
        orientation="vertical"
        selectionFollowsFocus
        value={value}
        variant="standard"
      >
        {workspaceViews.map((view) => (
          <StudioTab
            aria-controls={value === view.value ? `studio-${view.value}-workspace` : undefined}
            icon={view.icon}
            iconPosition="top"
            key={view.value}
            label={<span>{view.label}</span>}
            title={view.label}
            value={view.value}
          />
        ))}
      </StudioTabs>
    </nav>
  );
}
