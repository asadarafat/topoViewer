export { TopoViewer } from './components/TopoViewer';
export { compileTopoGraph, rebuildRegionNodes } from './core/compiler';
export { classifyTopoRenderState, compileTopoGraphResult, topoDiagnosticFromError } from './core/renderContract';
export { buildTopoStatusLegend, normalizeTopoStatus, resolveTopoStatus, topoStatusRank } from './core/status';
export {
  topoViewerThemeClassName,
  topoViewerThemeStyle,
  TOPOVIEWER_DARK_THEME,
  TOPOVIEWER_LIGHT_THEME
} from './core/theme';
export { analyzeClosLayoutDiagnostics, computeClosLayoutPositions } from './core/closLayout';
export { BUILT_IN_LAYOUT_PROVIDERS, computeLayoutPositions } from './core/layout';
export { computeTreeLayoutPositions } from './core/treeLayout';
export {
  TOPOVIEWER_GUIDED_AUTHORING_INTERACTIONS,
  TOPOVIEWER_RAPID_AUTHORING_INTERACTIONS,
  TOPOVIEWER_RUNTIME_INTERACTIONS
} from './core/interactionPresets';
export { applyStyle, displayName, markdownToHtml as safeMarkdownToHtml } from './core/style';
export {
  downloadTopoViewerPdf,
  downloadTopoViewerPng,
  downloadTopoViewerSvg,
  topoviewerToPdf,
  topoviewerToPng,
  topoviewerToSvg
} from './core/exportCompatibility';
export { assertRendererLimits, DEFAULT_RENDERER_LIMITS, effectiveRendererLimits, rendererLimitUsage, rendererLimitViolations } from './core/limits';
export {
  buildAttentionIndex,
  deriveAggregateGraph,
  deriveAttentionPresentation,
  explainAttentionScore,
  FocusQueryError,
  normalizeViewportThresholds,
  reduceViewportExpansion,
  resolveFocusQuery,
  resolveViewportThresholdTransition,
  scoreAttention
} from './core/attention';
export {
  attentionSourceKey,
  attentionStateKey,
  buildAttentionIndexCached,
  resolveAttentionPresentationCached
} from './core/attention/cache';
export {
  CURRENT_SCHEMA_VERSION,
  migrateTopoBundle,
  migrateTopoDocument,
  migrateTopoToggles,
  type TopoBundleMigrationInput,
  type TopoBundleMigrationResult
} from './core/migration';
export { composeTopoViewerDocument } from './core/compose';
export { defaultTopoViewerToggles } from './core/toggles';
export { validateTopoDocument } from './core/validation';
export { lintTopoDocument } from './core/lint';
export { NODE_SHAPES, normalizeNodeShape, parseNodeShapePoints } from './core/nodeShapes';
export {
  DEFAULT_NODE_SHAPE,
  canonicalStyleKeyByLowercase,
  isColorStyleKey,
  isCommonLabelStyleKey,
  styleDefaultDefinition,
  styleDefaultNumber,
  styleDefaultSummary,
  styleDefaultValue,
  styleDefinitionForKey,
  styleDefinitions,
  styleDefinitionsByKind,
  styleValueDefinitionForKey
} from './core/styleDefaults';
export {
  nodeBadgePositions,
  nodeBorderStyles,
  nodeIconFitValues,
  nodeLabelPositions,
  nodeLabelTextOverflowValues,
  nodeLabelTextWrapValues,
  nodeStatusPlacements
} from './core/nodeStyle';
export type { StaticExportOptions, StaticPdfExportOptions } from './core/export';
export type { ComposeTopoViewerDocumentOptions } from './core/compose';
export type { LintIssue, LintOptions } from './core/lint';
export type { ClosLayoutDiagnostic } from './core/closLayout';
export type { LayoutPosition, LayoutPositions, LayoutProvider, LayoutProviderInput, LayoutProviderRegistry } from './core/layout';
export type { TopoViewerInteractionPreset } from './core/interactionPresets';
export type { NodeShapeName, NodeShapePoint, ParsedNodeShapePoints } from './core/nodeShapes';
export type { StyleDefault, StyleKeyDefinition, StyleTargetKind, StyleValueDataType } from './core/styleDefaults';
export type {
  NodeBadgePosition,
  NodeBorderStyle,
  NodeIconFit,
  NodeLayoutCardStyle,
  NodeLabelPosition,
  NodeLabelTextOverflow,
  NodeLabelTextWrap,
  NodeStatusPlacement
} from './core/nodeStyle';
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
export type {
  NormalizedViewportThresholds,
  ViewportExpansionInput,
  ViewportExpansionReason,
  ViewportExpansionResult,
  ViewportThresholdPolicy,
  ViewportThresholdTransition
} from './core/attention';
export type { AttentionRuntimeState } from './core/attention/cache';
export type {
  ClosLayoutDirection,
  ClosInferLabelRole,
  ClosLayoutOptions,
  CompiledEdge,
  CompiledEdgeData,
  CompiledGraph,
  CompiledNode,
  CompiledNodeData,
  DiagramCallout,
  DiagramConnector,
  DiagramDefinition,
  DiagramPin,
  DiagramShape,
  DiagramText,
  GraphDefinition,
  GraphLink,
  GraphNode,
  GraphPath,
  GraphRegion,
  IconSpec,
  LayerDefinition,
  LayoutConfig,
  LayoutMode,
  StyleDeclaration,
  StyleRule,
  StylesheetDocument,
  ToggleDefinition,
  TopoDocument,
  TopologyDocument,
  TreeLayoutDirection,
  TreeLayoutOptions,
  TopoViewerExtension,
  TopoViewerExtensionContext,
  TopoViewerConnectionCreate,
  TopoViewerHelperLinesOptions,
  TopoViewerLinkAggregateToggle,
  TopoViewerNodePositionChange,
  TopoViewerObjectClick,
  TopoViewerObjectDoubleClick,
  TopoViewerPaneClick,
  TopoViewerToolbarAction,
  TopoViewerViewport,
  TopoViewerViewportControlsOptions,
  TopoViewerGridOptions,
  TopoCompileResult,
  TopoRenderState,
  TopoViewerDiagnostic,
  TopoViewerDiagnosticCode,
  TopoViewerProps,
  TopoViewerToggles
} from './core/types';
export type { TopoStatusLegendEntry, TopoStatusSeverity } from './core/status';
export type { TopoViewerColorMode, TopoViewerThemeStyle, TopoViewerThemeTokens } from './core/theme';
