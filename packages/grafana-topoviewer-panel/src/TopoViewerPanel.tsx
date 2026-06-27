import { useEffect, useMemo, useState } from 'react';
import type { PanelProps } from '@grafana/data';
import type { CSSProperties } from 'react';
import { TopoViewer } from 'topoviewer';
import type { TopoViewerExtension, TopoViewerNodePositionChange, TopoViewerObjectClick, TopoViewerViewport } from 'topoviewer';
import { listHarnessFixtures } from './harnessFixtureCatalog';
import {
  createPositionOverrideExtension,
  emptyInteractionState,
  loadInteractionState,
  persistInteractionState,
  topologyIdentityForDocument,
  withInteractionTimestamp,
  type PanelInteractionState
} from './interactionState';
import { createRuntimeModel, normalizePanelOptions } from './runtimeModel';
import { createTelemetryOverlay, createTelemetryOverlayExtension } from './stateOverlayAdapter';
import { parseTelemetryDataFrames } from './telemetryFrames';
import type { TopoViewerGrafanaPanelOptions } from './types';

type MutablePanelProps = PanelProps<TopoViewerGrafanaPanelOptions> & {
  onOptionsChange?: (options: TopoViewerGrafanaPanelOptions) => void;
};

const panelHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  minHeight: 44,
  padding: '6px 8px',
  color: 'var(--text-color, inherit)'
};

const fixtureLabelStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  minWidth: 0,
  whiteSpace: 'nowrap'
};

const fixtureSelectStyle: CSSProperties = {
  boxSizing: 'border-box',
  width: 260,
  minWidth: 220,
  height: 34,
  minHeight: 34,
  padding: '0 32px 0 10px',
  border: '1px solid rgba(148, 163, 184, 0.45)',
  borderRadius: 6,
  backgroundColor: 'var(--secondary-background, var(--panel-bg, #111827))',
  color: 'var(--text-color, inherit)',
  font: 'inherit',
  fontSize: 13,
  lineHeight: '20px'
};

const telemetryStatusStyle: CSSProperties = {
  padding: '4px 8px',
  border: '1px solid rgba(255, 152, 0, 0.42)',
  borderRadius: 6,
  background: 'rgba(255, 152, 0, 0.12)',
  color: 'var(--text-color, inherit)',
  fontSize: 12
};

const resetButtonStyle: CSSProperties = {
  border: '1px solid rgba(148, 163, 184, 0.45)',
  borderRadius: 6,
  background: 'transparent',
  color: 'var(--text-color, inherit)',
  cursor: 'pointer',
  font: 'inherit',
  fontSize: 12,
  padding: '4px 8px'
};

function selectedIdsForGrafanaTelemetryClick(
  object: TopoViewerObjectClick,
  overlay: ReturnType<typeof createTelemetryOverlay>
): string[] {
  if (object.element === 'edge') {
    const linkOverlay = overlay.linksById[object.id];
    if (!linkOverlay) return [object.id];
    return [object.id, linkOverlay.link.source, linkOverlay.link.target];
  }
  const incidentLinks = Object.values(overlay.linksById)
    .filter((linkOverlay) => linkOverlay.link.source === object.id || linkOverlay.link.target === object.id)
    .map((linkOverlay) => linkOverlay.link.id);
  return [object.id, ...incidentLinks];
}

