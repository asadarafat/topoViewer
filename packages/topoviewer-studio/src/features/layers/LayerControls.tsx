import { useEffect, useState, type KeyboardEvent } from 'react';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { findAuthoringObject, type AuthoringObjectSelection } from 'topoviewer/authoring';
import type { LayerDefinition } from 'topoviewer';
import type { StudioSelection, StudioSessionSnapshot } from '../../contracts/project';
import {
  StudioButton,
  StudioCheckbox,
  StudioDialog,
  StudioDialogActions,
  StudioDialogContent,
  StudioDialogTitle,
  StudioFormControl,
  StudioFormLabel,
  StudioIconButton,
  StudioOption,
  StudioSelect,
  StudioTextField
} from '../../ui/controls';

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
  const object = findAuthoringObject(
    snapshot.projection.document,
    selection as AuthoringObjectSelection
  );
  return Array.isArray(object?.layers) ? object.layers.map(String) : [];
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

function LayerRow({
  allSelected,
  canDelete,
  canMoveDown,
  canMoveUp,
  canRemoveMembership,
  hasSelection,
  index,
  layer,
  mixedSelection,
  onDelete,
  onMembership,
  onRename,
  onReorder,
  onVisibility,
  visible,
  visibleCount
}: LayerRowProps) {
  const [name, setName] = useState(layer.name || layer.id);

  useEffect(() => setName(layer.name || layer.id), [layer.id, layer.name]);

  function commitName() {
    const next = name.trim();
    if (!next) {
      setName(layer.name || layer.id);
      return;
    }
    if (next !== (layer.name || layer.id)) onRename(next);
  }

  function nameKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault();
      event.currentTarget.blur();
    }
    if (event.key === 'Escape') {
      setName(layer.name || layer.id);
      event.currentTarget.blur();
    }
  }

  return (
    <Box className="studio-layer-row" data-layer-id={layer.id}>
      <StudioCheckbox
        aria-label={`Show ${layer.name || layer.id} layer`}
        checked={visible}
        disabled={visible && visibleCount === 1}
        onChange={(event) => onVisibility(event.target.checked)}
        title={visible && visibleCount === 1 ? 'At least one layer must remain visible' : 'Toggle layer visibility'}
      />
      <StudioTextField
        aria-label={`Layer name ${layer.id}`}
        className="studio-layer-name"
        onBlur={commitName}
        onChange={(event) => setName(event.target.value)}
        onKeyDown={nameKeyDown}
        value={name}
      />
      <StudioCheckbox
        aria-label={`Assign selection to ${layer.name || layer.id}`}
        checked={allSelected}
        disabled={!hasSelection || (allSelected && !canRemoveMembership)}
        onChange={(event) => onMembership(event.target.checked)}
        indeterminate={mixedSelection}
        title="Assign the current selection to this layer"
      />
      <StudioIconButton aria-label={`Move ${layer.name || layer.id} layer up`} disabled={!canMoveUp} onClick={() => onReorder(index - 1)} title="Move up"><KeyboardArrowUpIcon fontSize="small" /></StudioIconButton>
      <StudioIconButton aria-label={`Move ${layer.name || layer.id} layer down`} disabled={!canMoveDown} onClick={() => onReorder(index + 1)} title="Move down"><KeyboardArrowDownIcon fontSize="small" /></StudioIconButton>
      <StudioIconButton aria-label={`Delete ${layer.name || layer.id} layer`} disabled={!canDelete} onClick={onDelete} title="Delete layer"><DeleteIcon fontSize="small" /></StudioIconButton>
    </Box>
  );
}

export function LayerControls({
  createLayer,
  deleteLayer,
  hiddenLayerIds,
  renameLayer,
  reorderLayer,
  setHiddenLayerIds,
  setLayerMembership,
  snapshot
}: LayerControlsProps) {
  const layers = snapshot.projection.document.graph?.layers || [];
  const supportedSelection = snapshot.selection.filter((selection) => layeredKinds.has(selection.kind));
  const selectedLayers = supportedSelection.map((selection) => objectLayers(snapshot, selection));
  const visibleCount = layers.filter((layer) => !hiddenLayerIds.includes(layer.id)).length;
  const [pendingDeleteId, setPendingDeleteId] = useState<string>();
  const pendingDelete = layers.find((layer) => layer.id === pendingDeleteId);
  const replacementOptions = layers.filter((layer) => layer.id !== pendingDeleteId);
  const [replacementLayerId, setReplacementLayerId] = useState('');

  function setVisible(layerId: string, visible: boolean) {
    setHiddenLayerIds(visible
      ? hiddenLayerIds.filter((id) => id !== layerId)
      : [...new Set([...hiddenLayerIds, layerId])]);
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
    <Box className="studio-layer-controls" aria-labelledby="studio-layers-heading" component="section">
      <Box className="studio-layer-heading">
        <Typography component="strong" id="studio-layers-heading" variant="subtitle2">Layers</Typography>
        <StudioIconButton aria-label="Add layer" onClick={() => createLayer()} title="Add layer"><AddIcon fontSize="small" /></StudioIconButton>
      </Box>
      <Box className="studio-layer-columns" aria-hidden="true"><Typography variant="caption">Visible</Typography><Typography variant="caption">Name</Typography><Typography variant="caption">Selection</Typography></Box>
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

      <StudioDialog
        aria-labelledby="studio-layer-delete-title"
        onClose={() => setPendingDeleteId(undefined)}
        open={Boolean(pendingDelete)}
        slotProps={{ paper: { role: 'alertdialog' } }}
      >
        <StudioDialogTitle id="studio-layer-delete-title">Delete {pendingDelete?.name || pendingDelete?.id}?</StudioDialogTitle>
        <StudioDialogContent>
          <StudioFormControl>
            <StudioFormLabel>Move assigned objects to</StudioFormLabel>
            <StudioSelect aria-label="Replacement layer" onChange={(event) => setReplacementLayerId(event.target.value)} value={replacementLayerId}>
              {replacementOptions.map((layer) => <StudioOption key={layer.id} value={layer.id}>{layer.name || layer.id}</StudioOption>)}
            </StudioSelect>
          </StudioFormControl>
        </StudioDialogContent>
        <StudioDialogActions className="studio-layer-dialog-actions">
          <StudioButton onClick={() => setPendingDeleteId(undefined)}>Cancel</StudioButton>
          <StudioButton color="error" disabled={!replacementLayerId} onClick={confirmDelete} variant="contained">Delete</StudioButton>
        </StudioDialogActions>
      </StudioDialog>
    </Box>
  );
}
