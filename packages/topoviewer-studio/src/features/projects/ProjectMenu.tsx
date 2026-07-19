import { useMemo, useRef, useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SearchIcon from '@mui/icons-material/Search';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import InputAdornment from '@mui/material/InputAdornment';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { StudioProjectSummary } from '../../contracts/host';
import type { StudioProject } from '../../contracts/project';
import {
  StudioAlert,
  StudioButton,
  StudioDialog,
  StudioDialogActions,
  StudioDialogContent,
  StudioDialogTitle,
  StudioIconButton,
  StudioLinearProgress,
  StudioListItemButton,
  StudioMenu,
  StudioMenuDivider,
  StudioMenuItem,
  StudioMenuItemIcon,
  StudioMenuItemText,
  StudioTextField
} from '../../ui/controls';
import { studioSpace } from '../../ui/muiSpacing';

export interface StudioProjectLifecycleActions {
  activeProjectId: string;
  error?: string;
  mode: 'browser' | 'workspace';
  projects: StudioProjectSummary[];
  create?: () => Promise<void>;
  delete?: (id: string) => Promise<void>;
  duplicate?: (id: string) => Promise<void>;
  exportArchive(id: string, currentProject?: StudioProject): Promise<void>;
  open?: (id: string) => Promise<void>;
  openArchive?: (activate?: StudioProjectActivationGate) => Promise<void>;
  openFolder?: (activate?: StudioProjectActivationGate) => Promise<void>;
  rename?: (id: string, name: string) => Promise<void>;
  resetStorage?: () => Promise<void>;
}

export type StudioProjectActivationGate = (activate: () => Promise<void>) => Promise<void>;

const projectDateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short'
});

function formatProjectDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? value : projectDateFormatter.format(date);
}

