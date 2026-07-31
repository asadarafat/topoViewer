import { compileTopoGraph } from './compiler';
import { rendererLimitViolations } from './limits';
import type {
  CompiledGraph,
  LayoutConfig,
  TopoCompileResult,
  TopoDocument,
  TopoRenderState,
  TopoViewerDiagnostic,
  TopoViewerDiagnosticCode,
  TopoViewerToggles
} from './types';
import { validateTopoDocument } from './validation';

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error || 'Unknown TopoViewer error');
}

export function topoDiagnosticFromError(
  error: unknown,
  fallbackCode: TopoViewerDiagnosticCode = 'compile-error'
): TopoViewerDiagnostic {
  const message = errorMessage(error);
  const code = /renderer limits exceeded/i.test(message)
    ? 'renderer-limit'
    : /document is invalid/i.test(message)
      ? 'validation-error'
      : fallbackCode;
  return { code, message, severity: 'error' };
}

export function compileTopoGraphResult(
  input: unknown,
  selectedLayerIds?: string[],
  toggles: TopoViewerToggles = {},
  layoutOverride: LayoutConfig = {}
): TopoCompileResult {
  try {
    const document = validateTopoDocument(input);
    const violations = rendererLimitViolations(document);
    if (violations.length) {
      return {
        ok: false,
        diagnostics: violations.map((message) => ({
          code: 'renderer-limit',
          message: `TopoViewer renderer limits exceeded: ${message}`,
          severity: 'error'
        }))
      };
    }
    return {
      ok: true,
      diagnostics: [],
      graph: compileTopoGraph(document, selectedLayerIds, toggles, layoutOverride)
    };
  } catch (error) {
    return { ok: false, diagnostics: [topoDiagnosticFromError(error)] };
  }
}

function sourceObjectCount(document: TopoDocument): number {
  const graph = document.graph || {};
  const diagram = document.diagram || {};
  return (graph.nodes?.length || 0)
    + (graph.links?.length || 0)
    + (graph.paths?.length || 0)
    + (graph.regions?.length || 0)
    + (diagram.shapes?.length || 0)
    + (diagram.connectors?.length || 0)
    + (diagram.callouts?.length || 0)
    + (diagram.texts?.length || 0);
}

export function classifyTopoRenderState(document: TopoDocument, graph: CompiledGraph): TopoRenderState {
  if (graph.nodes.length || graph.edges.length) return 'ready';
  return sourceObjectCount(document) ? 'filtered-empty' : 'empty';
}
