import { useEffect, useMemo, useState, type KeyboardEvent, type MouseEvent } from 'react';
import CodeIcon from '@mui/icons-material/Code';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CheckIcon from '@mui/icons-material/Check';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import {
  authoringLayerReferenceCount,
  createAuthoringLayer,
  findAuthoringObject,
  type AuthoringObjectSelection
} from 'topoviewer/authoring';
import { displayName, type LayerDefinition } from 'topoviewer';
import type { StudioSelection, StudioSessionSnapshot } from '../../contracts/project';
import { StudioButton, StudioButtonBase, StudioCheckbox, StudioDialog, StudioDialogActions, StudioDialogContent, StudioDialogTitle, StudioFormControl, StudioFormHelperText, StudioFormLabel, StudioIconButton, StudioMenu, StudioMenuDivider, StudioMenuItem, StudioMenuItemIcon, StudioMenuItemText, StudioOption, StudioSelect, StudioTextField } from '../../ui/controls';
import { studioSpace } from '../../ui/muiSpacing';

interface LayerControlsProps {
  createDialogOpen: boolean;
  createLayer(name: string): string | undefined;
  deleteLayer(layerId: string, replacementLayerId?: string): boolean;
  disabled?: boolean;
  hiddenLayerIds: string[];
  onCreateDialogClose(): void;
  onOpenSource(): void;
  onSelectLayer(layerId: string): void;
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
  disabled: boolean;
  hasSelection: boolean;
  index: number;
  layer: LayerDefinition;
  mixedSelection: boolean;
  onDelete(): void;
  onMembership(assigned: boolean): void;
  onRename(name: string): void;
  onReorder(targetIndex: number): void;
  onSelect(): void;
  onVisibility(visible: boolean): void;
  usageCount: number;
  visible: boolean;
  visibleCount: number;
}

