import { validateTopoDocument } from './validation';
import type { StylesheetDocument, TopoDocument, TopologyDocument } from './types';
import { TopologyOwnershipError, topologyOwnershipIssues } from './topologyOwnership';

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

/**
 * Compose separately-authored topology and stylesheet YAML into the single
 * TopoDocument consumed by the renderer.
 *
 * Ownership is deliberately aligned with the portable source-bundle contract
 * used by Studio and every rendering surface:
 * - topology owns graph facts, diagram facts, toggles, and attention;
 * - stylesheet owns layout, limits, icon definitions, label fields, and style rules;
 * - presentation fields in topology are rejected instead of resolved by precedence.
 */
export function composeTopoViewerDocument(
  topology: TopologyDocument | undefined,
  stylesheet: StylesheetDocument | undefined = {},
  options: ComposeTopoViewerDocumentOptions = {}
): TopoDocument {
  const topologyDocument = topology || {};
  const stylesheetDocument = stylesheet || {};
  const ownershipIssues = topologyOwnershipIssues(topologyDocument);
  if (ownershipIssues.length) {
    throw new TopologyOwnershipError(options.validationContext || 'TopoViewer YAML', ownershipIssues);
  }
  const composed: TopoDocument = {
    ...stylesheetDocument,
    ...topologyDocument,
    graph: topologyDocument.graph,
    diagram: topologyDocument.diagram,
    layout: stylesheetDocument.layout,
    limits: stylesheetDocument.limits,
    toggles: topologyDocument.toggles || [],
    attention: topologyDocument.attention,
    icons: stylesheetDocument.icons,
    labelFields: stylesheetDocument.labelFields,
    stylesheet: stylesheetDocument.stylesheet
  };

  if (options.validate === false) return composed;
  return validateTopoDocument(composed, options.validationContext || 'TopoViewer YAML');
}
