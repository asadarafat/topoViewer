import { useEffect, useState, type ReactNode } from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { StudioSessionSnapshot } from '../../contracts/project';
import {
  defaultStudioViewportPreferences,
  type StudioViewportPreferences
} from '../viewport/types';
import { StudioColorField } from '../../ui/StudioColorField';
import {
  StudioAccordion,
  StudioAccordionDetails,
  StudioAccordionSummary,
  StudioLabeledControl,
  StudioSwitch,
  StudioTextField
} from '../../ui/controls';

interface ViewportPropertiesProps {
  onCommit(path: Array<string | number>, value: unknown, scopePath: Array<string | number>): void;
  onPreferencesChange(patch: Partial<StudioViewportPreferences>): void;
  preferences: StudioViewportPreferences;
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
      label={<Stack spacing={0.1}><Typography component="strong" variant="body2">{label}</Typography><Typography color="text.secondary" variant="caption">{description}</Typography></Stack>}
    />
  );
}

export function ViewportProperties({
  onCommit,
  onPreferencesChange,
  preferences,
  snapshot
}: ViewportPropertiesProps) {
  const layout = snapshot.projection.document.layout || {};
  const width = Number(layout.width) || 1280;
  const height = Number(layout.height) || 720;
  const [backgroundDraft, setBackgroundDraft] = useState(preferences.backgroundColor);
  const [gridColorDraft, setGridColorDraft] = useState(preferences.gridColor);
  useEffect(() => setBackgroundDraft(preferences.backgroundColor), [preferences.backgroundColor]);
  useEffect(() => setGridColorDraft(preferences.gridColor), [preferences.gridColor]);
  return (
    <Box
      aria-label="Viewport settings"
      className="studio-inspector-document-panel studio-viewport-properties"
      id="studio-inspector-viewport-panel"
      role="tabpanel"
    >
      <Box className="studio-field-group" component="section">
        <Typography component="h3" variant="subtitle2">Canvas</Typography>
        <Box className="studio-field">
          <Typography component="span" variant="caption">Background</Typography>
          <StudioColorField
            id="studio-viewport-background"
            label="Canvas background"
            onChange={setBackgroundDraft}
            onCommit={(value) => {
              if (value) onPreferencesChange({ backgroundColor: value });
            }}
            onReset={() => {
              setBackgroundDraft(defaultStudioViewportPreferences.backgroundColor);
              onPreferencesChange({ backgroundColor: defaultStudioViewportPreferences.backgroundColor });
            }}
            resetDisabled={backgroundDraft === defaultStudioViewportPreferences.backgroundColor}
            value={backgroundDraft}
          />
        </Box>
        <StudioTextField
          aria-label="Grid size"
          className="studio-field"
          defaultValue={String(preferences.gridSize)}
          key={`viewport-grid-size-${preferences.gridSize}`}
          label="Grid size"
          onBlur={(event) => onPreferencesChange({
            gridSize: Math.max(8, Math.min(128, positiveNumber(event.target.value, preferences.gridSize)))
          })}
          slotProps={{ htmlInput: { max: 128, min: 8 } }}
          type="number"
        />
        <Box className="studio-field">
          <Typography component="span" variant="caption">Grid color</Typography>
          <StudioColorField
            id="studio-viewport-grid-color"
            label="Grid color"
            onChange={setGridColorDraft}
            onCommit={(value) => {
              if (value) onPreferencesChange({ gridColor: value });
            }}
            onReset={() => {
              setGridColorDraft(defaultStudioViewportPreferences.gridColor);
              onPreferencesChange({ gridColor: defaultStudioViewportPreferences.gridColor });
            }}
            resetDisabled={gridColorDraft === defaultStudioViewportPreferences.gridColor}
            value={gridColorDraft}
          />
        </Box>
        <ViewportToggle
          checked={preferences.gridVisible}
          description="Show the canvas grid"
          label="Grid"
          onChange={(gridVisible) => onPreferencesChange({ gridVisible })}
        />
      </Box>
      <Box className="studio-field-group" component="section">
        <Typography component="h3" variant="subtitle2">Interaction</Typography>
        <ViewportToggle
          checked={preferences.helperLinesEnabled && preferences.snapToAlignment}
          description="Show alignment guides and snap objects to them"
          label="Alignment assistance"
          onChange={(enabled) => onPreferencesChange({
            helperLinesEnabled: enabled,
            snapToAlignment: enabled
          })}
        />
      </Box>
      <StudioAccordion className="studio-viewport-advanced">
        <StudioAccordionSummary expandIcon={<ExpandMoreIcon fontSize="small" />}>Advanced viewport</StudioAccordionSummary>
        <StudioAccordionDetails>
          <Box className="studio-field-group" component="section">
            <Typography component="h3" variant="subtitle2">Canvas size</Typography>
            <Box className="studio-position-grid">
              <StudioTextField
                aria-label="Viewport width"
                className="studio-field"
                defaultValue={String(width)}
                key={`viewport-width-${width}`}
                label="Width"
                onBlur={(event) => onCommit(['layout', 'width'], positiveNumber(event.target.value, width), ['layout'])}
                type="number"
              />
              <StudioTextField
                aria-label="Viewport height"
                className="studio-field"
                defaultValue={String(height)}
                key={`viewport-height-${height}`}
                label="Height"
                onBlur={(event) => onCommit(['layout', 'height'], positiveNumber(event.target.value, height), ['layout'])}
                type="number"
              />
            </Box>
          </Box>
          <Box className="studio-field-group" component="section">
            <Typography component="h3" variant="subtitle2">Presentation</Typography>
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
          </Box>
        </StudioAccordionDetails>
      </StudioAccordion>
    </Box>
  );
}
