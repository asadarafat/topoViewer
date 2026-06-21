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

class SourceYamlError extends Error {
  column?: number;
  document: 'topology' | 'stylesheet';
  line?: number;

  constructor(message: string, document: 'topology' | 'stylesheet', line?: number, column?: number) {
    super(message);
    this.name = 'SourceYamlError';
    this.document = document;
    this.line = line;
    this.column = column;
  }
}

function isYamlException(error: unknown): error is yaml.YAMLException {
  return !!error && typeof error === 'object' && 'mark' in error;
}

function parseYamlObject(text: string, source: string, document: 'topology' | 'stylesheet'): Record<string, unknown> {
  let parsed: unknown;
  try {
    parsed = yaml.load(text || '{}');
  } catch (error) {
    if (isYamlException(error) && error.mark) {
      throw new SourceYamlError(error.message, document, error.mark.line + 1, error.mark.column + 1);
    }
    throw new SourceYamlError(error instanceof Error ? error.message : String(error), document, 1, 1);
  }
  if (!parsed) return {};
  if (typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new SourceYamlError(`${source} must contain a YAML object at the document root.`, document, 1, 1);
  }
  return parsed as Record<string, unknown>;
}

export function composeTopoDocument(state: WebviewState): TopoDocument {
  const topology = parseYamlObject(state.topologyText, 'Topology YAML', 'topology');
  const stylesheet = parseYamlObject(state.stylesheetText, 'Stylesheet YAML', 'stylesheet');
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

function firstValidationPath(message: string): string | undefined {
  const suffix = message.split(' is invalid: ')[1] || message;
  const match = suffix.match(/^([^:;]+):/);
  return match?.[1] && match[1] !== '<root>' ? match[1] : undefined;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function findYamlPathLine(text: string, path: string | undefined): number | undefined {
  if (!path) return undefined;
  const segments = path.split('.').filter(Boolean);
  const candidateKeys = [...segments].reverse().filter((segment) => !/^\d+$/.test(segment));
  const lines = text.split(/\r?\n/);
  for (const key of candidateKeys) {
    const pattern = new RegExp(`^\\s*(?:-\\s*)?${escapeRegExp(key)}\\s*:`);
    const index = lines.findIndex((line) => pattern.test(line));
    if (index !== -1) return index + 1;
  }
  const firstContent = lines.findIndex((line) => line.trim());
  return firstContent === -1 ? 1 : firstContent + 1;
}

function diagnosticLocationForPath(path: string | undefined, state: WebviewState): Pick<WebviewDiagnostic, 'column' | 'document' | 'line'> {
  const topologyLine = findYamlPathLine(state.topologyText, path);
  if (topologyLine !== undefined) return { document: 'topology', line: topologyLine, column: 1 };
  const stylesheetLine = findYamlPathLine(state.stylesheetText, path);
  if (stylesheetLine !== undefined) return { document: 'stylesheet', line: stylesheetLine, column: 1 };
  return {};
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
      path: issue.path,
      ...diagnosticLocationForPath(issue.path, state)
    })));
  } catch (error) {
    const sourceYamlError = error instanceof SourceYamlError ? error : undefined;
    const inferredPath = sourceYamlError ? undefined : firstValidationPath(error instanceof Error ? error.message : String(error));
    diagnostics.push({
      severity: 'error',
      source: 'schema',
      code: 'invalid-topoviewer-document',
      message: error instanceof Error ? error.message : String(error),
      ...(sourceYamlError
        ? { document: sourceYamlError.document, line: sourceYamlError.line, column: sourceYamlError.column }
        : diagnosticLocationForPath(inferredPath, state))
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