export function ProjectMenu({ actions, project }: { actions: StudioProjectLifecycleActions; project: StudioProject }) {
  const [open, setOpen] = useState(false);
  const [busyAction, setBusyAction] = useState<string>();
  const [query, setQuery] = useState('');
  const [rowMenuAnchor, setRowMenuAnchor] = useState<HTMLElement | null>(null);
  const [rowMenuProjectId, setRowMenuProjectId] = useState<string>();
  const [renameTarget, setRenameTarget] = useState<StudioProjectSummary>();
  const [deleteTarget, setDeleteTarget] = useState<StudioProjectSummary>();
  const [resetOpen, setResetOpen] = useState(false);
  const [draftName, setDraftName] = useState('');
  const newButtonRef = useRef<HTMLButtonElement>(null);
  const busy = Boolean(busyAction);
  const projects = useMemo(
    () =>
      [...actions.projects]
        .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
        .filter((candidate) => candidate.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())),
    [actions.projects, query]
  );
  const rowMenuProject = actions.projects.find((candidate) => candidate.id === rowMenuProjectId);

  function closeManager() {
    setOpen(false);
    setRowMenuAnchor(null);
    setRowMenuProjectId(undefined);
  }

  function closeRowMenu() {
    setRowMenuAnchor(null);
    setRowMenuProjectId(undefined);
  }

  async function run(label: string, action: () => Promise<void>, closeAfter = false) {
    setBusyAction(label);
    try {
      await action();
      if (closeAfter) closeManager();
    } finally {
      setBusyAction(undefined);
    }
  }

  function startRename(candidate: StudioProjectSummary) {
    closeRowMenu();
    setDraftName(candidate.name);
    setRenameTarget(candidate);
  }

  function startDelete(candidate: StudioProjectSummary) {
    closeRowMenu();
    setDeleteTarget(candidate);
  }

  return (
    <Box
      className="studio-project-switcher"
      sx={{
        gridArea: 'project',
        justifySelf: 'center',
        maxWidth: '100%',
        minWidth: 0
      }}
    >
      <StudioButton
        aria-expanded={open}
        aria-label="Project menu"
        color="inherit"
        endIcon={<KeyboardArrowDownIcon fontSize="small" />}
        onClick={() => setOpen(true)}
        startIcon={<FolderOutlinedIcon color="primary" fontSize="small" />}
        sx={{ maxWidth: 380, minWidth: 0 }}
        title={project.name}
        variant="text"
      >
        <Typography component="span" noWrap variant="body2">
          {project.name}
        </Typography>
      </StudioButton>

      <StudioDialog aria-labelledby="studio-project-manager-title" initialFocusRef={newButtonRef} maxWidth="md" onClose={busy ? undefined : closeManager} open={open}>
        <StudioDialogTitle>
          <Stack direction="row" sx={{ alignItems: 'center', gap: studioSpace.space12, justifyContent: 'space-between' }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography component="h2" id="studio-project-manager-title" variant="h6">
                Projects
              </Typography>
              <Typography color="text.secondary" variant="body2">
                {actions.mode === 'workspace' ? 'VS Code workspace' : 'Browser storage'}
              </Typography>
            </Box>
            <Stack direction="row" sx={{ alignItems: 'center', gap: studioSpace.space8 }}>
              <Chip label={`${actions.projects.length} ${actions.projects.length === 1 ? 'project' : 'projects'}`} size="small" variant="outlined" />
              <StudioIconButton aria-label="Close project manager" disabled={busy} onClick={closeManager} title="Close">
                <CloseIcon fontSize="small" />
              </StudioIconButton>
            </Stack>
          </Stack>
        </StudioDialogTitle>
        {busy ? <StudioLinearProgress aria-label={busyAction} /> : null}
        <StudioDialogContent>
          <Stack spacing={studioSpace.space16}>
            <Stack
              direction={{ sm: 'row', xs: 'column' }}
              sx={{ alignItems: { sm: 'center', xs: 'stretch' }, gap: studioSpace.space8 }}
            >
              {actions.create ? (
                <StudioButton
                  disabled={busy}
                  onClick={() => void run('Creating project', actions.create!, true)}
                  ref={newButtonRef}
                  startIcon={<AddIcon fontSize="small" />}
                  variant="contained"
                >
                  New project
                </StudioButton>
              ) : null}
              {actions.openArchive ? (
                <StudioButton
                  disabled={busy}
                  onClick={() => void run('Opening archive', actions.openArchive!, true)}
                  startIcon={<UploadFileIcon fontSize="small" />}
                  variant="outlined"
                >
                  Open archive
                </StudioButton>
              ) : null}
              {actions.openFolder ? (
                <StudioButton
                  disabled={busy}
                  onClick={() => void run('Opening folder', actions.openFolder!, true)}
                  startIcon={<FolderOpenIcon fontSize="small" />}
                  variant="outlined"
                >
                  Open folder
                </StudioButton>
              ) : null}
              <Box sx={{ flex: 1 }} />
              {actions.open && actions.projects.length > 1 ? (
                <StudioTextField
                  aria-label="Search projects"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search projects"
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon fontSize="small" />
                        </InputAdornment>
                      )
                    }
                  }}
                  sx={{ minWidth: { sm: 240, xs: 0 } }}
                  value={query}
                />
              ) : null}
            </Stack>

            {actions.error ? (
              <StudioAlert className="studio-project-error" role="alert" severity="error">
                <Typography variant="body2">{actions.error}</Typography>
                {actions.resetStorage ? <StudioButton onClick={() => setResetOpen(true)}>Reset browser storage</StudioButton> : null}
              </StudioAlert>
            ) : null}

            <Box>
              <Typography color="text.secondary" sx={{ mb: studioSpace.space8 }} variant="overline">
                {actions.mode === 'workspace' ? 'Current workspace' : 'Recent projects'}
              </Typography>
              <List aria-label="Recent projects" disablePadding sx={{ border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
                {projects.map((candidate, index) => {
                  const active = candidate.id === actions.activeProjectId;
                  return (
                    <ListItem
                      disablePadding
                      divider={index < projects.length - 1}
                      key={candidate.id}
                      role="listitem"
                      secondaryAction={
                        <StudioIconButton
                          aria-label={`Actions for ${candidate.name}`}
                          disabled={busy}
                          onClick={(event) => {
                            setRowMenuAnchor(event.currentTarget);
                            setRowMenuProjectId(candidate.id);
                          }}
                          title={`Manage ${candidate.name}`}
                        >
                          <MoreVertIcon fontSize="small" />
                        </StudioIconButton>
                      }
                    >
                      <StudioListItemButton
                        aria-current={active ? 'page' : undefined}
                        disabled={busy}
                        onClick={() => {
                          if (active) closeManager();
                          else if (actions.open) void run(`Opening ${candidate.name}`, () => actions.open!(candidate.id), true);
                        }}
                        selected={active}
                        sx={{ minHeight: 68 }}
                      >
                        <ListItemIcon sx={{ minWidth: 42 }}>
                          <FolderOutlinedIcon color={active ? 'primary' : 'action'} />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Stack direction="row" sx={{ alignItems: 'center', gap: studioSpace.space8 }}>
                              <Typography noWrap variant="body1">
                                {candidate.name}
                              </Typography>
                              {active ? <Chip color="primary" label="Current" size="small" variant="outlined" /> : null}
                            </Stack>
                          }
                          secondary={`Modified ${formatProjectDate(candidate.updatedAt)}`}
                        />
                      </StudioListItemButton>
                    </ListItem>
                  );
                })}
                {projects.length === 0 ? (
                  <ListItem sx={{ minHeight: 96, justifyContent: 'center' }}>
                    <Typography color="text.secondary" variant="body2">
                      No projects match “{query.trim()}”.
                    </Typography>
                  </ListItem>
                ) : null}
              </List>
            </Box>
          </Stack>
        </StudioDialogContent>
      </StudioDialog>

      <StudioMenu
        anchorEl={rowMenuAnchor}
        onClose={closeRowMenu}
        open={Boolean(rowMenuAnchor && rowMenuProject)}
        slotProps={{ list: { 'aria-label': rowMenuProject ? `${rowMenuProject.name} project actions` : 'Project actions', dense: true } }}
      >
        {rowMenuProject && rowMenuProject.id !== actions.activeProjectId && actions.open ? (
          <StudioMenuItem
            onClick={() => {
              const candidate = rowMenuProject;
              closeRowMenu();
              void run(`Opening ${candidate.name}`, () => actions.open!(candidate.id), true);
            }}
          >
            <StudioMenuItemIcon>
              <FolderOpenIcon fontSize="small" />
            </StudioMenuItemIcon>
            <StudioMenuItemText>Open</StudioMenuItemText>
          </StudioMenuItem>
        ) : null}
        {rowMenuProject && actions.rename ? (
          <StudioMenuItem onClick={() => startRename(rowMenuProject)}>
            <StudioMenuItemIcon>
              <DriveFileRenameOutlineIcon fontSize="small" />
            </StudioMenuItemIcon>
            <StudioMenuItemText>Rename</StudioMenuItemText>
          </StudioMenuItem>
        ) : null}
        {rowMenuProject && actions.duplicate ? (
          <StudioMenuItem
            onClick={() => {
              const candidate = rowMenuProject;
              closeRowMenu();
              void run(`Duplicating ${candidate.name}`, () => actions.duplicate!(candidate.id), true);
            }}
          >
            <StudioMenuItemIcon>
              <ContentCopyIcon fontSize="small" />
            </StudioMenuItemIcon>
            <StudioMenuItemText>Duplicate</StudioMenuItemText>
          </StudioMenuItem>
        ) : null}
        {rowMenuProject ? (
          <StudioMenuItem
            onClick={() => {
              const candidate = rowMenuProject;
              closeRowMenu();
              void run(`Exporting ${candidate.name}`, () => actions.exportArchive(candidate.id, candidate.id === actions.activeProjectId ? project : undefined));
            }}
          >
            <StudioMenuItemIcon>
              <DownloadIcon fontSize="small" />
            </StudioMenuItemIcon>
            <StudioMenuItemText>Export archive</StudioMenuItemText>
          </StudioMenuItem>
        ) : null}
        {rowMenuProject && actions.delete ? <StudioMenuDivider /> : null}
        {rowMenuProject && actions.delete ? (
          <StudioMenuItem onClick={() => startDelete(rowMenuProject)} sx={{ color: 'error.main' }}>
            <StudioMenuItemIcon sx={{ color: 'inherit' }}>
              <DeleteIcon fontSize="small" />
            </StudioMenuItemIcon>
            <StudioMenuItemText>Delete</StudioMenuItemText>
          </StudioMenuItem>
        ) : null}
      </StudioMenu>

      <StudioDialog aria-labelledby="studio-rename-project-title" maxWidth="xs" onClose={() => setRenameTarget(undefined)} open={Boolean(renameTarget)}>
        <Box
          component="form"
          onSubmit={(event) => {
            event.preventDefault();
            if (!renameTarget || !draftName.trim() || !actions.rename) return;
            const target = renameTarget;
            void run(`Renaming ${target.name}`, () => actions.rename!(target.id, draftName.trim())).then(() => setRenameTarget(undefined));
          }}
        >
          <StudioDialogTitle id="studio-rename-project-title">Rename {renameTarget?.name || 'project'}</StudioDialogTitle>
          <StudioDialogContent>
            <StudioTextField autoFocus label="Project name" onChange={(event) => setDraftName(event.target.value)} value={draftName} />
          </StudioDialogContent>
          <StudioDialogActions>
            <StudioButton onClick={() => setRenameTarget(undefined)} type="button">
              Cancel
            </StudioButton>
            <StudioButton disabled={!draftName.trim() || busy} type="submit" variant="contained">
              Rename
            </StudioButton>
          </StudioDialogActions>
        </Box>
      </StudioDialog>

      <StudioDialog
        aria-labelledby="studio-delete-project-title"
        onClose={() => setDeleteTarget(undefined)}
        open={Boolean(deleteTarget)}
        slotProps={{ paper: { role: 'alertdialog' } }}
      >
        <StudioDialogTitle id="studio-delete-project-title">Delete {deleteTarget?.name || 'project'}?</StudioDialogTitle>
        <StudioDialogContent>
          <Typography variant="body2">The browser project and its recovery snapshots will be removed.</Typography>
        </StudioDialogContent>
        <StudioDialogActions>
          <StudioButton onClick={() => setDeleteTarget(undefined)}>Cancel</StudioButton>
          <StudioButton
            color="error"
            disabled={busy}
            onClick={() => {
              if (!deleteTarget || !actions.delete) return;
              const target = deleteTarget;
              void run(`Deleting ${target.name}`, () => actions.delete!(target.id), target.id === actions.activeProjectId).then(() => setDeleteTarget(undefined));
            }}
            variant="outlined"
          >
            Delete
          </StudioButton>
        </StudioDialogActions>
      </StudioDialog>

      <StudioDialog aria-labelledby="studio-reset-project-title" onClose={() => setResetOpen(false)} open={resetOpen} slotProps={{ paper: { role: 'alertdialog' } }}>
        <StudioDialogTitle id="studio-reset-project-title">Reset browser storage?</StudioDialogTitle>
        <StudioDialogContent>
          <Typography variant="body2">All Studio browser projects and recovery snapshots will be removed. Export recoverable work first.</Typography>
        </StudioDialogContent>
        <StudioDialogActions>
          <StudioButton onClick={() => setResetOpen(false)}>Cancel</StudioButton>
          <StudioButton
            color="error"
            disabled={busy}
            onClick={() => void run('Resetting browser storage', actions.resetStorage!).then(() => setResetOpen(false))}
            variant="outlined"
          >
            Reset
          </StudioButton>
        </StudioDialogActions>
      </StudioDialog>
    </Box>
  );
}
