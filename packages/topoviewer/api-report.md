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
| `buildTopoStatusLegend` | `./core/status` |
| `BUILT_IN_LAYOUT_PROVIDERS` | `./core/layout` |
| `canonicalStyleKeyByLowercase` | `./core/styleDefaults` |
| `classifyTopoRenderState` | `./core/renderContract` |
| `compileTopoGraph` | `./core/compiler` |
| `compileTopoGraphResult` | `./core/renderContract` |
| `composeTopoViewerDocument` | `./core/compose` |
| `computeClosLayoutPositions` | `./core/closLayout` |
| `computeLayoutPositions` | `./core/layout` |
| `computeTreeLayoutPositions` | `./core/treeLayout` |
| `CURRENT_SCHEMA_VERSION` | `./core/migration` |
| `DEFAULT_NODE_SHAPE` | `./core/styleDefaults` |
| `DEFAULT_RENDERER_LIMITS` | `./core/limits` |
| `defaultTopoViewerToggles` | `./core/toggles` |
| `deriveAggregateGraph` | `./core/attention` |
| `deriveAttentionPresentation` | `./core/attention` |
| `displayName` | `./core/style` |
| `downloadTopoViewerPdf` | `./core/exportCompatibility` |
| `downloadTopoViewerPng` | `./core/exportCompatibility` |
| `downloadTopoViewerSvg` | `./core/exportCompatibility` |
| `effectiveRendererLimits` | `./core/limits` |
| `explainAttentionScore` | `./core/attention` |
| `FocusQueryError` | `./core/attention` |
| `isColorStyleKey` | `./core/styleDefaults` |
| `isCommonLabelStyleKey` | `./core/styleDefaults` |
| `lintTopoDocument` | `./core/lint` |
| `migrateTopoBundle` | `./core/migration` |
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
| `normalizeTopoStatus` | `./core/status` |
| `normalizeViewportThresholds` | `./core/attention` |
| `parseNodeShapePoints` | `./core/nodeShapes` |
| `rebuildRegionNodes` | `./core/compiler` |
| `reduceViewportExpansion` | `./core/attention` |
| `rendererLimitUsage` | `./core/limits` |
| `rendererLimitViolations` | `./core/limits` |
| `resolveAttentionPresentationCached` | `./core/attention/cache` |
| `resolveFocusQuery` | `./core/attention` |
| `resolveTopoStatus` | `./core/status` |
| `resolveViewportThresholdTransition` | `./core/attention` |
| `safeMarkdownToHtml` | `./core/style` |
| `scoreAttention` | `./core/attention` |
| `styleDefaultDefinition` | `./core/styleDefaults` |
| `styleDefaultNumber` | `./core/styleDefaults` |
| `styleDefaultSummary` | `./core/styleDefaults` |
| `styleDefaultValue` | `./core/styleDefaults` |
| `styleDefinitionForKey` | `./core/styleDefaults` |
| `styleDefinitions` | `./core/styleDefaults` |
| `styleDefinitionsByKind` | `./core/styleDefaults` |
| `styleValueDefinitionForKey` | `./core/styleDefaults` |
| `TopoBundleMigrationInput` | `./core/migration` |
| `TopoBundleMigrationResult` | `./core/migration` |
| `topoDiagnosticFromError` | `./core/renderContract` |
| `topoStatusRank` | `./core/status` |
| `TopoViewer` | `./components/TopoViewer` |
| `TOPOVIEWER_DARK_THEME` | `./core/theme` |
| `TOPOVIEWER_GUIDED_AUTHORING_INTERACTIONS` | `./core/interactionPresets` |
| `TOPOVIEWER_LIGHT_THEME` | `./core/theme` |
| `TOPOVIEWER_RAPID_AUTHORING_INTERACTIONS` | `./core/interactionPresets` |
| `TOPOVIEWER_RUNTIME_INTERACTIONS` | `./core/interactionPresets` |
| `topoViewerThemeClassName` | `./core/theme` |
| `topoViewerThemeStyle` | `./core/theme` |
| `topoviewerToPdf` | `./core/exportCompatibility` |
| `topoviewerToPng` | `./core/exportCompatibility` |
| `topoviewerToSvg` | `./core/exportCompatibility` |
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
| `DiagramText` | `./core/types` |
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
| `LayoutMode` | `./core/types` |
| `LayoutPosition` | `./core/layout` |
| `LayoutPositions` | `./core/layout` |
| `LayoutProvider` | `./core/layout` |
| `LayoutProviderInput` | `./core/layout` |
| `LayoutProviderRegistry` | `./core/layout` |
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
| `NormalizedViewportThresholds` | `./core/attention` |
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
| `TopoCompileResult` | `./core/types` |
| `TopoDocument` | `./core/types` |
| `TopologyDocument` | `./core/types` |
| `TopoRenderState` | `./core/types` |
| `TopoStatusLegendEntry` | `./core/status` |
| `TopoStatusSeverity` | `./core/status` |
| `TopoViewerColorMode` | `./core/theme` |
| `TopoViewerConnectionCreate` | `./core/types` |
| `TopoViewerDiagnostic` | `./core/types` |
| `TopoViewerDiagnosticCode` | `./core/types` |
| `TopoViewerExtension` | `./core/types` |
| `TopoViewerExtensionContext` | `./core/types` |
| `TopoViewerGridOptions` | `./core/types` |
| `TopoViewerHelperLinesOptions` | `./core/types` |
| `TopoViewerInteractionPreset` | `./core/interactionPresets` |
| `TopoViewerLinkAggregateToggle` | `./core/types` |
| `TopoViewerNodePositionChange` | `./core/types` |
| `TopoViewerObjectClick` | `./core/types` |
| `TopoViewerObjectDoubleClick` | `./core/types` |
| `TopoViewerPaneClick` | `./core/types` |
| `TopoViewerProps` | `./core/types` |
| `TopoViewerThemeStyle` | `./core/theme` |
| `TopoViewerThemeTokens` | `./core/theme` |
| `TopoViewerToggles` | `./core/types` |
| `TopoViewerToolbarAction` | `./core/types` |
| `TopoViewerViewport` | `./core/types` |
| `TopoViewerViewportControlsOptions` | `./core/types` |
| `TreeLayoutDirection` | `./core/types` |
| `TreeLayoutOptions` | `./core/types` |
| `ViewportExpansionInput` | `./core/attention` |
| `ViewportExpansionReason` | `./core/attention` |
| `ViewportExpansionResult` | `./core/attention` |
| `ViewportThresholdPolicy` | `./core/attention` |
| `ViewportThresholdTransition` | `./core/attention` |


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


