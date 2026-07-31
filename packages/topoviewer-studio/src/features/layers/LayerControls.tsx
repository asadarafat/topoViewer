import { useEffect, useState, type KeyboardEvent, type MouseEvent } from 'react';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CheckIcon from '@mui/icons-material/Check';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { findAuthoringObject, type AuthoringObjectSelection } from 'topoviewer/authoring';
import { displayName, type LayerDefinition } from 'topoviewer';
import type { StudioSelection, StudioSessionSnapshot } from '../../contracts/project';
import { StudioButton, StudioCheckbox, StudioDialog, StudioDialogActions, StudioDialogContent, StudioDialogTitle, StudioFormControl, StudioFormLabel, StudioIconButton, StudioMenu, StudioMenuDivider, StudioMenuItem, StudioMenuItemIcon, StudioMenuItemText, StudioOption, StudioSelect, StudioTextField } from '../../ui/controls';
import { studioSpace } from '../../ui/muiSpacing';

interface LayerControlsProps {
  createLayer(name?: string): boolean;
  deleteLayer(layerId: string, replacementLayerId?: string): boolean;
  hiddenLayerIds: string[];
  renameLayer(layerId: string, name: string): boolean;
  reorderLayer(layerId: string, targetIndex: number): boolean;
  setHiddenLayerIds(layerIds: string[]): void;
  setLayerMembership(layerId: string, assigned: boolean): boolean;
  snapshot: StudioSessionSnapshot;
}

const layeredKinds = new Set<StudioSelection['kind']>(['node', 'link', 'path', 'region', 'shape', 'callout', 'text']);

function objectLayers(snapshot: StudioSessionSnapshot, selection: StudioSelection): string[] {
  const object = findAuthoringObject(snapshot.projection.document, selection as AuthoringObjectSelection);
  return Array.isArray(object?.layers) ? object.layers.map(String) : [];
}

function layerLabel(layer: LayerDefinition): string {
  return displayName(layer);
}

interface LayerRowProps {
  allSelected: boolean;
  canDelete: boolean;
  canMoveDown: boolean;
  canMoveUp: boolean;
  canRemoveMembership: boolean;
  hasSelection: boolean;
  index: number;
  layer: LayerDefinition;
  mixedSelection: boolean;
  onDelete(): void;
  onMembership(assigned: boolean): void;
  onRename(name: string): void;
  onReorder(targetIndex: number): void;
  onVisibility(visible: boolean): void;
  visible: boolean;
  visibleCount: number;
}

