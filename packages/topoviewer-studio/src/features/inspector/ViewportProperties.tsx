import { useEffect, useState, type ReactNode } from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import GridViewOutlinedIcon from '@mui/icons-material/GridViewOutlined';
import TouchAppOutlinedIcon from '@mui/icons-material/TouchAppOutlined';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { StudioSessionSnapshot } from '../../contracts/project';
import { defaultStudioViewportPreferences, type StudioViewportPreferences } from '../viewport/types';
import { StudioColorField } from '../../ui/StudioColorField';
import { StudioPropertyRow } from '../../ui/StudioPropertyRow';
import { StudioAccordion, StudioAccordionDetails, StudioAccordionSummary, StudioSwitch, StudioTextField } from '../../ui/controls';
import { studioSpace } from '../../ui/muiSpacing';

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

function ViewportSection({ children, defaultExpanded = true, icon, id, title }: { children: ReactNode; defaultExpanded?: boolean; icon: ReactNode; id: string; title: string }) {
  const contentId = `${id}-content`;
  const headingId = `${id}-heading`;

  return (
    <StudioAccordion className="studio-viewport-section" defaultExpanded={defaultExpanded}>
      <StudioAccordionSummary aria-controls={contentId} expandIcon={<ExpandMoreIcon fontSize="small" />} id={headingId}>
        <Box
          sx={{
            alignItems: 'center',
            display: 'flex',
            gap: studioSpace.space8
          }}
        >
          {icon}
          <Typography component="h3" variant="subtitle2">
            {title}
          </Typography>
        </Box>
      </StudioAccordionSummary>
      <StudioAccordionDetails aria-labelledby={headingId} id={contentId} sx={{ p: 0 }}>
        {children}
      </StudioAccordionDetails>
    </StudioAccordion>
  );
}

function ViewportToggle({ checked, description, disabled, label, onChange }: { checked: boolean; description: string; disabled?: boolean; label: string; onChange(checked: boolean): void }) {
  return <StudioSwitch checked={checked} className="studio-viewport-toggle" disabled={disabled} onChange={(event) => onChange(event.target.checked)} slotProps={{ input: { 'aria-label': `${label}. ${description}` } }} />;
}

export function ViewportProperties({ onCommit, onPreferencesChange, preferences, snapshot }: ViewportPropertiesProps) {
  const layout = snapshot.projection.document.layout || {};
  const width = Number(layout.width) || 1280;
  const height = Number(layout.height) || 720;
  const [backgroundDraft, setBackgroundDraft] = useState(preferences.backgroundColor);
  const [gridColorDraft, setGridColorDraft] = useState(preferences.gridColor);
  useEffect(() => setBackgroundDraft(preferences.backgroundColor), [preferences.backgroundColor]);
  useEffect(() => setGridColorDraft(preferences.gridColor), [preferences.gridColor]);
  return (
    <Box aria-label="Viewport settings" className="studio-inspector-document-panel studio-viewport-properties" id="studio-inspector-viewport-panel" role="tabpanel" sx={{ minHeight: 0, minWidth: 0, overflowY: 'auto' }}>
      <ViewportSection icon={<GridViewOutlinedIcon fontSize="small" />} id="studio-viewport-canvas" title="Canvas">
        <StudioPropertyRow description="Canvas background color" label="Background">
          <StudioColorField
            id="studio-viewport-background"
            label="Canvas background"
            onChange={setBackgroundDraft}
            onCommit={(value) => {
              if (value) onPreferencesChange({ backgroundColor: value });
            }}
            onReset={() => {
              setBackgroundDraft(defaultStudioViewportPreferences.backgroundColor);
              onPreferencesChange({
                backgroundColor: defaultStudioViewportPreferences.backgroundColor
              });
            }}
            resetDisabled={backgroundDraft === defaultStudioViewportPreferences.backgroundColor}
            value={backgroundDraft}
          />
        </StudioPropertyRow>
        <StudioPropertyRow description="Distance between grid points, from 8 to 128 pixels" label="Grid size">
          <StudioTextField
            aria-label="Grid size"
            defaultValue={String(preferences.gridSize)}
            key={`viewport-grid-size-${preferences.gridSize}`}
            onBlur={(event) =>
              onPreferencesChange({
                gridSize: Math.max(8, Math.min(128, positiveNumber(event.target.value, preferences.gridSize)))
              })
            }
            slotProps={{ htmlInput: { max: 128, min: 8 } }}
            type="number"
          />
        </StudioPropertyRow>
        <StudioPropertyRow description="Canvas grid color" label="Grid color">
          <StudioColorField
            id="studio-viewport-grid-color"
            label="Grid color"
            onChange={setGridColorDraft}
            onCommit={(value) => {
              if (value) onPreferencesChange({ gridColor: value });
            }}
            onReset={() => {
              setGridColorDraft(defaultStudioViewportPreferences.gridColor);
              onPreferencesChange({
                gridColor: defaultStudioViewportPreferences.gridColor
              });
            }}
            resetDisabled={gridColorDraft === defaultStudioViewportPreferences.gridColor}
            value={gridColorDraft}
          />
        </StudioPropertyRow>
        <StudioPropertyRow description="Show the canvas grid" label="Grid">
          <ViewportToggle checked={preferences.gridVisible} description="Show the canvas grid" label="Grid" onChange={(gridVisible) => onPreferencesChange({ gridVisible })} />
        </StudioPropertyRow>
      </ViewportSection>
      <ViewportSection icon={<TouchAppOutlinedIcon fontSize="small" />} id="studio-viewport-interaction" title="Interaction">
        <StudioPropertyRow description="Show alignment guides and snap objects to them" label="Align and snap">
          <ViewportToggle
            checked={preferences.helperLinesEnabled && preferences.snapToAlignment}
            description="Show alignment guides and snap objects to them"
            label="Alignment assistance"
            onChange={(enabled) =>
              onPreferencesChange({
                helperLinesEnabled: enabled,
                snapToAlignment: enabled
              })
            }
          />
        </StudioPropertyRow>
      </ViewportSection>
      <ViewportSection defaultExpanded={false} icon={<TuneOutlinedIcon fontSize="small" />} id="studio-viewport-advanced" title="Advanced viewport">
        <StudioPropertyRow description="Logical canvas width" label="Width">
          <StudioTextField aria-label="Viewport width" defaultValue={String(width)} key={`viewport-width-${width}`} onBlur={(event) => onCommit(['layout', 'width'], positiveNumber(event.target.value, width), ['layout'])} type="number" />
        </StudioPropertyRow>
        <StudioPropertyRow description="Logical canvas height" label="Height">
          <StudioTextField
            aria-label="Viewport height"
            defaultValue={String(height)}
            key={`viewport-height-${height}`}
            onBlur={(event) => onCommit(['layout', 'height'], positiveNumber(event.target.value, height), ['layout'])}
            type="number"
          />
        </StudioPropertyRow>
        <StudioPropertyRow description="Show zoom, fit, and settings controls" label="Viewport controls">
          <ViewportToggle
            checked={preferences.viewportControlsVisible}
            description="Show zoom, fit, and settings controls"
            label="Viewport controls"
            onChange={(viewportControlsVisible) => onPreferencesChange({ viewportControlsVisible })}
          />
        </StudioPropertyRow>
        <StudioPropertyRow description="Show the topology overview" label="Minimap">
          <ViewportToggle checked={preferences.miniMapVisible} description="Show the topology overview" label="Minimap" onChange={(miniMapVisible) => onPreferencesChange({ miniMapVisible })} />
        </StudioPropertyRow>
      </ViewportSection>
    </Box>
  );
}
