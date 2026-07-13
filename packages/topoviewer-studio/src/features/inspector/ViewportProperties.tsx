import { useEffect, useState, type ReactNode } from 'react';
import type { CreateAuthoringPathOptions } from 'topoviewer/authoring';
import type { StudioSessionSnapshot } from '../../contracts/project';
import type { StudioViewportPreferences } from '../viewport/types';
import { StudioColorField } from '../../ui/StudioColorField';
import {
  StudioLabeledControl,
  StudioSelect,
  StudioSwitch,
  StudioTextField
} from '../../ui/controls';

interface ViewportPropertiesProps {
  onCommit(path: Array<string | number>, value: unknown, scopePath: Array<string | number>): void;
  onPreferencesChange(patch: Partial<StudioViewportPreferences>): void;
  pathMode: NonNullable<CreateAuthoringPathOptions['mode']>;
  preferences: StudioViewportPreferences;
  setPathMode(mode: NonNullable<CreateAuthoringPathOptions['mode']>): void;
  snapshot: StudioSessionSnapshot;
}

function positiveNumber(value: string, fallback: number): number {
  const candidate = Number(value);
  return Number.isFinite(candidate) && candidate > 0 ? Math.round(candidate) : fallback;
}

function ViewportToggle({
  checked,
  description,
  disabled,
  label,
  onChange
}: {
  checked: boolean;
  description: string;
  disabled?: boolean;
  label: ReactNode;
  onChange(checked: boolean): void;
}) {
  return (
    <StudioLabeledControl
      className="studio-viewport-toggle"
      control={<StudioSwitch
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />}
      label={<span><strong>{label}</strong><small>{description}</small></span>}
    />
  );
}

export function ViewportProperties({
  onCommit,
  onPreferencesChange,
  pathMode,
  preferences,
  setPathMode,
  snapshot
}: ViewportPropertiesProps) {
  const layout = snapshot.projection.document.layout || {};
  const width = Number(layout.width) || 1280;
  const height = Number(layout.height) || 720;
  const [backgroundDraft, setBackgroundDraft] = useState(preferences.backgroundColor);
  useEffect(() => setBackgroundDraft(preferences.backgroundColor), [preferences.backgroundColor]);
  return (
    <div
      aria-label="Viewport settings"
      className="studio-inspector-document-panel studio-viewport-properties"
      id="studio-inspector-viewport-panel"
      role="tabpanel"
    >
      <section className="studio-field-group">
        <h3>Canvas</h3>
        <div className="studio-position-grid">
          <label className="studio-field">Width
            <StudioTextField
              aria-label="Viewport width"
              defaultValue={String(width)}
              key={`viewport-width-${width}`}
              onBlur={(event) => onCommit(['layout', 'width'], positiveNumber(event.target.value, width), ['layout'])}
              type="number"
            />
          </label>
          <label className="studio-field">Height
            <StudioTextField
              aria-label="Viewport height"
              defaultValue={String(height)}
              key={`viewport-height-${height}`}
              onBlur={(event) => onCommit(['layout', 'height'], positiveNumber(event.target.value, height), ['layout'])}
              type="number"
            />
          </label>
        </div>
        <div className="studio-field">
          <span>Background</span>
          <StudioColorField
            id="studio-viewport-background"
            label="Canvas background"
            onChange={setBackgroundDraft}
            onCommit={(value) => {
              if (value) onPreferencesChange({ backgroundColor: value });
            }}
            value={backgroundDraft}
          />
        </div>
        <label className="studio-field">Grid size
          <StudioTextField
            aria-label="Grid size"
            defaultValue={String(preferences.gridSize)}
            key={`viewport-grid-size-${preferences.gridSize}`}
            onBlur={(event) => onPreferencesChange({
              gridSize: Math.max(8, Math.min(128, positiveNumber(event.target.value, preferences.gridSize)))
            })}
            slotProps={{ htmlInput: { max: 128, min: 8 } }}
            type="number"
          />
        </label>
        <ViewportToggle
          checked={preferences.gridVisible}
          description="Show the canvas grid"
          label="Grid"
          onChange={(gridVisible) => onPreferencesChange({ gridVisible })}
        />
      </section>
      <section className="studio-field-group">
        <h3>Interaction</h3>
        <ViewportToggle
          checked={preferences.helperLinesEnabled}
          description="Show alignment guides while dragging"
          label="Helper lines"
          onChange={(helperLinesEnabled) => onPreferencesChange({ helperLinesEnabled })}
        />
        <ViewportToggle
          checked={preferences.snapToAlignment}
          description="Snap objects to active guides"
          disabled={!preferences.helperLinesEnabled}
          label="Snap to alignment"
          onChange={(snapToAlignment) => onPreferencesChange({ snapToAlignment })}
        />
        <label className="studio-field">Path authoring
          <StudioSelect
            aria-label="Path authoring"
            onChange={(event) => setPathMode(event.target.value as NonNullable<CreateAuthoringPathOptions['mode']>)}
            value={pathMode}
          >
            <option value="loose">Loose endpoints</option>
            <option value="shortest">Shortest traversal</option>
            <option value="explicit">Explicit hops</option>
          </StudioSelect>
        </label>
      </section>
      <section className="studio-field-group">
        <h3>Presentation</h3>
        <ViewportToggle
          checked={preferences.viewportControlsVisible}
          description="Zoom, fit, and settings controls"
          label="Viewport controls"
          onChange={(viewportControlsVisible) => onPreferencesChange({ viewportControlsVisible })}
        />
        <ViewportToggle
          checked={preferences.fitViewOnOpen}
          description="Frame visible objects initially"
          label="Fit on open"
          onChange={(fitViewOnOpen) => onPreferencesChange({ fitViewOnOpen })}
        />
        <ViewportToggle
          checked={preferences.miniMapVisible}
          description="Show topology overview"
          label="Minimap"
          onChange={(miniMapVisible) => onPreferencesChange({ miniMapVisible })}
        />
      </section>
    </div>
  );
}
