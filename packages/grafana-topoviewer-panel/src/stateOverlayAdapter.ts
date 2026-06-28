import type { GraphLink, GraphNode, StyleDeclaration, TopoDocument, TopoViewerExtension } from 'topoviewer';
import type { GrafanaPanelDiagnostic } from './types';
import type { GrafanaTelemetryLinkState } from './telemetryFrames';
import {
  accentColorForTelemetrySeverity,
  colorForTelemetrySeverity,
  compareTelemetrySeverity,
  defaultTelemetryThresholds,
  severityForTelemetry,
  type TelemetrySeverity,
  type TelemetrySeverityThresholds
} from './telemetryRules';

export interface TelemetryOverlayOptions {
  sourceId?: string;
  thresholds?: TelemetrySeverityThresholds;
}

export interface TelemetryLinkOverlay {
  link: GraphLink;
  state: GrafanaTelemetryLinkState;
  severity: TelemetrySeverity;
  style: StyleDeclaration;
  endpointStyle: StyleDeclaration;
}

export interface TelemetryOverlay {
  linksById: Record<string, TelemetryLinkOverlay>;
  nodeStylesById: Record<string, StyleDeclaration>;
  diagnostics: GrafanaPanelDiagnostic[];
}

function warning(code: string, message: string): GrafanaPanelDiagnostic {
  return { severity: 'warning', code, message };
}

function linkEndpointKey(source: string | undefined, target: string | undefined): string | undefined {
  return source && target ? `${source}->${target}` : undefined;
}

function linkLabel(state: GrafanaTelemetryLinkState): string {
  if (state.up === false) return 'DOWN';
  if (typeof state.utilizationPercent === 'number') return `${Math.round(state.utilizationPercent)}%`;
  return 'telemetry';
}

function styleForLinkSeverity(severity: TelemetrySeverity, state: GrafanaTelemetryLinkState): StyleDeclaration {
  const color = colorForTelemetrySeverity(severity);
  const accent = accentColorForTelemetrySeverity(severity);
  if (!color || !accent) return {};
  if (state.up === false) {
    return {
      lineColor: color,
      lineWidth: 7,
      lineStyle: 'dashed',
      lineDashPattern: '8 5',
      label: linkLabel(state),
      labelColor: accent,
      textBackgroundColor: 'var(--topoviewer-edge-label-bg)',
      targetArrowColor: color,
      sourceArrowColor: color
    };
  }
  const lineWidth = severity === 'error' ? 6 : severity === 'warning' ? 5 : severity === 'info' ? 4 : 3;
  return {
    lineColor: color,
    lineWidth,
    lineStyle: 'solid',
    label: linkLabel(state),
    labelColor: accent,
    textBackgroundColor: 'var(--topoviewer-edge-label-bg)',
    targetArrowColor: color,
    sourceArrowColor: color
  };
}

function styleForEndpointSeverity(severity: TelemetrySeverity): StyleDeclaration {
  const color = colorForTelemetrySeverity(severity);
  if (!color) return {};
  return {
    statusColor: color,
    statusPlacement: 'topLeft',
    outlineColor: color,
    outlineWidth: severity === 'error' ? 5 : severity === 'warning' ? 4 : 3,
    outlineOpacity: severity === 'success' ? 0.35 : 0.82
  };
}

function mergeStyle(base: StyleDeclaration | undefined, overlay: StyleDeclaration): StyleDeclaration {
  return {
    ...(base || {}),
    ...overlay
  };
}

function isBetterSeverity(next: TelemetrySeverity, current: TelemetrySeverity | undefined): boolean {
  return compareTelemetrySeverity(next, current || 'none') > 0;
}

function matchTelemetryState(
  state: GrafanaTelemetryLinkState,
  linksById: Map<string, GraphLink>,
  linksByEndpoint: Map<string, GraphLink>
): GraphLink | undefined {
  if (state.linkId && linksById.has(state.linkId)) return linksById.get(state.linkId);
  const endpointKey = linkEndpointKey(state.source, state.target);
  if (endpointKey && linksByEndpoint.has(endpointKey)) return linksByEndpoint.get(endpointKey);
  const reverseEndpointKey = linkEndpointKey(state.target, state.source);
  return reverseEndpointKey ? linksByEndpoint.get(reverseEndpointKey) : undefined;
}