function LayerRow({ allSelected, canDelete, canMoveDown, canMoveUp, canRemoveMembership, hasSelection, index, layer, mixedSelection, onDelete, onMembership, onRename, onReorder, onVisibility, visible, visibleCount }: LayerRowProps) {
  const label = layerLabel(layer);
  const [name, setName] = useState(label);
  const [editing, setEditing] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

  useEffect(() => setName(label), [label]);

  function commitName() {
    setEditing(false);
    const next = name.trim();
    if (!next) {
      setName(label);
      return;
    }
    if (next !== label) onRename(next);
  }

  function nameKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault();
      event.currentTarget.blur();
    }
    if (event.key === 'Escape') {
      setName(label);
      setEditing(false);
    }
  }

  function closeMenu() {
    setMenuAnchor(null);
  }

  return (
    <Box
      className="studio-layer-row"
      data-layer-id={layer.id}
      sx={{
        alignItems: 'center',
        borderRadius: 1,
        display: 'grid',
        gap: studioSpace.space4,
        gridTemplateColumns: '26px minmax(0, 1fr) 26px',
        minHeight: 28,
        px: studioSpace.space2,
        '&:hover': { bgcolor: 'action.hover' },
        '& .studio-layer-actions': { opacity: 0 },
        '&:hover .studio-layer-actions, &:focus-within .studio-layer-actions, & .studio-layer-actions[aria-expanded="true"]': { opacity: 1 }
      }}
    >
      <StudioCheckbox
        aria-label={`Show ${label} layer`}
        checked={visible}
        disabled={visible && visibleCount === 1}
        onChange={(event) => onVisibility(event.target.checked)}
        title={visible && visibleCount === 1 ? 'At least one layer must remain visible' : 'Toggle layer visibility'}
      />
      {editing ? (
        <StudioTextField
          aria-label={`Layer name ${layer.id}`}
          autoFocus
          className="studio-layer-name"
          onBlur={commitName}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={nameKeyDown}
          value={name}
        />
      ) : (
        <Typography
          className="studio-layer-name"
          component="span"
          noWrap
          onDoubleClick={() => setEditing(true)}
          title={`${label} — double-click to rename`}
          variant="body2"
        >
          {label}
        </Typography>
      )}
      <StudioIconButton
        aria-expanded={Boolean(menuAnchor)}
        aria-haspopup="menu"
        aria-label={`${label} layer actions`}
        className="studio-layer-actions"
        onClick={(event: MouseEvent<HTMLButtonElement>) => setMenuAnchor(event.currentTarget)}
        title="Layer actions"
      >
        <MoreVertIcon fontSize="small" />
      </StudioIconButton>
      <StudioMenu
        anchorEl={menuAnchor}
        disableRestoreFocus
        onClose={closeMenu}
        open={Boolean(menuAnchor)}
      >
        <StudioMenuItem
          onClick={() => {
            closeMenu();
            setEditing(true);
          }}
        >
          <StudioMenuItemIcon>
            <DriveFileRenameOutlineIcon fontSize="small" />
          </StudioMenuItemIcon>
          <StudioMenuItemText>Rename</StudioMenuItemText>
        </StudioMenuItem>
        <StudioMenuItem
          disabled={!hasSelection || (allSelected && !canRemoveMembership)}
          onClick={() => {
            closeMenu();
            onMembership(!allSelected);
          }}
        >
          <StudioMenuItemIcon>{allSelected || mixedSelection ? <CheckIcon fontSize="small" /> : null}</StudioMenuItemIcon>
          <StudioMenuItemText>{allSelected ? 'Remove selection from layer' : 'Assign selection to layer'}</StudioMenuItemText>
        </StudioMenuItem>
        <StudioMenuDivider />
        <StudioMenuItem
          disabled={!canMoveUp}
          onClick={() => {
            closeMenu();
            onReorder(index - 1);
          }}
        >
          <StudioMenuItemIcon>
            <KeyboardArrowUpIcon fontSize="small" />
          </StudioMenuItemIcon>
          <StudioMenuItemText>Move up</StudioMenuItemText>
        </StudioMenuItem>
        <StudioMenuItem
          disabled={!canMoveDown}
          onClick={() => {
            closeMenu();
            onReorder(index + 1);
          }}
        >
          <StudioMenuItemIcon>
            <KeyboardArrowDownIcon fontSize="small" />
          </StudioMenuItemIcon>
          <StudioMenuItemText>Move down</StudioMenuItemText>
        </StudioMenuItem>
        <StudioMenuDivider />
        <StudioMenuItem
          disabled={!canDelete}
          onClick={() => {
            closeMenu();
            onDelete();
          }}
        >
          <StudioMenuItemIcon>
            <DeleteOutlineIcon fontSize="small" />
          </StudioMenuItemIcon>
          <StudioMenuItemText>Delete layer</StudioMenuItemText>
        </StudioMenuItem>
      </StudioMenu>
    </Box>
  );
}

