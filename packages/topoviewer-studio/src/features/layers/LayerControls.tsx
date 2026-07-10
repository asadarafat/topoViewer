import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { findAuthoringObject, type AuthoringObjectSelection } from 'topoviewer/authoring';
import type { LayerDefinition } from 'topoviewer';
import type { StudioSelection, StudioSessionSnapshot } from '../../contracts/project';
import { useDialogFocus } from '../../accessibility/focus';

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

const layeredKinds = new Set<StudioSelection['kind']>(['node', 'link', 'path', 'region', 'shape', 'callout']);

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
  const membershipRef = useRef<HTMLInputElement>(null);

  useEffect(() => setName(layer.name || layer.id), [layer.id, layer.name]);
  useEffect(() => {
    if (membershipRef.current) membershipRef.current.indeterminate = mixedSelection;
  }, [mixedSelection]);

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
    <div className="studio-layer-row" data-layer-id={layer.id}>
      <input
        aria-label={`Show ${layer.name || layer.id} layer`}
        checked={visible}
        disabled={visible && visibleCount === 1}
        onChange={(event) => onVisibility(event.target.checked)}
        title={visible && visibleCount === 1 ? 'At least one layer must remain visible' : 'Toggle layer visibility'}
        type="checkbox"
      />
      <input
        aria-label={`Layer name ${layer.id}`}
        className="studio-layer-name"
        onBlur={commitName}
        onChange={(event) => setName(event.target.value)}
        onKeyDown={nameKeyDown}
        value={name}
      />
      <input
        aria-label={`Assign selection to ${layer.name || layer.id}`}
        checked={allSelected}
        disabled={!hasSelection || (allSelected && !canRemoveMembership)}
        onChange={(event) => onMembership(event.target.checked)}
        ref={membershipRef}
        title="Assign the current selection to this layer"
        type="checkbox"
      />
      <button aria-label={`Move ${layer.name || layer.id} layer up`} disabled={!canMoveUp} onClick={() => onReorder(index - 1)} title="Move up" type="button"><KeyboardArrowUpIcon fontSize="small" /></button>
      <button aria-label={`Move ${layer.name || layer.id} layer down`} disabled={!canMoveDown} onClick={() => onReorder(index + 1)} title="Move down" type="button"><KeyboardArrowDownIcon fontSize="small" /></button>
      <button aria-label={`Delete ${layer.name || layer.id} layer`} disabled={!canDelete} onClick={onDelete} title="Delete layer" type="button"><DeleteIcon fontSize="small" /></button>
    </div>
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
  const deleteDialog = useDialogFocus<HTMLDivElement>({
    active: Boolean(pendingDelete),
    onDismiss: () => setPendingDeleteId(undefined)
  });

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
    <section className="studio-layer-controls" aria-labelledby="studio-layers-heading">
      <div className="studio-layer-heading">
        <strong id="studio-layers-heading">Layers</strong>
        <button aria-label="Add layer" onClick={() => createLayer()} title="Add layer" type="button"><AddIcon fontSize="small" /></button>
      </div>
      <div className="studio-layer-columns" aria-hidden="true"><span>Visible</span><span>Name</span><span>Selection</span></div>
      <div className="studio-layer-list">
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
      </div>

      {pendingDelete ? (
        <div className="studio-layer-dialog" role="alertdialog" aria-labelledby="studio-layer-delete-title" aria-modal="true" onKeyDown={deleteDialog.onDialogKeyDown} ref={deleteDialog.dialogRef} tabIndex={-1}>
          <strong id="studio-layer-delete-title">Delete {pendingDelete.name || pendingDelete.id}?</strong>
          <label>Move assigned objects to
            <select aria-label="Replacement layer" onChange={(event) => setReplacementLayerId(event.target.value)} value={replacementLayerId}>
              {replacementOptions.map((layer) => <option key={layer.id} value={layer.id}>{layer.name || layer.id}</option>)}
            </select>
          </label>
          <div className="studio-layer-dialog-actions">
            <button onClick={() => setPendingDeleteId(undefined)} type="button">Cancel</button>
            <button className="studio-danger-button" disabled={!replacementLayerId} onClick={confirmDelete} type="button">Delete</button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
