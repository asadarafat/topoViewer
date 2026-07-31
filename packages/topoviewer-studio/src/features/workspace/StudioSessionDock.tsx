import { useSyncExternalStore, type ReactNode } from 'react';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MouseOutlinedIcon from '@mui/icons-material/MouseOutlined';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import type { StudioHistoryEntry } from '../../contracts/commands';
import type {
  StudioDiagnostic,
  StudioProject,
  StudioProjectStatus,
  StudioSelection
} from '../../contracts/project';
import {
  StudioIconButton,
  StudioListItemButton,
  StudioTab,
  StudioTabs
} from '../../ui/controls';
import { studioSpace } from '../../ui/muiSpacing';
import type { StudioDockView } from './workbenchLayout';
import type { StudioSourceDraftController } from '../../session';

interface StudioSessionDockProps {
  activeView: StudioDockView;
  candidateDirty: boolean;
  collapsed: boolean;
  diagnostics: StudioDiagnostic[];
  history: StudioHistoryEntry[];
  hostName: string;
  onActiveViewChange(view: StudioDockView): void;
  onOpenProblem(diagnostic: StudioDiagnostic): void;
  onToggleCollapsed(): void;
  project: StudioProject;
  projectStatus: StudioProjectStatus;
  selection: StudioSelection[];
  sourceDrafts: StudioSourceDraftController;
}

const dockViews: Array<{ label: string; value: StudioDockView }> = [
  { label: 'Problems', value: 'problems' },
  { label: 'Changes', value: 'changes' },
  { label: 'Selection', value: 'selection' },
  { label: 'History', value: 'history' },
  { label: 'Host events', value: 'host' }
];

function EmptyDockState({
  children,
  selection = false
}: {
  children: ReactNode;
  selection?: boolean;
}) {
  return (
    <Box
      sx={{
        alignItems: 'center',
        color: 'text.secondary',
        display: 'flex',
        gap: studioSpace.space8,
        height: '100%',
        p: studioSpace.space12
      }}
    >
      {selection ? (
        <MouseOutlinedIcon color="action" fontSize="small" />
      ) : (
        <CheckCircleOutlineIcon color="success" fontSize="small" />
      )}
      <Typography variant="body2">{children}</Typography>
    </Box>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <Box
      sx={{
        borderBottom: 1,
        borderColor: 'divider',
        display: 'grid',
        gap: studioSpace.space12,
        gridTemplateColumns: '140px minmax(0, 1fr)',
        minHeight: 30,
        px: studioSpace.space10,
        py: studioSpace.space6
      }}
    >
      <Typography color="text.secondary" variant="caption">
        {label}
      </Typography>
      <Typography noWrap title={value} variant="caption">
        {value}
      </Typography>
    </Box>
  );
}

