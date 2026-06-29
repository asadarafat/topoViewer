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
import { createMapperTelemetryOverlay, createMapperTelemetryOverlayExtension } from './mapperOverlayAdapter';
import { parseMapperTelemetryDataFrames } from './mapperTelemetryFrames';
import { starterPromQlForMapper } from './mapperPromql';
import { fetchMountedBundle, fetchMountedBundleIndex } from './mountedBundles';
import { createRuntimeModel, normalizePanelOptions } from './runtimeModel';
import { createTelemetryOverlay, createTelemetryOverlayExtension } from './stateOverlayAdapter';
import { parseTelemetryDataFrames } from './telemetryFrames';
import type {
  GrafanaMountedBundleIndex,
  GrafanaMountedBundlePayload,
  GrafanaPanelDiagnostic,
  TopoViewerGrafanaPanelOptions
} from './types';

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

const panelTitleStyle: CSSProperties = {
  display: 'grid',
  minWidth: 0
};

const selectedTopologyNameStyle: CSSProperties = {
  fontWeight: 700,
  lineHeight: 1.2,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap'
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
  padding: '6px 8px',
  border: '1px solid rgba(255, 152, 0, 0.42)',
  borderRadius: 6,
  background: 'rgba(255, 152, 0, 0.12)',
  color: 'var(--text-color, inherit)',
  fontSize: 12
};

const telemetryDetailsStyle: CSSProperties = {
  marginTop: 6,
  display: 'grid',
  gap: 6
};

