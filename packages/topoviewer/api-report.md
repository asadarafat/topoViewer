# TopoViewer Public API Report

Run `npm run api:report` after intentionally adding, removing, renaming, or
moving a public package export. The report is a public-surface tripwire; it is
not a replacement for migration notes, API docs, or compatibility tests.

## Root Entry (`topoviewer`)

Generated from `packages/topoviewer/src/index.ts`.

### Value Exports

| Export | Source |
|---|---|
| `analyzeClosLayoutDiagnostics` | `./core/closLayout` |
| `applyStyle` | `./core/style` |
| `assertRendererLimits` | `./core/limits` |
| `attentionSourceKey` | `./core/attention/cache` |
| `attentionStateKey` | `./core/attention/cache` |
| `buildAttentionIndex` | `./core/attention` |
| `buildAttentionIndexCached` | `./core/attention/cache` |
| `canonicalStyleKeyByLowercase` | `./core/styleDefaults` |
| `compileTopoGraph` | `./core/compiler` |
| `composeTopoViewerDocument` | `./core/compose` |
| `computeClosLayoutPositions` | `./core/closLayout` |
| `computeLayoutPositions` | `./core/layout` |
| `CURRENT_SCHEMA_VERSION` | `./core/migration` |
| `DEFAULT_NODE_SHAPE` | `./core/styleDefaults` |
| `DEFAULT_RENDERER_LIMITS` | `./core/limits` |
| `defaultTopoViewerToggles` | `./core/toggles` |
| `deriveAggregateGraph` | `./core/attention` |
| `deriveAttentionPresentation` | `./core/attention` |
| `downloadTopoViewerPdf` | `./core/export` |
| `downloadTopoViewerPng` | `./core/export` |
| `downloadTopoViewerSvg` | `./core/export` |
| `effectiveRendererLimits` | `./core/limits` |
| `explainAttentionScore` | `./core/attention` |
| `FocusQueryError` | `./core/attention` |
| `isColorStyleKey` | `./core/styleDefaults` |
| `isCommonLabelStyleKey` | `./core/styleDefaults` |
| `lintTopoDocument` | `./core/lint` |
| `migrateTopoDocument` | `./core/migration` |
| `migrateTopoToggles` | `./core/migration` |
| `NODE_SHAPES` | `./core/nodeShapes` |
| `nodeBadgePositions` | `./core/nodeStyle` |
| `nodeBorderStyles` | `./core/nodeStyle` |
| `nodeIconFitValues` | `./core/nodeStyle` |
| `nodeLabelPositions` | `./core/nodeStyle` |
| `nodeLabelTextOverflowValues` | `./core/nodeStyle` |
| `nodeLabelTextWrapValues` | `./core/nodeStyle` |
| `nodeStatusPlacements` | `./core/nodeStyle` |
| `normalizeNodeShape` | `./core/nodeShapes` |
| `parseNodeShapePoints` | `./core/nodeShapes` |
| `rebuildRegionNodes` | `./core/compiler` |
| `rendererLimitUsage` | `./core/limits` |
| `rendererLimitViolations` | `./core/limits` |
| `resolveAttentionPresentationCached` | `./core/attention/cache` |
| `resolveFocusQuery` | `./core/attention` |
| `scoreAttention` | `./core/attention` |
| `styleDefaultDefinition` | `./core/styleDefaults` |
| `styleDefaultNumber` | `./core/styleDefaults` |
| `styleDefaultSummary` | `./core/styleDefaults` |
| `styleDefaultValue` | `./core/styleDefaults` |
| `styleDefinitionForKey` | `./core/styleDefaults` |
| `styleDefinitions` | `./core/styleDefaults` |
| `styleDefinitionsByKind` | `./core/styleDefaults` |
| `styleValueDefinitionForKey` | `./core/styleDefaults` |
| `TopoViewer` | `./components/TopoViewer` |
| `topoviewerToPdf` | `./core/export` |
| `topoviewerToPng` | `./core/export` |
| `topoviewerToSvg` | `./core/export` |
| `validateTopoDocument` | `./core/validation` |


### Type Exports

