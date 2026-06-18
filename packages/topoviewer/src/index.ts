export { TopoViewer } from './components/TopoViewer';
export { compileTopoGraph, rebuildRegionNodes } from './core/compiler';
export { computeLayoutPositions } from './core/layout';
export { downloadTopoViewerPdf, downloadTopoViewerPng, downloadTopoViewerSvg, topoviewerToPdf, topoviewerToPng, topoviewerToSvg } from './core/export';
export { assertRendererLimits, DEFAULT_RENDERER_LIMITS, effectiveRendererLimits, rendererLimitUsage, rendererLimitViolations } from './core/limits';
export {
  buildAttentionIndex,
  deriveAggregateGraph,
  deriveAttentionPresentation,
  explainAttentionScore,
  FocusQueryError,
  resolveFocusQuery,
  scoreAttention
} from './core/attention';
export {
  attentionSourceKey,
  attentionStateKey,
  buildAttentionIndexCached,
  resolveAttentionPresentationCached
} from './core/attention/cache';
export { CURRENT_SCHEMA_VERSION, migrateTopoDocument, migrateTopoToggles } from './core/migration';
export { validateTopoDocument } from './core/validation';
export { lintTopoDocument } from './core/lint';
export type { StaticExportOptions, StaticPdfExportOptions } from './core/export';
export type { LintIssue, LintOptions } from './core/lint';
export type {
  AttentionGraphIndex,
  AttentionGraphInput,
  AttentionIndexedObject,
  AttentionObjectByKind,
  AttentionObjectKind,
  FocusDependencyDirection,
  FocusDependencyQuery,
  FocusChangeQuery,
  FocusPresentationMode,
  FocusQuery,
  FocusQueryErrorCode,
  FocusResult,
  AttentionViewportPolicy,
  AggregateGraphResult,
  AggregateGroupDefinition,
  AggregateGroupKind,
  AggregateGroupSummary,
  DeriveAggregateGraphOptions,
  LabelAggregateGroupDefinition,
  LinkAggregateGroupSummary,
  LinkGroupingKey,
  LinkGroupingOptions,
  LinkGroupingViewportPolicy,
  ParentAggregateGroupDefinition,
  RegionAggregateGroupDefinition,
  AttentionLabelPriority,
  AttentionPresentation,
  AttentionPresentationResult,
  AttentionPresentationState,
  AttentionScore,
  AttentionScoreResult,
  AttentionScoringOptions
} from './core/attention';
export type { AttentionRuntimeState } from './core/attention/cache';
export type {
  DiagramCallout,
  DiagramConnector,
  DiagramDefinition,
  DiagramPin,
  DiagramShape,
  GraphDefinition,
  GraphLink,
  GraphNode,
  GraphPath,
  GraphRegion,
  IconSpec,
  LayerDefinition,
  LayoutConfig,
  StyleDeclaration,
  StyleRule,
  StylesheetDocument,
  ToggleDefinition,
  TopoDocument,
  TopologyDocument,
  TopoViewerExtension,
  TopoViewerExtensionContext,
  TopoViewerViewport,
  TopoViewerProps,
  TopoViewerToggles
} from './core/types';
