import { useState, type MouseEvent } from 'react';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Typography from '@mui/material/Typography';
import { StudioButton, StudioDialog, StudioDialogActions, StudioDialogContent, StudioDialogTitle, StudioIconButton, StudioMenu, StudioMenuItem, StudioMenuItemIcon, StudioMenuItemText, StudioTextField } from '../../ui/controls';
import type { StudioUserPreset } from './types';

interface UserPresetActionsProps {
  onDelete(id: string): boolean;
  onRename(id: string, name: string): boolean;
  preset: StudioUserPreset;
}

export function UserPresetActions({ onDelete, onRename, preset }: UserPresetActionsProps) {
  const [anchor, setAnchor] = useState<HTMLElement>();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [name, setName] = useState(preset.name);

  function openMenu(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    setAnchor(event.currentTarget);
  }

  function closeMenu() {
    setAnchor(undefined);
  }

  return (
    <>
      <StudioIconButton
        aria-label={`Manage ${preset.name}`}
        onClick={openMenu}
        onDragStart={(event) => event.preventDefault()}
        onPointerDown={(event) => event.stopPropagation()}
        sx={{
          position: 'absolute',
          right: 0.5,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 2
        }}
        title={`Manage ${preset.name}`}
      >
        <MoreVertIcon fontSize="small" />
      </StudioIconButton>
      <StudioMenu
        anchorEl={anchor}
        onClose={closeMenu}
        open={Boolean(anchor)}
        slotProps={{
          list: { 'aria-label': `${preset.name} actions`, dense: true },
          paper: { sx: { minWidth: 180 } }
        }}
      >
        <StudioMenuItem
          onClick={() => {
            closeMenu();
            setName(preset.name);
            setRenameOpen(true);
          }}
        >
          <StudioMenuItemIcon>
            <EditOutlinedIcon fontSize="small" />
          </StudioMenuItemIcon>
          <StudioMenuItemText>Rename</StudioMenuItemText>
        </StudioMenuItem>
        <StudioMenuItem
          onClick={() => {
            closeMenu();
            setDeleteOpen(true);
          }}
          sx={{ color: 'error.main' }}
        >
          <StudioMenuItemIcon sx={{ color: 'inherit' }}>
            <DeleteOutlineIcon fontSize="small" />
          </StudioMenuItemIcon>
          <StudioMenuItemText>Delete</StudioMenuItemText>
        </StudioMenuItem>
      </StudioMenu>

      <StudioDialog aria-labelledby={`studio-rename-preset-${preset.id}`} maxWidth="xs" onClose={() => setRenameOpen(false)} open={renameOpen}>
        <StudioDialogTitle id={`studio-rename-preset-${preset.id}`}>Rename Object Palette item</StudioDialogTitle>
        <StudioDialogContent>
          <StudioTextField
            autoFocus
            label="Name"
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== 'Enter' || !name.trim()) return;
              event.preventDefault();
              if (onRename(preset.id, name)) setRenameOpen(false);
            }}
            value={name}
          />
        </StudioDialogContent>
        <StudioDialogActions>
          <StudioButton onClick={() => setRenameOpen(false)}>Cancel</StudioButton>
          <StudioButton
            disabled={!name.trim()}
            onClick={() => {
              if (onRename(preset.id, name)) setRenameOpen(false);
            }}
            variant="contained"
          >
            Rename
          </StudioButton>
        </StudioDialogActions>
      </StudioDialog>

      <StudioDialog aria-labelledby={`studio-delete-preset-${preset.id}`} maxWidth="xs" onClose={() => setDeleteOpen(false)} open={deleteOpen}>
        <StudioDialogTitle id={`studio-delete-preset-${preset.id}`}>Delete {preset.name}?</StudioDialogTitle>
        <StudioDialogContent>
          <Typography variant="body2">This removes the saved item from the Object Palette. Existing objects are not changed.</Typography>
        </StudioDialogContent>
        <StudioDialogActions>
          <StudioButton onClick={() => setDeleteOpen(false)}>Cancel</StudioButton>
          <StudioButton
            color="error"
            onClick={() => {
              if (onDelete(preset.id)) setDeleteOpen(false);
            }}
            variant="outlined"
          >
            Delete
          </StudioButton>
        </StudioDialogActions>
      </StudioDialog>
    </>
  );
}
