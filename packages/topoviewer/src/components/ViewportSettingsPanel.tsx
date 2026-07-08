import type { LayerDefinition, ToggleDefinition, TopoViewerToggles } from '../core/types';

export interface ViewportSettingsPanelProps {
  attentionControls?: boolean;
  gridSnapEnabled?: boolean;
  hasAttention?: boolean;
  helperLinesEnabled?: boolean;
  initialAttention?: boolean;
  layers: LayerDefinition[];
  onClearAttention?: () => void;
  onClearLayers: () => void;
  onGridSnapChange?: (enabled: boolean) => void;
  onHelperLinesChange?: (enabled: boolean) => void;
  onLayerChange: (layerId: string, enabled: boolean) => void;
  onResetAttention?: () => void;
  onSelectAllLayers: () => void;
  onToggleChange?: (toggleId: string, enabled: boolean) => void;
  selectedLayerIds: string[];
  toggleDefinitions?: ToggleDefinition[];
  toggles?: TopoViewerToggles;
}

export function ViewportSettingsPanel({
  attentionControls = false,
  gridSnapEnabled,
  hasAttention = false,
  helperLinesEnabled,
  initialAttention = false,
  layers,
  onClearAttention,
  onClearLayers,
  onGridSnapChange,
  onHelperLinesChange,
  onLayerChange,
  onResetAttention,
  onSelectAllLayers,
  onToggleChange,
  selectedLayerIds,
  toggleDefinitions = [],
  toggles = {}
}: ViewportSettingsPanelProps) {
  const showHelperLines = helperLinesEnabled !== undefined && !!onHelperLinesChange;
  const showGridSnap = gridSnapEnabled !== undefined && !!onGridSnapChange;
  const showDisplay = toggleDefinitions.length > 0 || showHelperLines || showGridSnap;

  return (
    <div className="topoviewer-embed-controls">
      <div className="topoviewer-embed-control-group">
        <span className="topoviewer-embed-control-label">Layers</span>
        {layers.map((layer) => (
          <label key={layer.id} className="topoviewer-embed-check">
            <input
              type="checkbox"
              checked={selectedLayerIds.includes(layer.id)}
              onChange={(event) => onLayerChange(layer.id, event.target.checked)}
            />
            <span>{layer.name || layer.id}</span>
          </label>
        ))}
        <button type="button" onClick={onSelectAllLayers}>All</button>
        <button type="button" onClick={onClearLayers}>None</button>
      </div>

      {showDisplay ? (
        <div className="topoviewer-embed-control-group">
          <span className="topoviewer-embed-control-label">Display</span>
          {toggleDefinitions.map((toggle) => (
            <label key={toggle.id} className="topoviewer-embed-check">
              <input
                type="checkbox"
                checked={!!toggles[toggle.id]}
                disabled={!onToggleChange}
                onChange={(event) => onToggleChange?.(toggle.id, event.target.checked)}
              />
              <span>{toggle.name || toggle.id}</span>
            </label>
          ))}
          {showHelperLines ? (
            <label className="topoviewer-embed-check">
              <input
                type="checkbox"
                checked={helperLinesEnabled}
                onChange={(event) => onHelperLinesChange(event.target.checked)}
              />
              <span>Helper lines</span>
            </label>
          ) : null}
          {showGridSnap ? (
            <label className="topoviewer-embed-check">
              <input
                type="checkbox"
                checked={gridSnapEnabled}
                onChange={(event) => onGridSnapChange(event.target.checked)}
              />
              <span>Grid snap</span>
            </label>
          ) : null}
        </div>
      ) : null}

      {attentionControls ? (
        <div className="topoviewer-embed-control-group">
          <span className="topoviewer-embed-control-label">Attention</span>
          <button type="button" onClick={onClearAttention} disabled={!hasAttention}>Clear</button>
          {initialAttention ? (
            <button type="button" onClick={onResetAttention}>Reset</button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
