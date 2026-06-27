# TypeScript API

The TypeScript package exposes the renderer, compiler, validation, style
metadata, layout helpers, attention engine, export helpers, and public model
types.

## Stability Labels

| Label | Meaning |
|---|---|
| Supported | Intended for application code. Breaking changes require migration notes. |
| Advanced | Public but lower-level. Prefer wrappers unless you need exact control. |
| Experimental | Useful today, but the contract may change while the feature matures. |

## Renderer

| Export | Stability | Use |
|---|---|---|
| `TopoViewer` | Supported | React component for rendering compiled TopoViewer documents. |
| `TopoViewerProps` | Supported | Props accepted by the React component. |
| `TopoViewerViewport` | Supported | Viewport state passed through events. |
| `TopoViewerObjectClick` | Supported | Object click event payload. |
| `TopoViewerNodePositionChange` | Supported | Node drag/persist event payload. |
| `TopoViewerToggles` | Supported | Layer and viewport toggle state. |

## Compile, Compose, Validate

| Export | Stability | Use |
|---|---|---|
| `composeTopoViewerDocument` | Supported | Merge topology and stylesheet YAML into one document. |
| `compileTopoGraph` | Supported | Compile a TopoViewer document into renderable graph state. |
| `applyStyle` | Advanced | Apply stylesheet rules to one object in compiler-style workflows. |
| `validateTopoDocument` | Supported | Validate schema-level document correctness. |
| `lintTopoDocument` | Supported | Run semantic diagnostics. |
| `migrateTopoDocument` | Supported | Migrate older document shapes. |
| `migrateTopoToggles` | Supported | Migrate persisted toggle state. |
| `CURRENT_SCHEMA_VERSION` | Supported | Current schema version marker. |

## Layout

| Export | Stability | Use |
|---|---|---|
| `computeLayoutPositions` | Supported | Calculate positions for configured layout modes. |
| `computeClosLayoutPositions` | Supported | Calculate generic CLOS positions. |
| `analyzeClosLayoutDiagnostics` | Supported | Inspect CLOS inference quality and conflicts. |
| `rebuildRegionNodes` | Advanced | Rebuild region hulls after graph changes. |
| `ClosLayoutDirection` | Supported | Direction type for generic CLOS layout. |
| `ClosInferLabelRole` | Supported | Explicit CLOS role override mapping type. |

## Style Metadata

| Export | Stability | Use |
|---|---|---|
| `DEFAULT_NODE_SHAPE` | Supported | Canonical default node shape. |
| `styleDefinitions` | Supported | Complete style key registry. |
| `styleDefinitionsByKind` | Supported | Style keys grouped by target kind. |
| `styleDefinitionForKey` | Supported | Lookup one style key definition. |
| `styleDefaultDefinition` | Supported | Lookup default metadata for a style key. |
| `styleDefaultValue` | Supported | Resolve a style key default value. |
| `styleDefaultNumber` | Supported | Resolve numeric defaults. |
| `styleDefaultSummary` | Supported | Render human-readable default text. |
| `styleValueDefinitionForKey` | Supported | Lookup typed value metadata. |
| `canonicalStyleKeyByLowercase` | Supported | Map lowercase authoring input to canonical camelCase. |
| `isColorStyleKey` | Supported | Detect color-valued style keys. |
| `isCommonLabelStyleKey` | Supported | Detect label style keys shared across target kinds. |
| `NODE_SHAPES` | Supported | Accepted node body shapes. |
| `normalizeNodeShape` | Supported | Normalize authored node shape values. |
| `parseNodeShapePoints` | Supported | Parse custom polygon points. |
| `nodeBadgePositions` | Supported | Accepted badge placement values. |
| `nodeBorderStyles` | Supported | Accepted node border style values. |
| `nodeIconFitValues` | Supported | Accepted icon fit values. |
| `nodeLabelPositions` | Supported | Accepted node label positions. |
| `nodeLabelTextOverflowValues` | Supported | Accepted node label overflow values. |
| `nodeLabelTextWrapValues` | Supported | Accepted node label wrap values. |
| `nodeStatusPlacements` | Supported | Accepted node status marker placements. |

## Attention

| Export | Stability | Use |
|---|---|---|
| `buildAttentionIndex` | Supported | Index graph objects for focus and scoring. |
| `AttentionGraphIndex` | Supported | Indexed graph data returned by `buildAttentionIndex`. |
| `deriveAttentionPresentation` | Supported | Convert focus state into dimming, labels, and aggregation. |
| `deriveAggregateGraph` | Supported | Build aggregate graph presentation. |
| `resolveFocusQuery` | Supported | Resolve object, path, dependency, and change focus queries. |
| `FocusQueryError` | Supported | Error class for invalid focus queries. |
| `scoreAttention` | Supported | Score graph objects for priority. |
| `explainAttentionScore` | Advanced | Explain score components for debugging. |
| `attentionSourceKey` | Advanced | Stable cache key helper for attention input sources. |
| `attentionStateKey` | Advanced | Stable cache key helper for attention runtime state. |
| `buildAttentionIndexCached` | Advanced | Cache attention index creation. |
| `resolveAttentionPresentationCached` | Advanced | Cache attention presentation. |
| `AttentionRuntimeState` | Advanced | Runtime cache state for attention helpers. |

## Export

| Export | Stability | Use |
|---|---|---|
| `topoviewerToPng` | Supported | Produce a PNG data URL or blob-compatible output. |
| `topoviewerToSvg` | Supported | Produce SVG output. |
| `topoviewerToPdf` | Supported | Produce PDF output. |
| `downloadTopoViewerPng` | Supported | Browser download helper for PNG. |
| `downloadTopoViewerSvg` | Supported | Browser download helper for SVG. |
| `downloadTopoViewerPdf` | Supported | Browser download helper for PDF. |

## Limits And Toggles

| Export | Stability | Use |
|---|---|---|
| `DEFAULT_RENDERER_LIMITS` | Supported | Default renderer budget. |
| `effectiveRendererLimits` | Supported | Merge user limits with defaults. |
| `rendererLimitUsage` | Supported | Calculate current graph usage. |
| `rendererLimitViolations` | Supported | Detect exceeded budgets. |
| `assertRendererLimits` | Supported | Throw or report when budgets are exceeded. |
| `defaultTopoViewerToggles` | Supported | Default layer/control toggle state. |

## Public Types

Model types include `TopoDocument`, `TopologyDocument`, `StylesheetDocument`,
`GraphDefinition`, `GraphNode`, `GraphLink`, `GraphPath`, `GraphRegion`,
`LayerDefinition`, `IconSpec`, `StyleRule`, `StyleDeclaration`,
`LayoutConfig`, `ClosLayoutOptions`, `DiagramDefinition`, `DiagramShape`,
`DiagramCallout`, `DiagramConnector`, `DiagramPin`, `ToggleDefinition`,
`TopoViewerExtension`, and `TopoViewerExtensionContext`.

Attention types include `FocusQuery`, `FocusResult`,
`FocusPresentationMode`, `AttentionPresentationResult`,
`AttentionScoreResult`, `AggregateGraphResult`, and related aggregate/group
types.

Style types include `StyleKeyDefinition`, `StyleTargetKind`,
`StyleValueDataType`, `StyleDefault`, `NodeShapeName`, `NodeIconFit`,
`NodeLabelPosition`, `NodeBadgePosition`, and `NodeStatusPlacement`.