export function LayerControls({ createLayer, deleteLayer, hiddenLayerIds, renameLayer, reorderLayer, setHiddenLayerIds, setLayerMembership, snapshot }: LayerControlsProps) {
  const layers = snapshot.projection.document.graph?.layers || [];
  const supportedSelection = snapshot.selection.filter((selection) => layeredKinds.has(selection.kind));
  const selectedLayers = supportedSelection.map((selection) => objectLayers(snapshot, selection));
  const visibleCount = layers.filter((layer) => !hiddenLayerIds.includes(layer.id)).length;
  const [pendingDeleteId, setPendingDeleteId] = useState<string>();
  const pendingDelete = layers.find((layer) => layer.id === pendingDeleteId);
  const replacementOptions = layers.filter((layer) => layer.id !== pendingDeleteId);
  const [replacementLayerId, setReplacementLayerId] = useState('');

  function setVisible(layerId: string, visible: boolean) {
    setHiddenLayerIds(visible ? hiddenLayerIds.filter((id) => id !== layerId) : [...new Set([...hiddenLayerIds, layerId])]);
  }

  function confirmDelete() {
    if (!pendingDelete || !replacementLayerId) return;
    if (deleteLayer(pendingDelete.id, replacementLayerId)) setPendingDeleteId(undefined);
  }

  function startDelete(layerId: string) {
    setPendingDeleteId(layerId);
    setReplacementLayerId(layers.find((layer) => layer.id !== layerId)?.id || '');
  }

  return (
    <Box className="studio-layer-controls" aria-labelledby="studio-layers-heading" component="section" sx={{ display: 'grid', gap: studioSpace.space4 }}>
      <Box
        className="studio-layer-heading"
        sx={{
          alignItems: 'center',
          display: 'flex',
          justifyContent: 'space-between'
        }}
      >
        <Typography color="text.secondary" component="strong" id="studio-layers-heading" variant="overline">
          Layers
        </Typography>
        <StudioIconButton aria-label="Add layer" onClick={() => createLayer()} title="Add layer">
          <AddIcon fontSize="small" />
        </StudioIconButton>
      </Box>
      <Box className="studio-layer-list">
        {layers.map((layer, index) => {
          const membershipCount = selectedLayers.filter((ids) => ids.includes(layer.id)).length;
          const allSelected = selectedLayers.length > 0 && membershipCount === selectedLayers.length;
          const canRemoveMembership = selectedLayers.every((ids) => ids.length > 1);
          return (
            <LayerRow
              allSelected={allSelected}
              canDelete={layers.length > 1}
              canMoveDown={index < layers.length - 1}
              canMoveUp={index > 0}
              canRemoveMembership={canRemoveMembership}
              hasSelection={selectedLayers.length > 0}
              index={index}
              key={layer.id}
              layer={layer}
              mixedSelection={membershipCount > 0 && !allSelected}
              onDelete={() => startDelete(layer.id)}
              onMembership={(assigned) => setLayerMembership(layer.id, assigned)}
              onRename={(name) => renameLayer(layer.id, name)}
              onReorder={(targetIndex) => reorderLayer(layer.id, targetIndex)}
              onVisibility={(visible) => setVisible(layer.id, visible)}
              visible={!hiddenLayerIds.includes(layer.id)}
              visibleCount={visibleCount}
            />
          );
        })}
      </Box>

      <StudioDialog aria-labelledby="studio-layer-delete-title" onClose={() => setPendingDeleteId(undefined)} open={Boolean(pendingDelete)} slotProps={{ paper: { role: 'alertdialog' } }}>
        <StudioDialogTitle id="studio-layer-delete-title">Delete {pendingDelete ? layerLabel(pendingDelete) : ''}?</StudioDialogTitle>
        <StudioDialogContent>
          <StudioFormControl>
            <StudioFormLabel>Move assigned objects to</StudioFormLabel>
            <StudioSelect aria-label="Replacement layer" onChange={(event) => setReplacementLayerId(event.target.value)} value={replacementLayerId}>
              {replacementOptions.map((layer) => (
                <StudioOption key={layer.id} value={layer.id}>
                  {layerLabel(layer)}
                </StudioOption>
              ))}
            </StudioSelect>
          </StudioFormControl>
        </StudioDialogContent>
        <StudioDialogActions>
          <StudioButton onClick={() => setPendingDeleteId(undefined)}>Cancel</StudioButton>
          <StudioButton color="error" disabled={!replacementLayerId} onClick={confirmDelete} variant="outlined">
            Delete
          </StudioButton>
        </StudioDialogActions>
      </StudioDialog>
    </Box>
  );
}