export function StudioSessionDock({
  activeView,
  candidateDirty,
  collapsed,
  diagnostics,
  history,
  hostName,
  onActiveViewChange,
  onOpenProblem,
  onToggleCollapsed,
  project,
  projectStatus,
  selection,
  sourceDrafts
}: StudioSessionDockProps) {
  const sourceDraftState = useSyncExternalStore(
    sourceDrafts.subscribe,
    sourceDrafts.getSnapshot,
    sourceDrafts.getSnapshot
  );
  const dirty = sourceDraftState.dirty || candidateDirty || projectStatus !== 'saved';
  const tabLabel = (view: StudioDockView, label: string) => {
    if (view === 'problems') return `${label} ${diagnostics.length}`;
    if (view === 'changes') return `${label} ${dirty ? 1 : 0}`;
    return label;
  };

  return (
    <Box
      aria-label="Project session details"
      component="section"
      data-collapsed={String(collapsed)}
      role="region"
      sx={{
        bgcolor: 'background.paper',
        borderTop: 1,
        borderColor: 'divider',
        display: 'grid',
        gridTemplateRows: collapsed ? '30px' : '30px minmax(0, 1fr)',
        minHeight: 0,
        minWidth: 0,
        overflow: 'hidden'
      }}
    >
      <Box
        sx={{
          alignItems: 'center',
          borderBottom: collapsed ? 0 : 1,
          borderColor: 'divider',
          display: 'flex',
          minWidth: 0
        }}
      >
        <StudioTabs
          aria-label="Project details"
          onChange={(_event, value: StudioDockView) => onActiveViewChange(value)}
          sx={{
            flex: 1,
            minHeight: 30,
            minWidth: 0,
            '& .MuiTab-root': {
              minHeight: 30,
              minWidth: 0,
              px: studioSpace.space10,
              py: 0
            }
          }}
          value={activeView}
        >
          {dockViews.map(({ label, value }) => (
            <StudioTab key={value} label={tabLabel(value, label)} value={value} />
          ))}
        </StudioTabs>
        <StudioIconButton
          aria-label={`${collapsed ? 'Expand' : 'Collapse'} project session details`}
          onClick={onToggleCollapsed}
          title={`${collapsed ? 'Expand' : 'Collapse'} project session details`}
        >
          {collapsed ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
        </StudioIconButton>
      </Box>

      {collapsed ? null : (
        <Box
          aria-label={dockViews.find((view) => view.value === activeView)?.label}
          role="tabpanel"
          sx={{ minHeight: 0, overflow: 'auto' }}
        >
          {activeView === 'problems' ? (
            diagnostics.length ? (
              <List dense disablePadding>
                {diagnostics.map((diagnostic, index) => (
                  <ListItem disablePadding key={`${diagnostic.document}-${diagnostic.code}-${index}`}>
                    <StudioListItemButton
                      onClick={() => onOpenProblem(diagnostic)}
                      sx={{ minHeight: 30, px: studioSpace.space10 }}
                    >
                      <ListItemText
                        primary={diagnostic.message}
                        secondary={`${diagnostic.document}.yaml${diagnostic.line ? `:${diagnostic.line}` : ''}`}
                        slotProps={{
                          primary: {
                            color:
                              diagnostic.severity === 'error'
                                ? 'error'
                                : diagnostic.severity === 'warning'
                                  ? 'warning.main'
                                  : 'text.primary',
                            noWrap: true,
                            variant: 'caption'
                          },
                          secondary: { noWrap: true, variant: 'caption' }
                        }}
                      />
                    </StudioListItemButton>
                  </ListItem>
                ))}
              </List>
            ) : (
              <EmptyDockState>
                Topology, stylesheet, and mapper pass schema and semantic validation.
              </EmptyDockState>
            )
          ) : null}

          {activeView === 'changes' ? (
            dirty ? (
              <>
                <DetailRow
                  label="State"
                  value={
                    sourceDraftState.dirty
                      ? 'Topology or mapper source draft'
                      : candidateDirty
                        ? 'Stylesheet candidate modified'
                        : projectStatus
                  }
                />
                <DetailRow label="Revision" value={project.revision} />
                <DetailRow label="Save boundary" value="Project source remains local until Save completes" />
              </>
            ) : (
              <EmptyDockState>
                Working source matches revision {project.revision}.
              </EmptyDockState>
            )
          ) : null}

          {activeView === 'selection' ? (
            selection.length ? (
              selection.map((item) => (
                <DetailRow
                  key={`${item.kind}:${item.id}`}
                  label={item.kind}
                  value={item.id}
                />
              ))
            ) : (
              <EmptyDockState selection>No topology object selected.</EmptyDockState>
            )
          ) : null}

          {activeView === 'history' ? (
            history.length ? (
              <List dense disablePadding>
                {history.map((entry) => (
                  <ListItem key={entry.id} sx={{ minHeight: 30, px: studioSpace.space10 }}>
                    <ListItemText
                      primary={entry.summary}
                      secondary={`${entry.state === 'undo' ? 'Applied' : 'Redo'} · ${entry.documents.join(', ') || 'selection'}`}
                      slotProps={{
                        primary: { noWrap: true, variant: 'caption' },
                        secondary: { noWrap: true, variant: 'caption' }
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <EmptyDockState>No authoring commands in this session.</EmptyDockState>
            )
          ) : null}

          {activeView === 'host' ? (
            <>
              <DetailRow label="Host" value={hostName} />
              <DetailRow label="Project" value={project.name} />
              <DetailRow label="Revision" value={project.revision} />
              <DetailRow label="Persistence" value={projectStatus} />
            </>
          ) : null}
        </Box>
      )}
    </Box>
  );
}