export function createTelemetryOverlay(
  document: TopoDocument | undefined,
  states: GrafanaTelemetryLinkState[],
  options: TelemetryOverlayOptions = {}
): TelemetryOverlay {
  const graph = document?.graph;
  if (!graph?.links?.length || !states.length) {
    return { linksById: {}, nodeStylesById: {}, diagnostics: [] };
  }

  const linksById = new Map(graph.links.map((link) => [link.id, link]));
  const linksByEndpoint = new Map<string, GraphLink>();
  for (const link of graph.links) {
    const endpointKey = linkEndpointKey(link.source, link.target);
    if (endpointKey) linksByEndpoint.set(endpointKey, link);
  }

  const overlayLinks: Record<string, TelemetryLinkOverlay> = {};
  const nodeStylesById: Record<string, StyleDeclaration> = {};
  const endpointSeverityById: Record<string, TelemetrySeverity> = {};
  const diagnostics: GrafanaPanelDiagnostic[] = [];
  const thresholds = options.thresholds || defaultTelemetryThresholds;

  for (const state of states) {
    if (options.sourceId && state.sourceId && state.sourceId !== options.sourceId) continue;
    const link = matchTelemetryState(state, linksById, linksByEndpoint);
    if (!link) {
      diagnostics.push(warning(
        'telemetry-link-unmatched',
        `Telemetry sample for link "${state.linkId || `${state.source || '?'} -> ${state.target || '?'}`}" did not match the selected topology.`
      ));
      continue;
    }
    const severity = severityForTelemetry(
      { up: state.up, utilizationPercent: state.utilizationPercent },
      thresholds
    );
    const linkStyle = styleForLinkSeverity(severity, state);
    const endpointStyle = styleForEndpointSeverity(severity);
    overlayLinks[link.id] = { link, state, severity, style: linkStyle, endpointStyle };
    for (const endpointId of [link.source, link.target]) {
      if (!isBetterSeverity(severity, endpointSeverityById[endpointId])) continue;
      endpointSeverityById[endpointId] = severity;
      nodeStylesById[endpointId] = endpointStyle;
    }
  }

  return { linksById: overlayLinks, nodeStylesById, diagnostics };
}

export function createTelemetryOverlayExtension(overlay: TelemetryOverlay): TopoViewerExtension | undefined {
  if (!Object.keys(overlay.linksById).length && !Object.keys(overlay.nodeStylesById).length) return undefined;
  return {
    name: 'grafana-telemetry-overlay',
    beforeCompile(document) {
      const graph = document.graph;
      if (!graph) return document;
      const links = graph.links?.map((link) => {
        const linkOverlay = overlay.linksById[link.id];
        if (!linkOverlay) return link;
        return {
          ...link,
          data: {
            ...(link.data || {}),
            telemetry: linkOverlay.state,
            telemetrySeverity: linkOverlay.severity
          },
          style: mergeStyle(link.style, linkOverlay.style)
        };
      });
      const nodes = graph.nodes?.map((node: GraphNode) => {
        const style = overlay.nodeStylesById[node.id];
        if (!style) return node;
        return {
          ...node,
          data: {
            ...(node.data || {}),
            telemetrySeverity: endpointSeverityByIdFromStyle(style)
          },
          style: mergeStyle(node.style, style)
        };
      });
      return {
        ...document,
        graph: {
          ...graph,
          links,
          nodes
        }
      };
    }
  };
}

function endpointSeverityByIdFromStyle(style: StyleDeclaration): TelemetrySeverity {
  const color = typeof style.statusColor === 'string' ? style.statusColor : '';
  if (color === '#d32f2f') return 'error';
  if (color === '#ff9800') return 'warning';
  if (color === '#42a5f5') return 'info';
  if (color === '#4caf50') return 'success';
  return 'none';
}
