import { createRoot } from 'react-dom/client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import yaml from 'js-yaml';
import { TopoViewer } from './components/TopoViewer';
import { ViewportSettingsPanel } from './components/ViewportSettingsPanel';
import { helperLinesInitialEnabled, helperLinesWithEnabled } from './components/helperLines';
import { buildAttentionIndex, deriveAggregateGraph } from './core/attention';
import { composeTopoViewerDocument } from './core/compose';
import { layerIds, selectedLayerIdsOrAll, toggleSelectedLayerId } from './core/layers';
import { defaultTopoViewerToggles } from './core/toggles';
import type { TopoDocument, TopoViewerProps, TopoViewerToggles } from './core/types';
import type { AggregateGroupDefinition, AttentionViewportPolicy, LinkGroupingOptions, LinkGroupingViewportPolicy } from './core/attention';

type FocusQuery = NonNullable<NonNullable<TopoViewerProps['attention']>['query']>;
type FocusMode = NonNullable<FocusQuery['mode']>;
type EmbedAggregate = {
  groups?: AggregateGroupDefinition[];
  expandedGroupIds?: string[];
  expandOnClick?: boolean;
  viewport?: AttentionViewportPolicy;
};
type EmbedAttention = TopoViewerProps['attention'] & {
  interactive?: boolean;
  clickMode?: FocusMode;
  aggregate?: EmbedAggregate;
  links?: {
    grouping?: LinkGroupingOptions;
  };
};

type EmbedElement = HTMLElement & {
  dataset: {
    topology?: string;
    stylesheet?: string;
    controls?: string;
    controlsOpen?: string;
    helperLines?: string;
    selectedLayerIds?: string;
    attention?: string;
    topoviewerMounted?: string;
  };
};

async function loadYaml(url: string): Promise<TopoDocument> {
  const response = await fetch(url, { credentials: 'same-origin' });
  if (!response.ok) {
    throw new Error(`Failed to load ${url}: HTTP ${response.status}`);
  }

  const text = await response.text();
  return (yaml.load(text) || {}) as TopoDocument;
}

function parseAttention(raw: string | undefined): EmbedAttention | undefined {
  if (!raw) return undefined;

  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('TopoViewer embed attention must be a JSON object.');
  }

  return parsed as EmbedAttention;
}

function parseSelectedLayerIds(raw: string | undefined): string[] | undefined {
  if (!raw) return undefined;

  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed) || !parsed.every((item) => typeof item === 'string')) {
    throw new Error('TopoViewer embed selectedLayerIds must be a JSON string array.');
  }

  return parsed;
}

function parseHelperLines(raw: string | undefined): TopoViewerProps['helperLines'] {
  if (!raw) return undefined;

  const parsed = JSON.parse(raw);
  if (typeof parsed === 'boolean') return parsed;
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('TopoViewer embed helperLines must be a JSON boolean or object.');
  }

  return parsed as TopoViewerProps['helperLines'];
}

function graphObjectSets(document: TopoDocument) {
  const graph = document.graph || {};
  return {
    nodes: new Set((graph.nodes || []).map((node) => node.id)),
    links: new Set((graph.links || []).map((link) => link.id)),
    paths: new Set((graph.paths || []).map((path) => path.id)),
    regions: new Set((graph.regions || []).map((region) => region.id))
  };
}

function focusQueryForObject(
  id: string,
  sets: ReturnType<typeof graphObjectSets>,
  mode: FocusMode
): FocusQuery | undefined {
  if (sets.paths.has(id)) return { pathIds: [id], mode };
  if (sets.regions.has(id)) return { regionIds: [id], mode };
  if (sets.nodes.has(id) || sets.links.has(id)) return { ids: [id], mode };
  return undefined;
}

function withUniqueIds(current: string[], next: readonly string[]): string[] {
  return [...new Set([...current, ...next])];
}

function withoutIds(current: string[], remove: readonly string[]): string[] {
  const blocked = new Set(remove);
  return current.filter((id) => !blocked.has(id));
}

function aggregateViewportGroupIds(aggregate: EmbedAggregate | undefined): string[] {
  if (!aggregate?.groups?.length) return [];
  return [...(aggregate.viewport?.groupIds || aggregate.groups.map((group) => group.id))];
}

function lowerZoomThreshold(low: number | undefined, high: number | undefined, hysteresis: number | undefined): number | undefined {
  if (low !== undefined) return Number(low);
  if (high !== undefined) return Number(high) - Math.max(0, Number(hysteresis || 0));
  return undefined;
}

function upperZoomThreshold(high: number | undefined, low: number | undefined, hysteresis: number | undefined): number | undefined {
  if (high !== undefined) return Number(high);
  if (low !== undefined) return Number(low) + Math.max(0, Number(hysteresis || 0));
  return undefined;
}