export function TopoViewerPanel(props: PanelProps<TopoViewerGrafanaPanelOptions>) {
  const { options, width, height } = props;
  const [localFixtureId, setLocalFixtureId] = useState(options.fixtureId);
  useEffect(() => {
    setLocalFixtureId(options.fixtureId);
  }, [options.fixtureId]);
  const effectiveOptions = useMemo(() => ({
    ...options,
    fixtureId: localFixtureId || options.fixtureId
  }), [localFixtureId, options]);
  const normalized = useMemo(() => normalizePanelOptions(effectiveOptions), [effectiveOptions]);
  const model = useMemo(() => createRuntimeModel(normalized), [normalized]);
  const topologyIdentity = useMemo(
    () => topologyIdentityForDocument(model.document, normalized.fixtureId),
    [model.document, normalized.fixtureId]
  );
  const [interactionState, setInteractionState] = useState<PanelInteractionState>(() => (
    loadInteractionState(topologyIdentity, normalized.interaction)
  ));
  const activeInteractionState = interactionState.topologyIdentity === topologyIdentity
    ? interactionState
    : loadInteractionState(topologyIdentity, normalized.interaction);
  const telemetryFrames = useMemo(() => parseTelemetryDataFrames(props.data.series), [props.data.series]);
  const telemetryOverlay = useMemo(() => {
    if (!normalized.telemetry.enabled) return createTelemetryOverlay(model.document, [], { fixtureId: normalized.fixtureId });
    return createTelemetryOverlay(model.document, telemetryFrames.states, {
      fixtureId: normalized.fixtureId,
      thresholds: {
        infoPercent: normalized.telemetry.infoPercent,
        warningPercent: normalized.telemetry.warningPercent,
        errorPercent: normalized.telemetry.errorPercent
      }
    });
  }, [
    model.document,
    normalized.fixtureId,
    normalized.telemetry.enabled,
    normalized.telemetry.errorPercent,
    normalized.telemetry.infoPercent,
    normalized.telemetry.warningPercent,
    telemetryFrames.states
  ]);
  const telemetryExtension = useMemo(() => createTelemetryOverlayExtension(telemetryOverlay), [telemetryOverlay]);
  const positionOverrideExtension = useMemo(
    () => createPositionOverrideExtension(activeInteractionState.nodePositionOverrides),
    [activeInteractionState.nodePositionOverrides]
  );
  const topoviewerExtensions = useMemo(
    () => [positionOverrideExtension, telemetryExtension].filter((extension): extension is TopoViewerExtension => Boolean(extension)),
    [positionOverrideExtension, telemetryExtension]
  );
  const telemetryDiagnostics = normalized.telemetry.enabled
    ? [...telemetryFrames.diagnostics, ...telemetryOverlay.diagnostics]
    : [];

  useEffect(() => {
    setInteractionState(loadInteractionState(topologyIdentity, normalized.interaction));
  }, [normalized.interaction, topologyIdentity]);

  const updateInteractionState = (updater: (current: PanelInteractionState) => PanelInteractionState) => {
    setInteractionState((current) => {
      const base = current.topologyIdentity === topologyIdentity ? current : emptyInteractionState(topologyIdentity);
      const next = updater(base);
      persistInteractionState(next, normalized.interaction);
      return next;
    });
  };

  const onFixtureChange = (fixtureId: string) => {
    setLocalFixtureId(fixtureId);
    (props as MutablePanelProps).onOptionsChange?.({
      ...options,
      fixtureId
    });
  };

  const onObjectClick = (object: TopoViewerObjectClick) => {
    const selectedObjectIds = selectedIdsForGrafanaTelemetryClick(object, telemetryOverlay);
    updateInteractionState((current) => withInteractionTimestamp({
      ...current,
      selectedObjectIds,
      focusedObjectIds: selectedObjectIds
    }));
  };

  const onPaneClick = () => {
    updateInteractionState((current) => withInteractionTimestamp({
      ...current,
      selectedObjectIds: [],
      focusedObjectIds: []
    }));
  };

  const onNodePositionChange = (change: TopoViewerNodePositionChange) => {
    if (!normalized.interaction.enabled || !normalized.interaction.allowNodeDrag || normalized.interaction.persistNodePositions === 'off') return;
    updateInteractionState((current) => withInteractionTimestamp({
      ...current,
      nodePositionOverrides: {
        ...(current.nodePositionOverrides || {}),
        [change.id]: change.position
      }
    }));
  };

  const onViewportChange = (viewport: TopoViewerViewport) => {
    if (!normalized.interaction.enabled || normalized.interaction.persistViewport === 'off') return;
    updateInteractionState((current) => withInteractionTimestamp({
      ...current,
      viewport
    }));
  };

  const resetNodePositionOverrides = () => {
    updateInteractionState((current) => withInteractionTimestamp({
      ...current,
      nodePositionOverrides: undefined
    }));
  };

  return (
    <section
      data-testid="topoviewer-grafana-panel"
      data-theme-mode={normalized.themeMode}
      style={{
        width,
        height,
        minHeight: 320,
        display: 'grid',
        gridTemplateRows: 'auto minmax(0, 1fr)',
        gap: 8,
        overflow: 'hidden'
      }}
    >
      <header style={panelHeaderStyle}>
        <strong>TopoViewer</strong>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          {Object.keys(activeInteractionState.nodePositionOverrides || {}).length ? (
            <button
              data-testid="topoviewer-reset-node-positions"
              onClick={resetNodePositionOverrides}
              style={resetButtonStyle}
              type="button"
            >
              Reset positions
            </button>
          ) : null}
          <label style={fixtureLabelStyle}>
            <span>Fixture</span>
            <select
              aria-label="TopoViewer harness fixture"
              data-testid="topoviewer-fixture-select"
              style={fixtureSelectStyle}
              value={normalized.fixtureId}
              onChange={(event) => onFixtureChange(event.currentTarget.value)}
            >
              {listHarnessFixtures().map((fixture) => (
                <option key={fixture.id} value={fixture.id}>
                  {fixture.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      {model.diagnostics.length ? (
        <div
          data-testid="topoviewer-grafana-diagnostics"
          role="alert"
          style={{
            minHeight: 0,
            overflow: 'auto',
            padding: 12,
            border: '1px solid rgba(211, 47, 47, 0.55)',
            borderRadius: 8,
            background: 'rgba(211, 47, 47, 0.12)',
            color: 'var(--text-color, inherit)'
          }}
        >
          {model.diagnostics.map((diagnostic) => (
            <p key={diagnostic.code} style={{ margin: '0 0 8px' }}>
              <strong>{diagnostic.code}</strong>: {diagnostic.message}
            </p>
          ))}
        </div>
      ) : model.topoviewerProps ? (
        <div
          style={{
            minHeight: 0,
            display: 'grid',
            gridTemplateRows: telemetryDiagnostics.length ? 'auto minmax(0, 1fr)' : 'minmax(0, 1fr)',
            gap: 6
          }}
        >
          {telemetryDiagnostics.length ? (
            <div data-testid="topoviewer-grafana-telemetry-status" style={telemetryStatusStyle}>
              {telemetryDiagnostics[0]?.message}
            </div>
          ) : null}
          <TopoViewer
            {...model.topoviewerProps}
            key={topologyIdentity}
            extensions={topoviewerExtensions.length ? topoviewerExtensions : undefined}
            initialViewport={normalized.interaction.enabled ? activeInteractionState.viewport : undefined}
            nodesDraggable={normalized.interaction.enabled && normalized.interaction.allowNodeDrag}
            selectedObjectIds={normalized.interaction.enabled ? activeInteractionState.selectedObjectIds : undefined}
            onNodePositionChange={onNodePositionChange}
            onObjectClick={onObjectClick}
            onPaneClick={onPaneClick}
            onViewportChange={onViewportChange}
            style={{
              width: '100%',
              height: '100%',
              minHeight: 0,
              border: '1px solid rgba(148, 163, 184, 0.28)',
              borderRadius: 8,
              overflow: 'hidden'
            }}
          />
        </div>
      ) : null}
    </section>
  );
}