| Export | Source |
|---|---|
| `AggregateGraphResult` | `./core/attention` |
| `AggregateGroupDefinition` | `./core/attention` |
| `AggregateGroupKind` | `./core/attention` |
| `AggregateGroupSummary` | `./core/attention` |
| `AttentionGraphIndex` | `./core/attention` |
| `AttentionGraphInput` | `./core/attention` |
| `AttentionIndexedObject` | `./core/attention` |
| `AttentionLabelPriority` | `./core/attention` |
| `AttentionObjectByKind` | `./core/attention` |
| `AttentionObjectKind` | `./core/attention` |
| `AttentionPresentation` | `./core/attention` |
| `AttentionPresentationResult` | `./core/attention` |
| `AttentionPresentationState` | `./core/attention` |
| `AttentionRuntimeState` | `./core/attention/cache` |
| `AttentionScore` | `./core/attention` |
| `AttentionScoreResult` | `./core/attention` |
| `AttentionScoringOptions` | `./core/attention` |
| `AttentionViewportPolicy` | `./core/attention` |
| `ClosInferLabelRole` | `./core/types` |
| `ClosLayoutDiagnostic` | `./core/closLayout` |
| `ClosLayoutDirection` | `./core/types` |
| `ClosLayoutOptions` | `./core/types` |
| `CompiledEdge` | `./core/types` |
| `CompiledEdgeData` | `./core/types` |
| `CompiledGraph` | `./core/types` |
| `CompiledNode` | `./core/types` |
| `CompiledNodeData` | `./core/types` |
| `ComposeTopoViewerDocumentOptions` | `./core/compose` |
| `DeriveAggregateGraphOptions` | `./core/attention` |
| `DiagramCallout` | `./core/types` |
| `DiagramConnector` | `./core/types` |
| `DiagramDefinition` | `./core/types` |
| `DiagramPin` | `./core/types` |
| `DiagramShape` | `./core/types` |
| `FocusChangeQuery` | `./core/attention` |
| `FocusDependencyDirection` | `./core/attention` |
| `FocusDependencyQuery` | `./core/attention` |
| `FocusPresentationMode` | `./core/attention` |
| `FocusQuery` | `./core/attention` |
| `FocusQueryErrorCode` | `./core/attention` |
| `FocusResult` | `./core/attention` |
| `GraphDefinition` | `./core/types` |
| `GraphLink` | `./core/types` |
| `GraphNode` | `./core/types` |
| `GraphPath` | `./core/types` |
| `GraphRegion` | `./core/types` |
| `IconSpec` | `./core/types` |
| `LabelAggregateGroupDefinition` | `./core/attention` |
| `LayerDefinition` | `./core/types` |
| `LayoutConfig` | `./core/types` |
| `LinkAggregateGroupSummary` | `./core/attention` |
| `LinkGroupingKey` | `./core/attention` |
| `LinkGroupingOptions` | `./core/attention` |
| `LinkGroupingViewportPolicy` | `./core/attention` |
| `LintIssue` | `./core/lint` |
| `LintOptions` | `./core/lint` |
| `NodeBadgePosition` | `./core/nodeStyle` |
| `NodeBorderStyle` | `./core/nodeStyle` |
| `NodeIconFit` | `./core/nodeStyle` |
| `NodeLabelPosition` | `./core/nodeStyle` |
| `NodeLabelTextOverflow` | `./core/nodeStyle` |
| `NodeLabelTextWrap` | `./core/nodeStyle` |
| `NodeLayoutCardStyle` | `./core/nodeStyle` |
| `NodeShapeName` | `./core/nodeShapes` |
| `NodeShapePoint` | `./core/nodeShapes` |
| `NodeStatusPlacement` | `./core/nodeStyle` |
| `ParentAggregateGroupDefinition` | `./core/attention` |
| `ParsedNodeShapePoints` | `./core/nodeShapes` |
| `RegionAggregateGroupDefinition` | `./core/attention` |
| `StaticExportOptions` | `./core/export` |
| `StaticPdfExportOptions` | `./core/export` |
| `StyleDeclaration` | `./core/types` |
| `StyleDefault` | `./core/styleDefaults` |
| `StyleKeyDefinition` | `./core/styleDefaults` |
| `StyleRule` | `./core/types` |
| `StylesheetDocument` | `./core/types` |
| `StyleTargetKind` | `./core/styleDefaults` |
| `StyleValueDataType` | `./core/styleDefaults` |
| `ToggleDefinition` | `./core/types` |
| `TopoDocument` | `./core/types` |
| `TopologyDocument` | `./core/types` |
| `TopoViewerConnectionCreate` | `./core/types` |
| `TopoViewerExtension` | `./core/types` |
| `TopoViewerExtensionContext` | `./core/types` |
| `TopoViewerHelperLinesOptions` | `./core/types` |
| `TopoViewerNodePositionChange` | `./core/types` |
| `TopoViewerObjectClick` | `./core/types` |
| `TopoViewerPaneClick` | `./core/types` |
| `TopoViewerProps` | `./core/types` |
| `TopoViewerToggles` | `./core/types` |
| `TopoViewerToolbarAction` | `./core/types` |
| `TopoViewerViewport` | `./core/types` |


## Integration Entry (`topoviewer/integration`)

Generated from `packages/topoviewer/src/integration.ts`.

### Value Exports

| Export | Source |
|---|---|
| `authoringHelperLinesOptions` | `./components/helperLines` |
| `layerIds` | `./core/layers` |
| `reconcileSelectedLayerIds` | `./core/layers` |
| `toggleSelectedLayerId` | `./core/layers` |
| `ViewportSettingsPanel` | `./components/ViewportSettingsPanel` |


### Type Exports

| Export | Source |
|---|---|
| `ViewportSettingsPanelProps` | `./components/ViewportSettingsPanel` |