## Authoring Entry (`topoviewer/authoring`)

Generated from `packages/topoviewer/src/authoring.ts`.

### Value Exports

| Export | Source |
|---|---|
| `authoringFieldDefaultValue` | `./core/authoringMetadata` |
| `authoringFieldIsVisible` | `./core/authoringMetadata` |
| `authoringLayerReferences` | `./core/authoringLayers` |
| `authoringLinkDirectionObjects` | `./core/authoringGraph` |
| `authoringObjectDisplayName` | `./core/authoringGraph` |
| `authoringObjectExists` | `./core/authoringGraph` |
| `authoringObjectSourcePath` | `./core/authoringGraph` |
| `authoringRegionBounds` | `./core/authoringRegions` |
| `authoringRegionDepth` | `./core/authoringRegions` |
| `authoringRegionForNodePosition` | `./core/authoringRegions` |
| `authoringRegionPlacement` | `./core/authoringRegions` |
| `authoringRegionsForMember` | `./core/authoringRegions` |
| `authoringSelectionKey` | `./core/authoringGraph` |
| `coerceAuthoringFieldValue` | `./core/authoringMetadata` |
| `copyAuthoringSelection` | `./core/authoringGraph` |
| `createAuthoringCallout` | `./core/authoringGraph` |
| `createAuthoringLayer` | `./core/authoringLayers` |
| `createAuthoringLink` | `./core/authoringGraph` |
| `createAuthoringNode` | `./core/authoringGraph` |
| `createAuthoringPath` | `./core/authoringGraph` |
| `createAuthoringRegion` | `./core/authoringGraph` |
| `createAuthoringShape` | `./core/authoringGraph` |
| `createAuthoringText` | `./core/authoringGraph` |
| `createBasicMapperRule` | `./core/mapperAuthoring` |
| `DEFAULT_AUTHORING_CALLOUT_SIZE` | `./core/authoringGraph` |
| `DEFAULT_AUTHORING_REGION_SIZE` | `./core/authoringGraph` |
| `DEFAULT_AUTHORING_SHAPE_SIZE` | `./core/authoringGraph` |
| `defaultLayerId` | `./core/authoringGraph` |
| `discoverMapperMetrics` | `./core/mapperInference` |
| `evaluateMapperCoverage` | `./core/mapperCoverage` |
| `findAuthoringObject` | `./core/authoringGraph` |
| `findAuthoringPathTraversals` | `./core/authoringGraph` |
| `graphHasLinkBetween` | `./core/authoringGraph` |
| `graphHasReachabilityBetween` | `./core/authoringGraph` |
| `indexCanonicalIdentityBundle` | `./core/identity` |
| `ingestMapperSamples` | `./core/mapperSamples` |
| `mapperAuthoringCapabilities` | `./core/mapperAuthoringMetadata` |
| `mapperAuthoringField` | `./core/mapperAuthoringMetadata` |
| `mapperAuthoringMetadata` | `./core/mapperAuthoringMetadata` |
| `mapperAuthoringTargetKinds` | `./core/mapperAuthoring` |
| `mapperAuthoringValueSemantics` | `./core/mapperAuthoring` |
| `mapperRuleFromProposal` | `./core/mapperInference` |
| `mapperRuleTargetKind` | `./core/mapperAuthoring` |
| `nextAuthoringObjectId` | `./core/authoringGraph` |
| `pasteAuthoringClipboard` | `./core/authoringGraph` |
| `pathSegmentsWithoutDirectLinks` | `./core/authoringGraph` |
| `pathSegmentsWithoutReachability` | `./core/authoringGraph` |
| `planAuthoringAlignment` | `./core/authoringGraph` |
| `planAuthoringBundleDeletion` | `./core/authoringDeletion` |
| `planAuthoringCalloutAttachment` | `./core/authoringGraph` |
| `planAuthoringDeletion` | `./core/authoringGraph` |
| `planAuthoringDistribution` | `./core/authoringGraph` |
| `planAuthoringLayerDeletion` | `./core/authoringLayers` |
| `planAuthoringLayerMembership` | `./core/authoringLayers` |
| `planAuthoringLayerRename` | `./core/authoringLayers` |
| `planAuthoringLayerReorder` | `./core/authoringLayers` |
| `planAuthoringNodeMove` | `./core/authoringRegions` |
| `planAuthoringPositionDelta` | `./core/authoringGraph` |
| `planAuthoringRegionExpanded` | `./core/authoringRegions` |
| `planAuthoringRegionMove` | `./core/authoringRegions` |
| `planAuthoringReleaseFromRegion` | `./core/authoringRegions` |
| `planAuthoringResize` | `./core/authoringGraph` |
| `planAuthoringStylesheetDeletionCleanup` | `./core/authoringDeletion` |
| `planCanonicalObjectIdRename` | `./core/identity` |
| `proposeMapperRule` | `./core/mapperInference` |
| `resolveAuthoringCalloutSize` | `./core/authoringGraph` |
| `resolveAuthoringRegionSize` | `./core/authoringGraph` |
| `resolveAuthoringSelection` | `./core/authoringGraph` |
| `resolveAuthoringShapeSize` | `./core/authoringGraph` |
| `resolveStyleProvenance` | `./core/styleProvenance` |
| `sameAuthoringSelection` | `./core/authoringGraph` |
| `searchMapperAuthoringMetadata` | `./core/mapperAuthoringMetadata` |
| `searchStyleAuthoringMetadata` | `./core/styleAuthoringMetadata` |
| `styleAuthoringFieldForKey` | `./core/styleAuthoringMetadata` |
| `styleAuthoringMetadata` | `./core/styleAuthoringMetadata` |
| `styleAuthoringMetadataByTarget` | `./core/styleAuthoringMetadata` |
| `styleExactIdSelector` | `./core/styleAuthoringSelectors` |
| `styleRuleAffectedObjects` | `./core/styleProvenance` |
| `styleRulesForTarget` | `./core/styleAuthoringSelectors` |
| `styleSelectorIsValid` | `./core/styleAuthoringSelectors` |
| `styleSelectorSuggestions` | `./core/styleAuthoringSelectors` |
| `styleSelectorTarget` | `./core/styleAuthoringSelectors` |
| `validateAuthoringMetadata` | `./core/authoringMetadataValidation` |


