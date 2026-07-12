import { ControlButton, Controls } from '@xyflow/react';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import type { ReactNode } from 'react';
import type { TopoViewerProps } from '../core/types';

function ControlsPanelIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="5" cy="4" r="1.4" fill="currentColor" />
      <circle cx="11" cy="8" r="1.4" fill="currentColor" />
      <circle cx="7" cy="12" r="1.4" fill="currentColor" />
    </svg>
  );
}

export function ViewportControls({
  controlPanelToggle,
  controls,
  exportDisabled,
  exportTooltip,
  onExport
}: {
  controlPanelToggle?: TopoViewerProps['controlPanelToggle'];
  controls?: Exclude<TopoViewerProps['viewportControls'], boolean>;
  exportDisabled?: TopoViewerProps['exportDisabled'];
  exportTooltip?: TopoViewerProps['exportTooltip'];
  onExport?: TopoViewerProps['onExport'];
}) {
  let toggleButton: ReactNode = null;
  let exportButton: ReactNode = null;

  if (controlPanelToggle?.enabled) {
    toggleButton = (
      <ControlButton
        aria-label={controlPanelToggle.open ? 'Hide topology controls' : 'Show topology controls'}
        aria-pressed={!!controlPanelToggle.open}
        className={`topoviewer-controls-toggle${controlPanelToggle.open ? ' is-open' : ''}`}
        onClick={controlPanelToggle.onToggle}
        title={controlPanelToggle.open ? 'Hide topology controls' : 'Show topology controls'}
        type="button"
      >
        <ControlsPanelIcon />
      </ControlButton>
    );
  }

  if (onExport || exportDisabled) {
    exportButton = (
      <ControlButton
        aria-label="Export viewport"
        disabled={exportDisabled}
        title={exportTooltip || 'Export viewport image'}
        onClick={exportDisabled ? undefined : onExport}
        type="button"
      >
        <PhotoCameraIcon />
      </ControlButton>
    );
  }

  return (
    <Controls
      aria-label="Viewport controls"
      className={['topoviewer-reactflow-controls', controls?.className].filter(Boolean).join(' ')}
      fitViewOptions={{ padding: 0.06, maxZoom: 1, duration: 220 }}
      position={controls?.position || 'top-right'}
      showFitView={controls?.showFitView !== false}
      showInteractive={false}
      showZoom={controls?.showZoom !== false}
    >
      {controls?.children}
      {toggleButton}
      {exportButton}
    </Controls>
  );
}
