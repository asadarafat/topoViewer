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
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { StudioProjectSummary } from '../../contracts/host';
import type { StudioProject } from '../../contracts/project';
import {
  StudioAlert,
  StudioButton,
  StudioButtonBase,
  StudioDialog,
  StudioDialogActions,
  StudioDialogContent,
  StudioDialogTitle,
  StudioPopover,
  StudioTextField
} from '../../ui/controls';

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
    <Box className="studio-project-switcher">
      <StudioButtonBase
        aria-expanded={open}
        aria-label="Project menu"
        className="studio-project-name"
        onClick={(event) => {
          setDraftName(name);
          setAnchorEl((value) => value ? null : event.currentTarget);
        }}
        title={name}
      >
        <StopOutlinedIcon className="studio-project-icon" fontSize="small" />
        <Typography component="span" noWrap variant="body2">{name}</Typography>
      </StudioButtonBase>

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
              p: 1.5,
              width: 'min(430px, calc(100vw - 24px))'
            }
          }
        }}
        transformOrigin={{ horizontal: 'center', vertical: 'top' }}
      >
        <Stack spacing={1.5}>
          <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography component="strong" variant="subtitle2">{actions.mode === 'workspace' ? 'VS Code bundle' : 'Browser projects'}</Typography>
            {actions.mode === 'browser' ? <Chip label={actions.projects.length} size="small" /> : null}
          </Stack>
          <Divider />
          <Stack className="studio-project-actions" direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
            {actions.create ? <StudioButton disabled={busy} onClick={() => void run(actions.create!)} ref={newButtonRef}><AddIcon fontSize="small" />New</StudioButton> : null}
            {actions.openArchive ? <StudioButton disabled={busy} onClick={() => void run(actions.openArchive!)}><UploadFileIcon fontSize="small" />Open archive</StudioButton> : null}
            {actions.openFolder ? <StudioButton disabled={busy} onClick={() => void run(actions.openFolder!)}><FolderOpenIcon fontSize="small" />Open folder</StudioButton> : null}
            <StudioButton disabled={busy} onClick={() => void run(() => actions.exportArchive(project))}><DownloadIcon fontSize="small" />Export archive</StudioButton>
            {actions.duplicate ? <StudioButton disabled={busy} onClick={() => void run(actions.duplicate!)}><ContentCopyIcon fontSize="small" />Duplicate</StudioButton> : null}
            {actions.rename ? <StudioButton disabled={busy} onClick={() => setRenaming(true)}><DriveFileRenameOutlineIcon fontSize="small" />Rename</StudioButton> : null}
            {actions.delete ? <StudioButton disabled={busy} onClick={() => setDeleteOpen(true)}><DeleteIcon fontSize="small" />Delete</StudioButton> : null}
          </Stack>

          {renaming ? (
            <Box component="form" onSubmit={(event) => {
              event.preventDefault();
              if (!draftName.trim()) return;
              void run(() => actions.rename!(draftName), false).then(() => setRenaming(false));
            }}>
              <StudioTextField autoFocus label="Project name" onChange={(event) => setDraftName(event.target.value)} value={draftName} />
              <Stack direction="row" sx={{ gap: 1, justifyContent: 'flex-end', mt: 1 }}>
                <StudioButton onClick={() => setRenaming(false)} type="button">Cancel</StudioButton>
                <StudioButton className="studio-primary-button" disabled={!draftName.trim() || busy} type="submit">Apply</StudioButton>
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
            <List aria-label="Recent projects" className="studio-recent-projects" dense disablePadding>
              {actions.projects.map((candidate) => (
                <ListItem disablePadding key={candidate.id}>
                  <ListItemButton
                    aria-current={candidate.id === actions.activeProjectId ? 'true' : undefined}
                    disabled={busy || candidate.id === actions.activeProjectId}
                    onClick={() => void run(() => actions.open!(candidate.id))}
                  >
                    <ListItemText primary={candidate.name} secondary={new Date(candidate.updatedAt).toLocaleString()} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          ) : null}
        </Stack>
      </StudioPopover>

      <StudioDialog
        aria-labelledby="studio-delete-project-title"
        onClose={() => setDeleteOpen(false)}
        open={deleteOpen}
        slotProps={{ paper: { role: 'alertdialog' } }}
      >
        <StudioDialogTitle id="studio-delete-project-title">Delete {name}?</StudioDialogTitle>
        <StudioDialogContent>
          <Typography variant="body2">The browser project and its recovery snapshots will be removed.</Typography>
        </StudioDialogContent>
        <StudioDialogActions>
          <StudioButton onClick={() => setDeleteOpen(false)}>Cancel</StudioButton>
          <StudioButton color="error" disabled={busy} onClick={() => void run(actions.delete!).then(() => setDeleteOpen(false))} variant="contained">Delete</StudioButton>
        </StudioDialogActions>
      </StudioDialog>

      <StudioDialog
        aria-labelledby="studio-reset-project-title"
        onClose={() => setResetOpen(false)}
        open={resetOpen}
        slotProps={{ paper: { role: 'alertdialog' } }}
      >
        <StudioDialogTitle id="studio-reset-project-title">Reset browser storage?</StudioDialogTitle>
        <StudioDialogContent>
          <Typography variant="body2">All Studio browser projects and recovery snapshots will be removed. Export recoverable work first.</Typography>
        </StudioDialogContent>
        <StudioDialogActions>
          <StudioButton onClick={() => setResetOpen(false)}>Cancel</StudioButton>
          <StudioButton color="error" disabled={busy} onClick={() => void run(actions.resetStorage!).then(() => setResetOpen(false))} variant="contained">Reset</StudioButton>
        </StudioDialogActions>
      </StudioDialog>
    </Box>
  );
}
