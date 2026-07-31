import { buildAttentionIndex, deriveAggregateGraph } from '../core/attention';
import { compileTopoGraph } from '../core/compiler';
import {
  assertValidPositionOnlyFields,
  patchCompiledPositions,
  supportsPositionOnlyCompile
} from '../core/incrementalCompile';
import { assertRendererLimits } from '../core/limits';
import { topoDiagnosticFromError } from '../core/renderContract';
import type {
  CompiledGraph,
  TopoDocument,
  TopoViewerDiagnostic,
  TopoViewerExtensionContext,
  TopoViewerProps
} from '../core/types';
import {
  applyAfterCompileExtensions,
  applyAttentionToCompiledGraph,
  applyBeforeCompileExtensions,
  resolveAttentionPresentation
} from './graphDecorators';

export interface RuntimeCompilationValue {
  baseCompiled: CompiledGraph;
  compileToken: object;
  positionOnlyCompile: boolean;
  preparedDocument: TopoDocument;
}

export interface RuntimeCompilationCache extends RuntimeCompilationValue {
  documentSignature: string;
  positionOnlyEligible: boolean;
  renderSignature: string;
}

export type RuntimeCompilationResult =
  | { ok: true; value: RuntimeCompilationValue }
  | { ok: false; diagnostics: readonly TopoViewerDiagnostic[] };

interface RuntimeCompilationInput {
  attention: TopoViewerProps['attention'];
  document: TopoDocument;
  documentSignature: string;
  extensions: NonNullable<TopoViewerProps['extensions']>;
  extensionContext: TopoViewerExtensionContext;
  layout: TopoViewerProps['layout'];
  previous?: RuntimeCompilationCache;
  renderSignature: string;
  selectedLayerIds: string[];
  toggles: NonNullable<TopoViewerProps['toggles']>;
}

interface RuntimeCompilationOutput {
  cache?: RuntimeCompilationCache;
  result: RuntimeCompilationResult;
}

function successfulOutput(
  value: RuntimeCompilationValue,
  input: RuntimeCompilationInput,
  positionOnlyEligible: boolean
): RuntimeCompilationOutput {
  return {
    cache: {
      ...value,
      documentSignature: input.documentSignature,
      positionOnlyEligible,
      renderSignature: input.renderSignature
    },
    result: { ok: true, value }
  };
}

export function compileRuntimeGraph(input: RuntimeCompilationInput): RuntimeCompilationOutput {
  try {
    const positionOnlyEligible = supportsPositionOnlyCompile({
      document: input.document,
      hasExtensions: input.extensions.length > 0,
      layoutOverride: input.layout
    });
    if (
      input.previous?.positionOnlyEligible &&
      input.attention === undefined &&
      input.previous.documentSignature === input.documentSignature &&
      input.previous.renderSignature === input.renderSignature &&
      positionOnlyEligible
    ) {
      assertValidPositionOnlyFields(input.document);
      return successfulOutput({
        preparedDocument: input.document,
        baseCompiled: patchCompiledPositions(input.previous.baseCompiled, input.document),
        compileToken: input.previous.compileToken,
        positionOnlyCompile: true
      }, input, true);
    }

    const nextDocument = applyBeforeCompileExtensions(input.document, input.extensionContext, input.extensions);
    const aggregateConfig = nextDocument.attention?.aggregate;
    const linkGroupingConfig = nextDocument.attention?.links?.grouping;
    const reducedDocument = aggregateConfig?.groups?.length || linkGroupingConfig
      ? deriveAggregateGraph(nextDocument, buildAttentionIndex(nextDocument), {
          groups: aggregateConfig?.groups || [],
          expandedGroupIds: aggregateConfig?.expandedGroupIds || [],
          linkGrouping: linkGroupingConfig
        }).document
      : nextDocument;
    assertRendererLimits(reducedDocument);
    const attentionPresentation = resolveAttentionPresentation(reducedDocument, input.attention);
    const compiledGraph = applyAttentionToCompiledGraph(
      compileTopoGraph(reducedDocument, input.selectedLayerIds, input.toggles, input.layout),
      attentionPresentation
    );
    const extensionContext = { ...input.extensionContext, document: reducedDocument };
    return successfulOutput({
      preparedDocument: reducedDocument,
      baseCompiled: applyAfterCompileExtensions(compiledGraph, extensionContext, input.extensions),
      compileToken: {},
      positionOnlyCompile: false
    }, input, input.attention === undefined && positionOnlyEligible);
  } catch (error) {
    return { result: { ok: false, diagnostics: [topoDiagnosticFromError(error)] } };
  }
}
