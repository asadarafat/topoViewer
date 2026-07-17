export { TopoViewer } from './components/TopoViewer';
export { compileTopoGraph, rebuildRegionNodes } from './core/compiler';
export { analyzeClosLayoutDiagnostics, computeClosLayoutPositions } from './core/closLayout';
export { computeLayoutPositions } from './core/layout';
export { applyStyle, markdownToHtml as safeMarkdownToHtml } from './core/style';
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
  StyleDeclaration,
  StyleRule,
  StylesheetDocument,
  ToggleDefinition,
  TopoDocument,
  TopologyDocument,
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
  TopoViewerProps,
  TopoViewerToggles
} from './core/types';
