import { ControlButton, Controls } from '@xyflow/react';
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

export function ViewportControls({ controlPanelToggle }: { controlPanelToggle?: TopoViewerProps['controlPanelToggle'] }) {
  let toggleButton: ReactNode = null;

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

  return (
    <Controls
      aria-label="Viewport controls"
      className="topoviewer-reactflow-controls"
      fitViewOptions={{ padding: 0.06, duration: 220 }}
      position="top-right"
      showInteractive={false}
    >
      {toggleButton}
    </Controls>
  );
}