const promqlPreStyle: CSSProperties = {
  margin: 0,
  padding: 8,
  overflow: 'auto',
  border: '1px solid rgba(148, 163, 184, 0.35)',
  borderRadius: 6,
  background: 'rgba(15, 23, 42, 0.18)',
  color: 'var(--text-color, inherit)',
  fontSize: 11,
  lineHeight: 1.45
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

type TelemetryClickOverlay = {
  linksById: Record<string, { link: { id: string; source: string; target: string } }>;
};

function selectedIdsForGrafanaTelemetryClick(
  object: TopoViewerObjectClick,
  overlay: TelemetryClickOverlay
): string[] {
  if (object.element === 'linkDirection') {
    return [
      object.id,
      object.data.linkId,
      object.data.source,
      object.data.target
    ].map((id) => String(id || '')).filter(Boolean);
  }
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

function mapperCoverageSummary(overlay: ReturnType<typeof createMapperTelemetryOverlay>): string {
  const { coverage } = overlay;
  if (!coverage.totalSamples) return 'Mapper ready; waiting for Grafana telemetry frames.';
  const parts = [
    `Mapper coverage: ${coverage.resolvedSamples}/${coverage.sourceMatchedSamples || coverage.totalSamples} samples resolved`,
    `${coverage.appliedObjects} object(s) overlaid`,
    `${coverage.unresolvedSamples} unresolved`,
    `${coverage.ambiguousMatches} ambiguous`,
    `${coverage.duplicateObjectMappings} duplicate`
  ];
  if (coverage.missingParentLinkSamples) parts.push(`${coverage.missingParentLinkSamples} missing parent link`);
  if (coverage.missingDirectionSamples) parts.push(`${coverage.missingDirectionSamples} missing direction`);
  if (coverage.unsupportedDirectionSamples) parts.push(`${coverage.unsupportedDirectionSamples} unsupported direction`);
  if (coverage.ambiguousDirectionSamples) parts.push(`${coverage.ambiguousDirectionSamples} ambiguous direction`);
  if (coverage.duplicateDirectionMappings) parts.push(`${coverage.duplicateDirectionMappings} duplicate direction`);
  if (coverage.staleObjectMappings) parts.push(`${coverage.staleObjectMappings} stale object`);
  return parts.join(' · ');
}

function copyText(text: string) {
  void navigator.clipboard?.writeText(text);
}

export function TopoViewerPanel(props: PanelProps<TopoViewerGrafanaPanelOptions>) {
  const { options, width, height } = props;
  const dataRequestId = props.data.request?.requestId || '';
  const [localFixtureId, setLocalFixtureId] = useState(options.fixtureId);
  const [localBundleId, setLocalBundleId] = useState(options.mountedBundle?.selectedBundleId);
  const [bundleIndex, setBundleIndex] = useState<GrafanaMountedBundleIndex | undefined>();
  const [mountedBundle, setMountedBundle] = useState<GrafanaMountedBundlePayload | undefined>();
  const [bundleFetchDiagnostic, setBundleFetchDiagnostic] = useState<GrafanaPanelDiagnostic | undefined>();
  useEffect(() => {
    setLocalFixtureId(options.fixtureId);
  }, [options.fixtureId]);
  useEffect(() => {
    setLocalBundleId(options.mountedBundle?.selectedBundleId);
  }, [options.mountedBundle?.selectedBundleId]);
  const effectiveOptions = useMemo(() => ({
    ...options,
    fixtureId: localFixtureId || options.fixtureId,
    mountedBundle: {
      ...options.mountedBundle,
      selectedBundleId: localBundleId || options.mountedBundle?.selectedBundleId
    }
  }), [localBundleId, localFixtureId, options]);
  const normalized = useMemo(() => normalizePanelOptions(effectiveOptions), [effectiveOptions]);
  const fixtureOptions = useMemo(() => listHarnessFixtures(), []);
  const selectedMountedBundleId = normalized.sourceMode === 'mountedBundle'
    ? normalized.mountedBundle.selectedBundleId || bundleIndex?.bundles[0]?.id || ''
    : '';
  const model = useMemo(() => createRuntimeModel(normalized, mountedBundle), [mountedBundle, normalized]);
  const selectedTopologyName = normalized.sourceMode === 'mountedBundle'
    ? model.mountedBundle?.bundle.name || bundleIndex?.bundles.find((bundle) => bundle.id === selectedMountedBundleId)?.name || selectedMountedBundleId || 'No topology selected'
    : model.fixture?.name || fixtureOptions.find((fixture) => fixture.id === normalized.fixtureId)?.name || normalized.fixtureId;
  const sourceIdentity = normalized.sourceMode === 'mountedBundle'
    ? `mounted:${selectedMountedBundleId || normalized.mountedBundle.bundleRoot}`
    : normalized.fixtureId;
  const topologyIdentity = useMemo(
    () => topologyIdentityForDocument(model.document, sourceIdentity),
    [model.document, sourceIdentity]
  );
  const [interactionState, setInteractionState] = useState<PanelInteractionState>(() => (
    loadInteractionState(topologyIdentity, normalized.interaction)
  ));
  const activeInteractionState = interactionState.topologyIdentity === topologyIdentity
    ? interactionState
    : loadInteractionState(topologyIdentity, normalized.interaction);
  const telemetryFrames = useMemo(() => parseTelemetryDataFrames(props.data.series), [props.data.series]);
  const mapperTelemetryFrames = useMemo(
    () => parseMapperTelemetryDataFrames(props.data.series, model.mapper),
    [model.mapper, props.data.series]
  );
  const useMapperTelemetry = normalized.telemetry.enabled && Boolean(model.mapper?.mappings.length);
  const telemetrySourceFilter = normalized.sourceMode === 'mountedBundle'
    ? selectedMountedBundleId || undefined
    : normalized.fixtureId;
  const telemetryOverlay = useMemo(() => {
    if (!normalized.telemetry.enabled) return createTelemetryOverlay(model.document, [], { sourceId: telemetrySourceFilter });
    return createTelemetryOverlay(model.document, telemetryFrames.states, {
      sourceId: telemetrySourceFilter,
      thresholds: {
        infoPercent: normalized.telemetry.infoPercent,
        warningPercent: normalized.telemetry.warningPercent,
        errorPercent: normalized.telemetry.errorPercent
      }
    });
  }, [
    model.document,
    normalized.telemetry.enabled,
    normalized.telemetry.errorPercent,
    normalized.telemetry.infoPercent,
    normalized.telemetry.warningPercent,
    telemetrySourceFilter,
    telemetryFrames.states
  ]);
  const mapperTelemetryOverlay = useMemo(() => {
    if (!normalized.telemetry.enabled || !model.mapper) return createMapperTelemetryOverlay(model.document, model.mapper, []);
    return createMapperTelemetryOverlay(model.document, model.mapper, mapperTelemetryFrames.samples);
  }, [mapperTelemetryFrames.samples, model.document, model.mapper, normalized.telemetry.enabled]);
  const mapperPromQlStarters = useMemo(() => starterPromQlForMapper(model.mapper), [model.mapper]);
  const telemetryExtension = useMemo(() => createTelemetryOverlayExtension(telemetryOverlay), [telemetryOverlay]);
  const mapperTelemetryExtension = useMemo(
    () => createMapperTelemetryOverlayExtension(mapperTelemetryOverlay),
    [mapperTelemetryOverlay]
  );
  const activeTelemetryOverlay = useMapperTelemetry ? mapperTelemetryOverlay : telemetryOverlay;
  const activeTelemetryExtension = useMapperTelemetry ? mapperTelemetryExtension : telemetryExtension;
  const positionOverrideExtension = useMemo(
    () => createPositionOverrideExtension(activeInteractionState.nodePositionOverrides),
    [activeInteractionState.nodePositionOverrides]
  );
  const topoviewerExtensions = useMemo(
    () => [positionOverrideExtension, activeTelemetryExtension].filter((extension): extension is TopoViewerExtension => Boolean(extension)),
    [activeTelemetryExtension, positionOverrideExtension]
  );
  const telemetryDiagnostics = normalized.telemetry.enabled
    ? useMapperTelemetry
      ? [...mapperTelemetryFrames.diagnostics, ...mapperTelemetryOverlay.diagnostics]
      : [...telemetryFrames.diagnostics, ...telemetryOverlay.diagnostics]
    : [];
  const telemetryStatusVisible = normalized.telemetry.enabled && (
    telemetryDiagnostics.length > 0 || useMapperTelemetry
  );

  useEffect(() => {
    setInteractionState(loadInteractionState(topologyIdentity, normalized.interaction));
  }, [normalized.interaction, topologyIdentity]);

  useEffect(() => {
    if (normalized.sourceMode !== 'mountedBundle') {
      setBundleIndex(undefined);
      setMountedBundle(undefined);
      setBundleFetchDiagnostic(undefined);
      return;
    }
    let active = true;
    setBundleFetchDiagnostic(undefined);
    fetchMountedBundleIndex(normalized.mountedBundle.bundleRoot, normalized.mountedBundle.manifestPath)
      .then((index) => {
        if (!active) return;
        setBundleIndex(index);
        if (!selectedMountedBundleId && index.bundles[0]?.id) {
          setLocalBundleId(index.bundles[0].id);
        }
        if (!index.bundles.length) {
          setMountedBundle(undefined);
          setBundleFetchDiagnostic({
            severity: 'error',
            code: 'no-mounted-bundles',
            message: `No complete TopoViewer bundles were discovered under ${index.root}.`
          });
        }
      })
      .catch((error: unknown) => {
        if (!active) return;
        setBundleIndex(undefined);
        setMountedBundle(undefined);
        setBundleFetchDiagnostic({
          severity: 'error',
          code: 'bundle-index-fetch-failed',
          message: error instanceof Error ? error.message : String(error)
        });
      });
    return () => {
      active = false;
    };
  }, [dataRequestId, normalized.mountedBundle.bundleRoot, normalized.mountedBundle.manifestPath, normalized.sourceMode, selectedMountedBundleId]);

  useEffect(() => {
    if (normalized.sourceMode !== 'mountedBundle' || !selectedMountedBundleId) {
      return;
    }
    let active = true;
    setBundleFetchDiagnostic(undefined);
    fetchMountedBundle(normalized.mountedBundle.bundleRoot, selectedMountedBundleId, normalized.mountedBundle.manifestPath)
      .then((payload) => {
        if (!active) return;
        setMountedBundle(payload);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setMountedBundle(undefined);
        setBundleFetchDiagnostic({
          severity: 'error',
          code: 'bundle-fetch-failed',
          message: error instanceof Error ? error.message : String(error)
        });
      });
    return () => {
      active = false;
    };
  }, [dataRequestId, normalized.mountedBundle.bundleRoot, normalized.mountedBundle.manifestPath, normalized.sourceMode, selectedMountedBundleId]);

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

  const onBundleChange = (bundleId: string) => {
    setLocalBundleId(bundleId);
    (props as MutablePanelProps).onOptionsChange?.({
      ...options,
      mountedBundle: {
        ...options.mountedBundle,
        selectedBundleId: bundleId
      }
    });
  };

  const onObjectClick = (object: TopoViewerObjectClick) => {
    const selectedObjectIds = selectedIdsForGrafanaTelemetryClick(object, activeTelemetryOverlay);
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

  const blockingDiagnostics = bundleFetchDiagnostic ? [bundleFetchDiagnostic] : model.diagnostics;
  const hasBlockingError = blockingDiagnostics.some((diagnostic) => diagnostic.severity === 'error');

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
        <div style={panelTitleStyle}>
          <strong data-testid="topoviewer-selected-topology-name" style={selectedTopologyNameStyle}>
            {selectedTopologyName}
          </strong>
        </div>
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
            {normalized.sourceMode === 'mountedBundle' ? (
              <>
                <span>Topology</span>
                <select
                  aria-label="TopoViewer topology bundle"
                  data-testid="topoviewer-bundle-select"
                  style={fixtureSelectStyle}
                  value={selectedMountedBundleId}
                  onChange={(event) => onBundleChange(event.currentTarget.value)}
                >
                  {bundleIndex?.bundles.length ? bundleIndex.bundles.map((bundle) => (
                    <option key={bundle.id} value={bundle.id}>
                      {bundle.name}
                    </option>
                  )) : (
                    <option value="">No bundles found</option>
                  )}
                </select>
              </>
            ) : (
              <>
                <span>Example</span>
                <select
                  aria-label="TopoViewer example topology"
                  data-testid="topoviewer-fixture-select"
                  style={fixtureSelectStyle}
                  value={normalized.fixtureId}
                  onChange={(event) => onFixtureChange(event.currentTarget.value)}
                >
                  {fixtureOptions.map((fixture) => (
                    <option key={fixture.id} value={fixture.id}>
                      {fixture.name}
                    </option>
                  ))}
                </select>
              </>
            )}
          </label>
        </div>
      </header>

      {blockingDiagnostics.length ? (
        <div
          data-testid="topoviewer-grafana-diagnostics"
          role="alert"
          style={{
            minHeight: 0,
            overflow: 'auto',
            padding: 12,
            border: hasBlockingError ? '1px solid rgba(211, 47, 47, 0.55)' : '1px solid rgba(66, 165, 245, 0.45)',
            borderRadius: 8,
            background: hasBlockingError ? 'rgba(211, 47, 47, 0.12)' : 'rgba(66, 165, 245, 0.1)',
            color: 'var(--text-color, inherit)'
          }}
        >
          {blockingDiagnostics.map((diagnostic) => (
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
            gridTemplateRows: telemetryStatusVisible ? 'auto minmax(0, 1fr)' : 'minmax(0, 1fr)',
            gap: 6
          }}
        >
          {telemetryStatusVisible ? (
            <div data-testid="topoviewer-grafana-telemetry-status" style={telemetryStatusStyle}>
              {useMapperTelemetry ? mapperCoverageSummary(mapperTelemetryOverlay) : telemetryDiagnostics[0]?.message}
              {useMapperTelemetry ? (
                <details style={telemetryDetailsStyle}>
                  <summary>Mapper diagnostics and query starters</summary>
                  {telemetryDiagnostics.length ? (
                    <ul style={{ margin: '4px 0', paddingLeft: 18 }}>
                      {telemetryDiagnostics.map((diagnostic) => (
                        <li key={`${diagnostic.code}:${diagnostic.message}`}>
                          <strong>{diagnostic.code}</strong>: {diagnostic.message}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p style={{ margin: '4px 0' }}>No mapper diagnostics.</p>
                  )}
                  {mapperPromQlStarters.length ? (
                    <div style={{ display: 'grid', gap: 6 }}>
                      <button
                        onClick={() => copyText(mapperPromQlStarters.map((starter) => starter.query).join('\n'))}
                        style={resetButtonStyle}
                        type="button"
                      >
                        Copy PromQL
                      </button>
                      <pre style={promqlPreStyle}>
                        {mapperPromQlStarters.map((starter) => `${starter.label}\n${starter.query}`).join('\n\n')}
                      </pre>
                    </div>
                  ) : null}
                </details>
              ) : null}
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