function aggregateZoomThresholds(policy: AttentionViewportPolicy | undefined) {
  return {
    collapseBelowZoom: lowerZoomThreshold(policy?.collapseBelowZoom, policy?.expandAboveZoom, policy?.hysteresis),
    expandAboveZoom: upperZoomThreshold(policy?.expandAboveZoom, policy?.collapseBelowZoom, policy?.hysteresis)
  };
}

function linkGroupingZoomThresholds(policy: LinkGroupingViewportPolicy | undefined) {
  return {
    groupBelowZoom: lowerZoomThreshold(policy?.groupBelowZoom, policy?.ungroupAboveZoom, policy?.hysteresis),
    ungroupAboveZoom: upperZoomThreshold(policy?.ungroupAboveZoom, policy?.groupBelowZoom, policy?.hysteresis)
  };
}

function EmbeddedTopoViewer({
  documentSpec,
  attention,
  controlsEnabled = true,
  controlsDefaultOpen = false,
  helperLines,
  initialSelectedLayerIds
}: {
  documentSpec: TopoDocument;
  attention?: EmbedAttention;
  controlsEnabled?: boolean;
  controlsDefaultOpen?: boolean;
  helperLines?: TopoViewerProps['helperLines'];
  initialSelectedLayerIds?: string[];
}) {
  const effectiveAttention = attention || documentSpec.attention;
  const aggregateConfig = effectiveAttention?.aggregate;
  const linkGroupingConfig = effectiveAttention?.links?.grouping;
  const initialExpandedAggregateIds = useMemo(() => aggregateConfig?.expandedGroupIds || [], [aggregateConfig]);
  const initialExpandedAggregateKey = useMemo(() => JSON.stringify(initialExpandedAggregateIds), [initialExpandedAggregateIds]);
  const [expandedAggregateIds, setExpandedAggregateIds] = useState<string[]>(() => [...initialExpandedAggregateIds]);
  const initialExpandedLinkGroupIds = useMemo(() => linkGroupingConfig?.expandedGroupIds || [], [linkGroupingConfig]);
  const initialExpandedLinkGroupKey = useMemo(() => JSON.stringify(initialExpandedLinkGroupIds), [initialExpandedLinkGroupIds]);
  const [expandedLinkGroupIds, setExpandedLinkGroupIds] = useState<string[]>(() => [...initialExpandedLinkGroupIds]);
  const [linkGroupingViewportEnabled, setLinkGroupingViewportEnabled] = useState(true);
  const effectiveLinkGrouping = useMemo<LinkGroupingOptions | undefined>(() => {
    if (!linkGroupingConfig) return undefined;
    return {
      ...linkGroupingConfig,
      enabled: linkGroupingConfig.enabled !== false && linkGroupingViewportEnabled,
      expandedGroupIds: expandedLinkGroupIds
    };
  }, [expandedLinkGroupIds, linkGroupingConfig, linkGroupingViewportEnabled]);
  const viewerDocument = useMemo<TopoDocument>(() => {
    if (!effectiveAttention) return documentSpec;
    return {
      ...documentSpec,
      attention: {
        ...(documentSpec.attention || {}),
        ...effectiveAttention,
        ...(aggregateConfig ? {
          aggregate: {
            ...aggregateConfig,
            expandedGroupIds: expandedAggregateIds
          }
        } : {}),
        ...(effectiveLinkGrouping ? {
          links: {
            ...(documentSpec.attention?.links || {}),
            ...(effectiveAttention.links || {}),
            grouping: effectiveLinkGrouping
          }
        } : {})
      }
    };
  }, [aggregateConfig, documentSpec, effectiveAttention, effectiveLinkGrouping, expandedAggregateIds]);
  const aggregateResult = useMemo(() => {
    if (!aggregateConfig?.groups?.length && !effectiveLinkGrouping) return undefined;
    return deriveAggregateGraph(viewerDocument, buildAttentionIndex(viewerDocument), {
      groups: aggregateConfig?.groups || [],
      expandedGroupIds: expandedAggregateIds,
      linkGrouping: effectiveLinkGrouping
    });
  }, [aggregateConfig, effectiveLinkGrouping, expandedAggregateIds, viewerDocument]);
  const aggregateGroupByNodeId = useMemo(() => new Map((aggregateResult?.groups || []).map((group) => [
    group.aggregateNodeId,
    group.id
  ])), [aggregateResult]);
  const aggregateGroupBySourceObjectId = useMemo(() => new Map((aggregateConfig?.groups || []).flatMap((group) => {
    if (group.by === 'region') return [[group.regionId, group.id]];
    if (group.by === 'parent') return [[group.parentId, group.id]];
    return [];
  })), [aggregateConfig]);
  const linkGroupByEdgeId = useMemo(() => new Map((aggregateResult?.linkGroups || []).map((group) => [
    group.aggregateLinkId,
    group.id
  ])), [aggregateResult]);
  const layers = useMemo(() => viewerDocument.graph?.layers || [], [viewerDocument]);
  const toggleDefinitions = useMemo(() => viewerDocument.toggles || [], [viewerDocument]);
  const graphSets = useMemo(() => graphObjectSets(viewerDocument), [viewerDocument]);
  const [selectedLayerIds, setSelectedLayerIds] = useState(() => selectedLayerIdsOrAll(layers, initialSelectedLayerIds));
  const [toggles, setToggles] = useState<TopoViewerToggles>(() => defaultTopoViewerToggles(viewerDocument));
  const [helperLinesEnabled, setHelperLinesEnabled] = useState(() => helperLinesInitialEnabled(helperLines));
  const [controlsOpen, setControlsOpen] = useState(controlsDefaultOpen);
  const [attentionQuery, setAttentionQuery] = useState<FocusQuery | undefined>(() => effectiveAttention?.query);
  const attentionInteractive = effectiveAttention?.interactive === true;
  const attentionClickMode = effectiveAttention?.clickMode || effectiveAttention?.query?.mode || 'dim-context';
  const aggregateExpandOnClick = aggregateConfig?.expandOnClick !== false;
  const linkGroupingExpandOnClick = linkGroupingConfig?.expandOnClick !== false;

  useEffect(() => {
    setExpandedAggregateIds([...initialExpandedAggregateIds]);
  }, [initialExpandedAggregateKey, initialExpandedAggregateIds]);

  useEffect(() => {
    setExpandedLinkGroupIds([...initialExpandedLinkGroupIds]);
    setLinkGroupingViewportEnabled(true);
  }, [initialExpandedLinkGroupKey, initialExpandedLinkGroupIds]);

  const handleViewportChange = useCallback((viewport: { zoom: number }) => {
    const zoom = Number(viewport.zoom);
    if (!Number.isFinite(zoom)) return;

    const aggregatePolicy = aggregateConfig?.viewport;
    const aggregateGroupIds = aggregateViewportGroupIds(aggregateConfig);
    if (aggregatePolicy && aggregateGroupIds.length) {
      const { collapseBelowZoom, expandAboveZoom } = aggregateZoomThresholds(aggregatePolicy);
      if (expandAboveZoom !== undefined && zoom >= expandAboveZoom) {
        setExpandedAggregateIds((current) => withUniqueIds(current, aggregateGroupIds));
      } else if (collapseBelowZoom !== undefined && zoom <= collapseBelowZoom) {
        setExpandedAggregateIds((current) => withoutIds(current, aggregateGroupIds));
      }
    }

    const linkPolicy = linkGroupingConfig?.viewport;
    if (linkPolicy) {
      const { groupBelowZoom, ungroupAboveZoom } = linkGroupingZoomThresholds(linkPolicy);
      if (ungroupAboveZoom !== undefined && zoom >= ungroupAboveZoom) {
        setLinkGroupingViewportEnabled(false);
        setExpandedLinkGroupIds([]);
      } else if (groupBelowZoom !== undefined && zoom <= groupBelowZoom) {
        setLinkGroupingViewportEnabled(true);
        setExpandedLinkGroupIds([]);
      }
    }
  }, [aggregateConfig, linkGroupingConfig]);

  const controls = controlsEnabled ? (
    <ViewportSettingsPanel
      layers={layers}
      selectedLayerIds={selectedLayerIds}
      toggles={toggles}
      toggleDefinitions={toggleDefinitions}
      hasAttention={!!attentionQuery}
      initialAttention={!!effectiveAttention?.query || !!aggregateConfig?.groups?.length || !!linkGroupingConfig}
      attentionControls={attentionInteractive || !!effectiveAttention?.query || !!attentionQuery || !!aggregateConfig?.groups?.length || !!linkGroupingConfig}
      helperLinesEnabled={helperLinesEnabled}
      onLayerChange={(layerId, enabled) => {
        setSelectedLayerIds((current) => toggleSelectedLayerId(current, layerId, enabled));
      }}
      onToggleChange={(toggleId, enabled) => setToggles((current) => ({ ...current, [toggleId]: enabled }))}
      onHelperLinesChange={setHelperLinesEnabled}
      onSelectAllLayers={() => setSelectedLayerIds(layerIds(layers))}
      onClearLayers={() => setSelectedLayerIds([])}
      onClearAttention={() => setAttentionQuery(undefined)}
      onResetAttention={() => {
        setAttentionQuery(effectiveAttention?.query);
        setExpandedAggregateIds([...initialExpandedAggregateIds]);
        setExpandedLinkGroupIds([...initialExpandedLinkGroupIds]);
        setLinkGroupingViewportEnabled(true);
      }}
    />
  ) : null;

  return (
    <div className="topoviewer-embed-shell">
      <div className="topoviewer-embed-viewport">
        {controlsEnabled && controlsOpen ? (
          <div className="topoviewer-embed-controls-overlay">
            {controls}
          </div>
        ) : null}
        <TopoViewer
          document={viewerDocument}
          selectedLayerIds={selectedLayerIds}
          toggles={toggles}
          layout={viewerDocument.layout}
          attention={attentionQuery ? { query: attentionQuery } : undefined}
          helperLines={helperLinesWithEnabled(helperLines, helperLinesEnabled)}
          onObjectClick={(attentionInteractive || aggregateConfig?.groups?.length || linkGroupingConfig) ? (object) => {
            if (aggregateExpandOnClick && object.element === 'node') {
              const aggregateGroupId = aggregateGroupByNodeId.get(object.id);
              if (aggregateGroupId) {
                setExpandedAggregateIds((current) => [...new Set([...current, aggregateGroupId])]);
                return;
              }
              const expandedGroupId = aggregateGroupBySourceObjectId.get(object.id);
              if (expandedGroupId && expandedAggregateIds.includes(expandedGroupId)) {
                setExpandedAggregateIds((current) => current.filter((item) => item !== expandedGroupId));
                return;
              }
            }
            if (linkGroupingExpandOnClick && object.element === 'edge') {
              const aggregateGroupId = object.data?.isLinkAggregate === true || object.data?.isLinkAggregate === 'true'
                ? String(object.data.aggregateId || '')
                : '';
              const linkGroupId = linkGroupByEdgeId.get(object.id) || aggregateGroupId || undefined;
              if (linkGroupId) {
                setExpandedLinkGroupIds((current) => [...new Set([...current, linkGroupId])]);
                return;
              }
            }
            if (!attentionInteractive) return;
            const query = focusQueryForObject(object.id, graphSets, attentionClickMode);
            if (query) setAttentionQuery(query);
          } : undefined}
          onLinkAggregateToggle={linkGroupingExpandOnClick ? (change) => {
            setExpandedLinkGroupIds((current) => change.expanded
              ? [...new Set([...current, change.groupId])]
              : current.filter((item) => item !== change.groupId));
          } : undefined}
          onPaneClick={(attentionInteractive || attentionQuery) ? () => setAttentionQuery(undefined) : undefined}
          onViewportChange={(aggregateConfig?.viewport || linkGroupingConfig?.viewport) ? handleViewportChange : undefined}
          controlPanelToggle={controlsEnabled ? {
            enabled: true,
            open: controlsOpen,
            onToggle: () => setControlsOpen((current) => !current)
          } : undefined}
        />
      </div>
    </div>
  );
}

