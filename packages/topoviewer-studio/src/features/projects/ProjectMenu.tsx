import { useRef, useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import StopOutlinedIcon from '@mui/icons-material/StopOutlined';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { StudioProjectSummary } from '../../contracts/host';
import type { StudioProject } from '../../contracts/project';
import { StudioAlert, StudioButton, StudioDialog, StudioDialogActions, StudioDialogContent, StudioDialogTitle, StudioListItemButton, StudioPopover, StudioTextField } from '../../ui/controls';
import { studioSpace } from '../../ui/muiSpacing';

export interface StudioProjectLifecycleActions {
  activeProjectId: string;
  error?: string;
  mode: 'browser' | 'workspace';
  projects: StudioProjectSummary[];
  create?: () => Promise<void>;
  delete?: () => Promise<void>;
  duplicate?: () => Promise<void>;
  exportArchive(project: StudioProject): Promise<void>;
  open?: (id: string) => Promise<void>;
  openArchive?: () => Promise<void>;
  openFolder?: () => Promise<void>;
  rename?: (name: string) => Promise<void>;
  resetStorage?: () => Promise<void>;
}

export function ProjectMenu({ actions, project }: { actions: StudioProjectLifecycleActions; project: StudioProject }) {
  const name = project.name;
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [draftName, setDraftName] = useState(name);
  const newButtonRef = useRef<HTMLButtonElement>(null);
  const open = Boolean(anchorEl);

  async function run(action: () => Promise<void>, close = true) {
    setBusy(true);
    try {
      await action();
      if (close) setAnchorEl(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Box
      className="studio-project-switcher"
      sx={{
        gridArea: 'project',
        justifySelf: 'center',
        maxWidth: '100%',
        minWidth: 0,
        position: 'relative'
      }}
    >
      <StudioButton
        aria-expanded={open}
        aria-label="Project menu"
        color="inherit"
        onClick={(event) => {
          setDraftName(name);
          setAnchorEl((value) => (value ? null : event.currentTarget));
        }}
        startIcon={<StopOutlinedIcon color="primary" fontSize="small" />}
        sx={{ maxWidth: 380, minWidth: 0 }}
        title={name}
        variant="text"
      >
        <Typography component="span" noWrap variant="body2">
          {name}
        </Typography>
      </StudioButton>

      <StudioPopover
        anchorEl={anchorEl}
        anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }}
        initialFocusRef={actions.create ? newButtonRef : undefined}
        onClose={() => setAnchorEl(null)}
        open={open}
        slotProps={{
          paper: {
            'aria-label': 'Project menu',
            className: 'studio-mui-project-popover',
            role: 'dialog',
            sx: {
              maxHeight: 'min(560px, calc(100vh - 80px))',
              overflow: 'auto',
              p: studioSpace.space12,
              width: 'min(430px, calc(100vw - 24px))'
            }
          }
        }}
        transformOrigin={{ horizontal: 'center', vertical: 'top' }}
      >
        <Stack spacing={studioSpace.space12}>
          <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography component="strong" variant="subtitle2">
              {actions.mode === 'workspace' ? 'VS Code bundle' : 'Browser projects'}
            </Typography>
            {actions.mode === 'browser' ? <Chip label={actions.projects.length} size="small" variant="outlined" /> : null}
          </Stack>
          <Divider />
          <Stack direction="row" sx={{ flexWrap: 'wrap', gap: studioSpace.space8 }}>
            {actions.create ? (
              <StudioButton disabled={busy} onClick={() => void run(actions.create!)} ref={newButtonRef}>
                <AddIcon fontSize="small" />
                New
              </StudioButton>
            ) : null}
            {actions.openArchive ? (
              <StudioButton disabled={busy} onClick={() => void run(actions.openArchive!)}>
                <UploadFileIcon fontSize="small" />
                Open archive
              </StudioButton>
            ) : null}
            {actions.openFolder ? (
              <StudioButton disabled={busy} onClick={() => void run(actions.openFolder!)}>
                <FolderOpenIcon fontSize="small" />
                Open folder
              </StudioButton>
            ) : null}
            <StudioButton disabled={busy} onClick={() => void run(() => actions.exportArchive(project))}>
              <DownloadIcon fontSize="small" />
              Export archive
            </StudioButton>
            {actions.duplicate ? (
              <StudioButton disabled={busy} onClick={() => void run(actions.duplicate!)}>
                <ContentCopyIcon fontSize="small" />
                Duplicate
              </StudioButton>
            ) : null}
            {actions.rename ? (
              <StudioButton disabled={busy} onClick={() => setRenaming(true)}>
                <DriveFileRenameOutlineIcon fontSize="small" />
                Rename
              </StudioButton>
            ) : null}
            {actions.delete ? (
              <StudioButton disabled={busy} onClick={() => setDeleteOpen(true)}>
                <DeleteIcon fontSize="small" />
                Delete
              </StudioButton>
            ) : null}
          </Stack>

          {renaming ? (
            <Box
              component="form"
              onSubmit={(event) => {
                event.preventDefault();
                if (!draftName.trim()) return;
                void run(() => actions.rename!(draftName), false).then(() => setRenaming(false));
              }}
            >
              <StudioTextField autoFocus label="Project name" onChange={(event) => setDraftName(event.target.value)} value={draftName} />
              <Stack
                direction="row"
                sx={{
                  gap: studioSpace.space8,
                  justifyContent: 'flex-end',
                  mt: studioSpace.space8
                }}
              >
                <StudioButton onClick={() => setRenaming(false)} type="button">
                  Cancel
                </StudioButton>
                <StudioButton disabled={!draftName.trim() || busy} type="submit" variant="contained">
                  Apply
                </StudioButton>
              </Stack>
            </Box>
          ) : null}

          {actions.error ? (
            <StudioAlert className="studio-project-error" severity="error">
              <Typography variant="body2">{actions.error}</Typography>
              {actions.resetStorage ? <StudioButton onClick={() => setResetOpen(true)}>Reset browser storage</StudioButton> : null}
            </StudioAlert>
          ) : null}

          {actions.open ? (
            <List aria-label="Recent projects" dense disablePadding>
              {actions.projects.map((candidate) => (
                <ListItem disablePadding key={candidate.id}>
                  <StudioListItemButton aria-current={candidate.id === actions.activeProjectId ? 'true' : undefined} disabled={busy || candidate.id === actions.activeProjectId} onClick={() => void run(() => actions.open!(candidate.id))}>
                    <ListItemText primary={candidate.name} secondary={new Date(candidate.updatedAt).toLocaleString()} />
                  </StudioListItemButton>
                </ListItem>
              ))}
            </List>
          ) : null}
        </Stack>
      </StudioPopover>

      <StudioDialog aria-labelledby="studio-delete-project-title" onClose={() => setDeleteOpen(false)} open={deleteOpen} slotProps={{ paper: { role: 'alertdialog' } }}>
        <StudioDialogTitle id="studio-delete-project-title">Delete {name}?</StudioDialogTitle>
        <StudioDialogContent>
          <Typography variant="body2">The browser project and its recovery snapshots will be removed.</Typography>
        </StudioDialogContent>
        <StudioDialogActions>
          <StudioButton onClick={() => setDeleteOpen(false)}>Cancel</StudioButton>
          <StudioButton color="error" disabled={busy} onClick={() => void run(actions.delete!).then(() => setDeleteOpen(false))} variant="outlined">
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
          <StudioButton color="error" disabled={busy} onClick={() => void run(actions.resetStorage!).then(() => setResetOpen(false))} variant="outlined">
            Reset
          </StudioButton>
        </StudioDialogActions>
      </StudioDialog>
    </Box>
  );
}
