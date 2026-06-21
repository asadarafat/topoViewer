import yaml from 'js-yaml';
import {
  lintTopoDocument,
  validateTopoDocument,
  type DiagramCallout,
  type DiagramConnector,
  type DiagramShape,
  type GraphLink,
  type GraphNode,
  type GraphPath,
  type GraphRegion,
  type TopoDocument
} from 'topoviewer';
import type { ValidationResult, WebviewDiagnostic, WebviewState } from './types';

function parseYamlObject(text: string, source: string): Record<string, unknown> {
  const parsed = yaml.load(text || '{}');
  if (!parsed) return {};
  if (typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`${source} must contain a YAML object at the document root.`);
  }
  return parsed as Record<string, unknown>;
}

export function composeTopoDocument(state: WebviewState): TopoDocument {
  const topology = parseYamlObject(state.topologyText, 'Topology YAML');
  const stylesheet = parseYamlObject(state.stylesheetText, 'Stylesheet YAML');
  return {
    ...stylesheet,
    ...topology,
    layout: topology.layout || stylesheet.layout,
    limits: topology.limits || stylesheet.limits,
    icons: stylesheet.icons || topology.icons,
    labelFields: stylesheet.labelFields || topology.labelFields,
    stylesheet: stylesheet.stylesheet || topology.stylesheet
  } as TopoDocument;
}

function layerObjectCounts(document: TopoDocument): Map<string, number> {
  const counts = new Map((document.graph?.layers || []).map((layer) => [layer.id, 0]));
  const entities: Array<GraphNode | GraphLink | GraphPath | GraphRegion | DiagramShape | DiagramConnector | DiagramCallout> = [
    ...(document.graph?.nodes || []),
    ...(document.graph?.links || []),
    ...(document.graph?.paths || []),
    ...(document.graph?.regions || []),
    ...(document.diagram?.shapes || []),
    ...(document.diagram?.connectors || []),
    ...(document.diagram?.callouts || [])
  ];

  for (const entity of entities) {
    for (const layerId of entity.layers || []) {
      if (counts.has(layerId)) {
        counts.set(layerId, (counts.get(layerId) || 0) + 1);
      }
    }
  }
  return counts;
}

export function validateSources(state: WebviewState): ValidationResult {
  const diagnostics: WebviewDiagnostic[] = [];
  let document: TopoDocument | undefined;

  if (state.topologyMissing) {
    diagnostics.push({
      severity: 'error',
      source: 'host',
      code: 'missing-topology-yaml',
      message: `Topology YAML file was not found${state.topologyPath ? `: ${state.topologyPath}` : ''}.`
    });
  }
  if (state.stylesheetMissing) {
    diagnostics.push({
      severity: 'warning',
      source: 'host',
      code: 'missing-stylesheet-yaml',
      message: `Stylesheet YAML file was not found${state.stylesheetPath ? `: ${state.stylesheetPath}` : ''}.`
    });
  }

  try {
    document = validateTopoDocument(composeTopoDocument(state), 'VS Code TopoViewer preview');
    diagnostics.push(...lintTopoDocument(document, { requireNames: false }).map((issue) => ({
      severity: issue.severity,
      source: 'semantic' as const,
      code: issue.code,
      message: issue.message,
      path: issue.path
    })));
  } catch (error) {
    diagnostics.push({
      severity: 'error',
      source: 'schema',
      code: 'invalid-topoviewer-document',
      message: error instanceof Error ? error.message : String(error)
    });
  }

  const objectCounts = document ? layerObjectCounts(document) : new Map<string, number>();

  return {
    document,
    diagnostics,
    layers: document?.graph?.layers?.map((layer) => ({
      id: layer.id,
      name: layer.name,
      objectCount: objectCounts.get(layer.id) || 0
    })) || []
  };
}