function renderError(container: HTMLElement, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  container.innerHTML = '';
  const pre = document.createElement('pre');
  pre.className = 'topoviewer-error';
  pre.textContent = message;
  container.appendChild(pre);
}

async function mount(container: EmbedElement): Promise<void> {
  if (!container.dataset.topology) {
    throw new Error('TopoViewer embed is missing data-topology.');
  }

  const [topology, stylesheet] = await Promise.all([
    loadYaml(container.dataset.topology),
    container.dataset.stylesheet ? loadYaml(container.dataset.stylesheet) : Promise.resolve({})
  ]);

  const documentSpec = composeTopoViewerDocument(topology, stylesheet, {
    validationContext: 'TopoViewer embed YAML'
  });
  const attention = parseAttention(container.dataset.attention);
  const helperLines = parseHelperLines(container.dataset.helperLines);
  const selectedLayerIds = parseSelectedLayerIds(container.dataset.selectedLayerIds);
  const root = createRoot(container);
  root.render(
    <EmbeddedTopoViewer
      documentSpec={documentSpec}
      attention={attention}
      controlsEnabled={container.dataset.controls !== 'false'}
      controlsDefaultOpen={container.dataset.controlsOpen === 'true'}
      helperLines={helperLines}
      initialSelectedLayerIds={selectedLayerIds}
    />
  );
}

export function mountAll(): void {
  document.querySelectorAll<EmbedElement>('.topoviewer-embed').forEach((container) => {
    if (container.dataset.topoviewerMounted === 'true') return;
    container.dataset.topoviewerMounted = 'true';
    mount(container).catch((error) => renderError(container, error));
  });
}

declare global {
  interface Window {
    TopoViewerEmbed?: {
      mountAll: typeof mountAll;
    };
  }
}

window.TopoViewerEmbed = { mountAll };

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountAll, { once: true });
} else {
  mountAll();
}
