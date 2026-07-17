import FitScreenOutlinedIcon from '@mui/icons-material/FitScreenOutlined';
import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import ZoomInOutlinedIcon from '@mui/icons-material/ZoomInOutlined';
import ZoomOutOutlinedIcon from '@mui/icons-material/ZoomOutOutlined';
import { ControlButton, Controls, useReactFlow, useStore } from '@xyflow/react';
import type { ReactNode } from 'react';
import type { TopoViewerProps } from '../core/types';

function NativeViewportControls({
  fitViewOptions,
  showFitView,
  showZoom
}: {
  fitViewOptions: NonNullable<Exclude<TopoViewerProps['viewportControls'], boolean>>['fitViewOptions'];
  showFitView: boolean;
  showZoom: boolean;
}) {
  const { fitView, zoomIn, zoomOut } = useReactFlow();
  const maxZoomReached = useStore((state) => state.transform[2] >= state.maxZoom);
  const minZoomReached = useStore((state) => state.transform[2] <= state.minZoom);

  return (
    <>
      {showZoom ? (
        <>
          <ControlButton
            aria-label="Zoom In"
            className="topoviewer-viewport-control-button"
            disabled={maxZoomReached}
            onClick={() => void zoomIn()}
            title="Zoom In"
          >
            <ZoomInOutlinedIcon className="topoviewer-viewport-control-icon" />
          </ControlButton>
          <ControlButton
            aria-label="Zoom Out"
            className="topoviewer-viewport-control-button"
            disabled={minZoomReached}
            onClick={() => void zoomOut()}
            title="Zoom Out"
          >
            <ZoomOutOutlinedIcon className="topoviewer-viewport-control-icon" />
          </ControlButton>
        </>
      ) : null}
      {showFitView ? (
        <ControlButton
          aria-label="Fit View"
          className="topoviewer-viewport-control-button"
          onClick={() => void fitView(fitViewOptions)}
          title="Fit View"
        >
          <FitScreenOutlinedIcon className="topoviewer-viewport-control-icon" />
        </ControlButton>
      ) : null}
    </>
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
  const fitViewOptions = { padding: 0.06, maxZoom: 1, duration: 220, ...controls?.fitViewOptions };

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
        <TuneOutlinedIcon className="topoviewer-viewport-control-icon" />
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
        <PhotoCameraOutlinedIcon className="topoviewer-viewport-control-icon" />
      </ControlButton>
    );
  }

  return (
    <Controls
      aria-label="Viewport controls"
      className={['topoviewer-reactflow-controls', controls?.className].filter(Boolean).join(' ')}
      position={controls?.position || 'top-right'}
      showFitView={false}
      showInteractive={false}
      showZoom={false}
    >
      <NativeViewportControls
        fitViewOptions={fitViewOptions}
        showFitView={controls?.showFitView !== false}
        showZoom={controls?.showZoom !== false}
      />
      {controls?.children}
      {toggleButton}
      {exportButton}
    </Controls>
  );
}
