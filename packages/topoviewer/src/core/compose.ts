import { validateTopoDocument } from './validation';
import type { TopoDocument } from './types';

export interface ComposeTopoViewerDocumentOptions {
  /**
   * Validate the composed document before returning it.
   *
   * Renderer entrypoints should keep validation enabled. Unit tests and tooling
   * that need to inspect partially-authored documents may disable it.
   */
  validate?: boolean;
  validationContext?: string;
}

function definedOrFallback<T>(primary: T | undefined, fallback: T | undefined): T | undefined {
  return primary !== undefined ? primary : fallback;
}

/**
 * Compose separately-authored topology and stylesheet YAML into the single
 * TopoDocument consumed by the renderer.
 *
 * Precedence is deliberately aligned with the browser harness, which is the
 * golden authoring surface:
 * - topology owns graph facts, diagram facts, layout, limits, toggles, and attention;
 * - stylesheet owns icon definitions, label fields, and stylesheet rules;
 * - unknown top-level keys follow topology-over-stylesheet precedence.
 */
export function composeTopoViewerDocument(
  topology: TopoDocument | undefined,
  stylesheet: TopoDocument | undefined = {},
  options: ComposeTopoViewerDocumentOptions = {}
): TopoDocument {
  const topologyDocument = topology || {};
  const stylesheetDocument = stylesheet || {};
  const composed: TopoDocument = {
    ...stylesheetDocument,
    ...topologyDocument,
    graph: definedOrFallback(topologyDocument.graph, stylesheetDocument.graph),
    diagram: definedOrFallback(topologyDocument.diagram, stylesheetDocument.diagram),
    layout: definedOrFallback(topologyDocument.layout, stylesheetDocument.layout),
    limits: definedOrFallback(topologyDocument.limits, stylesheetDocument.limits),
    toggles: definedOrFallback(topologyDocument.toggles, stylesheetDocument.toggles) || [],
    attention: definedOrFallback(topologyDocument.attention, stylesheetDocument.attention),
    icons: definedOrFallback(stylesheetDocument.icons, topologyDocument.icons),
    labelFields: definedOrFallback(stylesheetDocument.labelFields, topologyDocument.labelFields),
    stylesheet: definedOrFallback(stylesheetDocument.stylesheet, topologyDocument.stylesheet)
  };

  if (options.validate === false) return composed;
  return validateTopoDocument(composed, options.validationContext || 'TopoViewer YAML');
}