function LayerRow({ allSelected, canDelete, canMoveDown, canMoveUp, canRemoveMembership, disabled, hasSelection, index, layer, mixedSelection, onDelete, onMembership, onRename, onReorder, onSelect, onVisibility, usageCount, visible, visibleCount }: LayerRowProps) {
  const label = layerLabel(layer);
  const [name, setName] = useState(label);
  const [editing, setEditing] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

  useEffect(() => setName(label), [label]);

  function commitName() {
    setEditing(false);
    if (disabled) {
      setName(label);
      return;
    }
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
        <StudioButtonBase
          aria-label={`Select ${label} layer`}
          className="studio-layer-name"
          onClick={onSelect}
          onDoubleClick={() => {
            if (!disabled) setEditing(true);
          }}
          sx={{
            alignItems: 'center',
            display: 'grid',
            gap: studioSpace.space4,
            gridTemplateColumns: 'minmax(0, 1fr) auto',
            justifyContent: 'stretch',
            minHeight: 28,
            minWidth: 0,
            textAlign: 'left'
          }}
          title={`${label} — double-click to rename`}
        >
          <Typography component="span" noWrap variant="body2">
            {label}
          </Typography>
          <Typography color="text.secondary" component="span" noWrap variant="caption">
            {usageCount} {usageCount === 1 ? 'object' : 'objects'}
          </Typography>
        </StudioButtonBase>
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
          disabled={disabled}
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
          disabled={disabled || !hasSelection || (allSelected && !canRemoveMembership)}
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
          disabled={disabled || !canMoveUp}
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
          disabled={disabled || !canMoveDown}
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
          disabled={disabled || !canDelete}
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

export function LayerControls({ createDialogOpen, createLayer, deleteLayer, disabled = false, hiddenLayerIds, onCreateDialogClose, onOpenSource, onSelectLayer, renameLayer, reorderLayer, setHiddenLayerIds, setLayerMembership, snapshot }: LayerControlsProps) {
  const layers = snapshot.projection.document.graph?.layers || [];
  const layerUsageCounts = useMemo(
    () => new Map(layers.map((layer) => [
      layer.id,
      authoringLayerReferenceCount(snapshot.projection.document, layer.id)
    ])),
    [layers, snapshot.projection.document]
  );
  const supportedSelection = snapshot.selection.filter((selection) => layeredKinds.has(selection.kind));
  const selectedLayers = supportedSelection.map((selection) => objectLayers(snapshot, selection));
  const visibleCount = layers.filter((layer) => !hiddenLayerIds.includes(layer.id)).length;
  const [pendingDeleteId, setPendingDeleteId] = useState<string>();
  const pendingDelete = layers.find((layer) => layer.id === pendingDeleteId);
  const replacementOptions = layers.filter((layer) => layer.id !== pendingDeleteId);
  const [replacementLayerId, setReplacementLayerId] = useState('');
  const [layerName, setLayerName] = useState('');
  const normalizedLayerName = layerName.trim();
  const layerPreview = normalizedLayerName
    ? createAuthoringLayer(snapshot.projection.document, normalizedLayerName)
    : undefined;

  useEffect(() => {
    if (createDialogOpen) setLayerName('');
  }, [createDialogOpen]);

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

  function confirmCreate() {
    if (disabled || !normalizedLayerName) return;
    const layerId = createLayer(normalizedLayerName);
    if (!layerId) return;
    onCreateDialogClose();
    onSelectLayer(layerId);
  }

  return (
    <Box className="studio-layer-controls" aria-labelledby="studio-layers-heading" component="section" sx={{ display: 'grid', gap: studioSpace.space4 }}>
      <Stack className="studio-layer-heading" direction="row" sx={{ alignItems: 'center', justifyContent: 'flex-end' }}>
        <Typography className="studio-visually-hidden" component="h4" id="studio-layers-heading">
          Layer manager
        </Typography>
        <StudioButton
          aria-label="View layers in topology YAML"
          onClick={onOpenSource}
          size="small"
          startIcon={<CodeIcon fontSize="small" />}
        >
          View YAML
        </StudioButton>
      </Stack>
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
              disabled={disabled}
              hasSelection={selectedLayers.length > 0}
              index={index}
              key={layer.id}
              layer={layer}
              mixedSelection={membershipCount > 0 && !allSelected}
              onDelete={() => startDelete(layer.id)}
              onMembership={(assigned) => setLayerMembership(layer.id, assigned)}
              onRename={(name) => renameLayer(layer.id, name)}
              onReorder={(targetIndex) => reorderLayer(layer.id, targetIndex)}
              onSelect={() => onSelectLayer(layer.id)}
              onVisibility={(visible) => setVisible(layer.id, visible)}
              usageCount={layerUsageCounts.get(layer.id) || 0}
              visible={!hiddenLayerIds.includes(layer.id)}
              visibleCount={visibleCount}
            />
          );
        })}
      </Box>

      <StudioDialog aria-labelledby="studio-layer-create-title" onClose={onCreateDialogClose} open={createDialogOpen}>
        <StudioDialogTitle id="studio-layer-create-title">Add layer</StudioDialogTitle>
        <StudioDialogContent>
          <StudioFormControl>
            <StudioTextField
              aria-label="Layer name"
              autoFocus
              disabled={disabled}
              label="Layer name"
              onChange={(event) => setLayerName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== 'Enter') return;
                event.preventDefault();
                confirmCreate();
              }}
              value={layerName}
            />
            <StudioFormHelperText>
              Generated ID: <Box component="span" data-testid="layer-id-preview">{layerPreview?.id || '—'}</Box>
            </StudioFormHelperText>
          </StudioFormControl>
        </StudioDialogContent>
        <StudioDialogActions>
          <StudioButton onClick={onCreateDialogClose}>Cancel</StudioButton>
          <StudioButton disabled={disabled || !layerPreview} onClick={confirmCreate} variant="contained">
            Create layer
          </StudioButton>
        </StudioDialogActions>
      </StudioDialog>

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
          <StudioButton color="error" disabled={disabled || !replacementLayerId} onClick={confirmDelete} variant="outlined">
            Delete
          </StudioButton>
        </StudioDialogActions>
      </StudioDialog>
    </Box>
  );
}