### Type Exports

| Export | Source |
|---|---|
| `AuthoringAlignment` | `./core/authoringGraph` |
| `AuthoringBundleDeletionPlan` | `./core/authoringDeletion` |
| `AuthoringClipboardItem` | `./core/authoringGraph` |
| `AuthoringCondition` | `./core/authoringMetadata` |
| `AuthoringControlHint` | `./core/authoringMetadata` |
| `AuthoringControlKind` | `./core/authoringMetadata` |
| `AuthoringDistributionAxis` | `./core/authoringGraph` |
| `AuthoringEditPlan` | `./core/authoringGraph` |
| `AuthoringFieldLevel` | `./core/authoringMetadata` |
| `AuthoringFieldMetadata` | `./core/authoringMetadata` |
| `AuthoringGraphObject` | `./core/authoringGraph` |
| `AuthoringInputResult` | `./core/authoringMetadata` |
| `AuthoringInsertion` | `./core/authoringGraph` |
| `AuthoringLinkDirectionObject` | `./core/authoringGraph` |
| `AuthoringMetadataIssue` | `./core/authoringMetadataValidation` |
| `AuthoringNestedFieldMetadata` | `./core/authoringMetadata` |
| `AuthoringNodeKind` | `./core/authoringGraph` |
| `AuthoringObjectKind` | `./core/authoringGraph` |
| `AuthoringObjectSelection` | `./core/authoringGraph` |
| `AuthoringRegionBounds` | `./core/authoringRegions` |
| `AuthoringRegionPlacementOptions` | `./core/authoringRegions` |
| `AuthoringRemoval` | `./core/authoringGraph` |
| `AuthoringSourcePath` | `./core/authoringGraph` |
| `AuthoringValueUpdate` | `./core/authoringGraph` |
| `BasicMapperRule` | `./core/mapperAuthoring` |
| `CanonicalIdentityBundle` | `./core/identity` |
| `CanonicalIdentityDefinition` | `./core/identity` |
| `CanonicalIdentityDocument` | `./core/identity` |
| `CanonicalIdentityIndex` | `./core/identity` |
| `CanonicalIdentityMutation` | `./core/identity` |
| `CanonicalIdentityReference` | `./core/identity` |
| `CanonicalIdentityRenamePlan` | `./core/identity` |
| `CanonicalIdentityRisk` | `./core/identity` |
| `CreateAuthoringLinkOptions` | `./core/authoringGraph` |
| `CreateAuthoringNodeOptions` | `./core/authoringGraph` |
| `CreateAuthoringPathOptions` | `./core/authoringGraph` |
| `CreateAuthoringPositionedObjectOptions` | `./core/authoringGraph` |
| `CreateAuthoringRegionOptions` | `./core/authoringGraph` |
| `CreateBasicMapperRuleOptions` | `./core/mapperAuthoring` |
| `FindAuthoringPathTraversalsOptions` | `./core/authoringGraph` |
| `MapperAuthoringCapability` | `./core/authoringMetadata` |
| `MapperAuthoringCapabilityId` | `./core/authoringMetadata` |
| `MapperAuthoringFieldMetadata` | `./core/authoringMetadata` |
| `MapperAuthoringSample` | `./core/mapperSamples` |
| `MapperAuthoringTargetKind` | `./core/mapperAuthoring` |
| `MapperAuthoringValueSemantic` | `./core/mapperAuthoring` |
| `MapperCoverageItem` | `./core/mapperCoverage` |
| `MapperCoverageResult` | `./core/mapperCoverage` |
| `MapperCoverageStatus` | `./core/mapperCoverage` |
| `MapperJoinCandidate` | `./core/mapperInference` |
| `MapperMetricDiscovery` | `./core/mapperInference` |
| `MapperRuleProposal` | `./core/mapperInference` |
| `MapperSampleDiagnostic` | `./core/mapperSamples` |
| `MapperSampleIngestionOptions` | `./core/mapperSamples` |
| `MapperSampleIngestionResult` | `./core/mapperSamples` |
| `ProposedMapperRule` | `./core/mapperInference` |
| `ResolveStyleProvenanceOptions` | `./core/styleProvenance` |
| `StyleAuthoringRule` | `./core/styleAuthoringSelectors` |
| `StyleFieldProvenance` | `./core/styleProvenance` |
| `StyleProvenanceContributor` | `./core/styleProvenance` |
| `StyleProvenanceDocument` | `./core/styleProvenance` |
| `StyleProvenanceSourceKind` | `./core/styleProvenance` |
| `StyleRuleAffectedObject` | `./core/styleProvenance` |
| `StyleSelectorSuggestion` | `./core/styleAuthoringSelectors` |
| `TopoViewerNodeResizeChange` | `./core/types` |
| `TopoViewerObjectContextMenu` | `./core/types` |
| `TopoViewerSelectionChange` | `./core/types` |
| `TopoViewerSelectionContextMenu` | `./core/types` |


## Export Entry (`topoviewer/export`)

Generated from `packages/topoviewer/src/export.ts`.

### Value Exports

| Export | Source |
|---|---|
| `downloadTopoViewerPdf` | `./core/export` |
| `downloadTopoViewerPng` | `./core/export` |
| `downloadTopoViewerSvg` | `./core/export` |
| `topoviewerToPdf` | `./core/export` |
| `topoviewerToPng` | `./core/export` |
| `topoviewerToSvg` | `./core/export` |


### Type Exports

| Export | Source |
|---|---|
| `StaticExportOptions` | `./core/export` |
| `StaticPdfExportOptions` | `./core/export` |


## Security Entry (`topoviewer/security`)

Generated from `packages/topoviewer/src/security.ts`.

### Value Exports

| Export | Source |
|---|---|
| `isSafeImageReference` | `./core/security` |
| `materializeSvgColorTokens` | `./core/security` |
| `sanitizeSvg` | `./core/security` |


### Type Exports

_None._

