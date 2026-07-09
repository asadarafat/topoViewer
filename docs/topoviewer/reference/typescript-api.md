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

## Minimal Supported API

The public API that new consumers should start from is deliberately small:

| Need | API |
|---|---|
| Render a composed document | `<TopoViewer document={document} />` |
| Compile a document for inspection or extension hooks | `compileTopoGraph(document)` |
| Validate schema-level document shape | `validateTopoDocument(document)` |
| Validate semantic graph references and renderer limits | `lintTopoDocument(document)` |

Everything else is supporting model/types, advanced compiler/layout control,
export helpers, or experimental integration surface. Pre-1.0 releases may still
refine advanced and experimental contracts, but this minimal API is the
adoption target.

## Renderer

| Export | Stability | Use |
|---|---|---|
| `TopoViewer` | Supported | React component for rendering compiled TopoViewer documents. |
| `TopoViewerProps` | Supported | Props accepted by the React component. |
| `TopoViewerViewport` | Supported | Viewport state passed through events. |
| `TopoViewerObjectClick` | Supported | Object click event payload. |
| `TopoViewerPaneClick` | Supported | Pane/background click event payload. |
| `TopoViewerNodePositionChange` | Supported | Node drag/persist event payload. |
| `TopoViewerConnectionCreate` | Experimental | Canvas connection-create event payload for authoring surfaces. |
| `TopoViewerHelperLinesOptions` | Experimental | Runtime-only drag alignment guides and optional snapping for authoring surfaces. |
| `TopoViewerToggles` | Supported | Layer and viewport toggle state. |

`helperLines` is a React runtime option on `TopoViewerProps`, not topology or
stylesheet YAML. Use it when the host surface lets users drag objects and should
show alignment guides:

```tsx
<TopoViewer
  document={document}
  nodesDraggable
  helperLines={{
    enabled: true,
    snap: true,
    snapMode: 'commit',
    snapHysteresis: 3,
    threshold: 5,
    showMidpoints: true
  }}
/>
```

By default helper lines snap on drag stop with `snapMode: 'commit'`: the node
follows the pointer during drag, then `onNodePositionChange` receives the
aligned position. Set `snap: false` for guide-only overlays. The live snap mode
remains available for hosts that want the dragged object to move directly to
each guide candidate during drag.

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
`CompiledGraph`, `CompiledNode`, `CompiledEdge`, `CompiledNodeData`,
`CompiledEdgeData`, `TopoViewerExtension`, `TopoViewerExtensionContext`, and
`TopoViewerConnectionCreate`, `TopoViewerHelperLinesOptions`, and
`TopoViewerNodePositionChange`, `TopoViewerObjectClick`, `TopoViewerPaneClick`,
`TopoViewerToolbarAction`, and `TopoViewerViewport`.

Attention types include `FocusQuery`, `FocusResult`,
`FocusPresentationMode`, `AttentionPresentationResult`,
`AttentionScoreResult`, `AggregateGraphResult`, and related aggregate/group
types.

Style types include `StyleKeyDefinition`, `StyleTargetKind`,
`StyleValueDataType`, `StyleDefault`, `NodeShapeName`, `NodeIconFit`,
`NodeLayoutCardStyle`, `NodeLabelPosition`, `NodeBadgePosition`, and
`NodeStatusPlacement`.
