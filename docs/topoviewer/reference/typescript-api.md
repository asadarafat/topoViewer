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
| Internal | Repository implementation detail. Consumers must not import it. |

## Package Entry Points

Import only documented package entries. A path under `packages/topoviewer/src`
or `topoviewer/dist` is an implementation detail even when a local bundler can
resolve it.

| Entry | Stability | Runtime | Intended use |
|---|---|---|---|
| `topoviewer` | Supported | SSR-import-safe; rendering requires a browser | React renderer, composition, validation, compiler helpers, and public model types. |
| `topoviewer/authoring` | Advanced | Browser or Node, depending on the operation | Transactional topology and stylesheet authoring primitives for editor products. |
| `topoviewer/export` | Supported | Browser only | PNG, SVG, and PDF generation. Import this entry directly so export dependencies remain outside the initial renderer path. |
| `topoviewer/integration` | Experimental | Browser | Shared host controls and authoring interaction defaults. |
| `topoviewer/security` | Advanced | Browser or Node | Sanitization and security helpers for trusted host integrations. |
| `topoviewer/style.css` | Supported asset | Browser | Required renderer and React Flow styles for React hosts. |
| `topoviewer/schemas/*` | Supported data | Browser or Node | Published JSON Schemas for validation and editor tooling. |
| `topoviewer/embed/*` | Supported Adapter asset | Browser only | Static CSS and IIFE assets used by MkDocs and Zensical adapters. |
| Package source or unlisted `dist` paths | Internal | Unspecified | Not a consumer API; filenames and ownership may change without migration support. |

The root entry retains asynchronous export compatibility functions for existing
consumers, but new code should import export helpers from `topoviewer/export`.
Importing the root does not load image/PDF dependencies.

Every typed JavaScript entry publishes explicit ESM (`.mjs`/`.d.mts`) and
CommonJS (`.cjs`/`.d.cts`) conditions. The packed package is exercised from ESM,
CommonJS, SSR, TypeScript, and a minimal Vite consumer. The consumer Node engine
is `>=22.12`; repository development and release tooling remain pinned to Node
24. React 18.3 and 19.2 are covered in the required packed-consumer matrix.

CSS remains an explicit asset contract:

```ts
import { TopoViewer } from 'topoviewer';
import 'topoviewer/style.css';
```

The component does not import CSS as a hidden side effect. This keeps SSR and
consumer bundling behavior explicit.

## Minimal Supported API

The public API that new consumers should start from is deliberately small:

| Need | API |
|---|---|
| Render a composed document | `<TopoViewer document={document} />` |
| Compile a document for inspection or extension hooks | `compileTopoGraph(document)` |
| Compile untrusted input without throwing | `compileTopoGraphResult(input)` |
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
| `TopoViewerObjectDoubleClick` | Supported | Object double-click payload used by host-owned direct editors. |
| `TopoViewerPaneClick` | Supported | Pane/background click event payload. |
| `TopoViewerNodePositionChange` | Supported | Node drag/persist event payload. |
| `TopoViewerConnectionCreate` | Experimental | Canvas connection-create event payload for authoring surfaces. |
| `TopoViewerLinkAggregateToggle` | Experimental | Link-group expand/collapse event payload for host-controlled aggregate interaction. |
| `TopoViewerGridOptions` | Experimental | Configure the renderer grid color, spacing, and dot size. |
| `TopoViewerHelperLinesOptions` | Experimental | Runtime-only drag alignment guides and optional snapping for authoring surfaces. |
| `TopoViewerViewportControlsOptions` | Experimental | Compose host actions into the native viewport controls without adding a second toolbar. |
| `TopoViewerToggles` | Supported | Layer and viewport toggle state. |
| `TopoViewerDiagnostic` | Supported | Structured validation, renderer-limit, compile, and render diagnostics. |
| `TopoRenderState` | Supported | Distinguishes `ready`, `empty`, and `filtered-empty` output. |

The renderer does not throw invalid documents through the host React tree. It
renders an accessible default error state, reports structured diagnostics, and
supports host-owned fallbacks:

```tsx
<TopoViewer
  document={document}
  emptyFallback={(state) => (
    <p>{state === 'filtered-empty' ? 'No objects match this view.' : 'This topology is empty.'}</p>
  )}
  errorFallback={(diagnostics) => <p>{diagnostics[0]?.message}</p>}
  onDiagnostics={(diagnostics) => reportDiagnostics(diagnostics)}
/>
```

The throwing `compileTopoGraph` API remains available for trusted application
code. Use `compileTopoGraphResult` at data boundaries where invalid or oversized
input is expected and must become diagnostics instead of an exception.

`helperLines` is a React runtime option on `TopoViewerProps`, not topology or
stylesheet YAML. Use it when the host surface lets users drag objects and should
show alignment guides:

```tsx
import { ControlButton } from '@xyflow/react';

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

Hosts can also compose viewport presentation without changing topology YAML:

```tsx
<TopoViewer
  document={document}
  fitViewOnInit
  grid={{ color: 'rgba(126, 139, 154, 0.32)', gap: 20, size: 1 }}
  miniMap
/>
```

Set `grid={false}` or `miniMap={false}` to hide those surfaces. These are host
presentation preferences; they do not change graph identity or stylesheet
policy.

By default helper lines snap on drag stop with `snapMode: 'commit'`: the node
follows the pointer during drag, then `onNodePositionChange` receives the
aligned position. Set `snap: false` for guide-only overlays. The live snap mode
remains available for hosts that want the dragged object to move directly to
each guide candidate during drag.

`viewportControls` keeps zoom, fit, and host-owned actions in one React Flow
control stack. Pass `false` to hide the stack, or pass options to position it,
hide native actions, and append `ControlButton` children:

```tsx
<TopoViewer
  document={document}
  viewportControls={{
    position: 'top-left',
    children: <ControlButton aria-label="Layers">...</ControlButton>
  }}
/>
```

Authoring hosts can expose connection points without changing topology YAML:

```tsx
<TopoViewer
  document={document}
  nodesConnectable
  connectionHandleMode="shape-handles"
  isConnectionValid={validateConnection}
  onConnectionCreate={createConnection}
/>
```

`shape-handles` shows four ports for rectangular and circular nodes, six for
hexagons, and up to eight for polygonal shapes. The stable IDs
`shape-port-1` through `shape-port-8` may be stored in `sourceHandle` and
`targetHandle`. A node with an explicit `handles` array uses that declared
catalog instead of the implicit shape ports. Use `handles` for strict,
host-defined endpoint roles, or `full-node` when the whole node should accept a
loose connection.

Use a published interaction preset instead of repeating low-level React Flow
flags across hosts:

```tsx
import {
  TopoViewer,
  TOPOVIEWER_GUIDED_AUTHORING_INTERACTIONS,
  TOPOVIEWER_RUNTIME_INTERACTIONS
} from 'topoviewer';

<TopoViewer document={document} {...TOPOVIEWER_RUNTIME_INTERACTIONS} />
<TopoViewer document={document} {...TOPOVIEWER_GUIDED_AUTHORING_INTERACTIONS} />
```

| Preset | Intended behavior |
|---|---|
| `TOPOVIEWER_RUNTIME_INTERACTIONS` | Read-oriented runtime: no node mutation or connection authoring. |
| `TOPOVIEWER_GUIDED_AUTHORING_INTERACTIONS` | Shape handles, lasso selection, resize, and drag authoring. |
| `TOPOVIEWER_RAPID_AUTHORING_INTERACTIONS` | Guided authoring with full-node connection targets. |

Presets are immutable defaults. A host may spread a preset and then override a
specific prop when its workflow deliberately differs.

## Theme And Status

`colorMode` selects the bundled `light`, `dark`, or `system` token contract.
The optional `theme` prop overrides individual renderer tokens without changing
authored topology styles:

```tsx
<TopoViewer
  document={document}
  colorMode="light"
  theme={{ accent: '#0062a3', focus: '#005a9c' }}
/>
```

| Export | Stability | Use |
|---|---|---|
| `TOPOVIEWER_DARK_THEME` | Supported | Canonical dark renderer token values. |
| `TOPOVIEWER_LIGHT_THEME` | Supported | Canonical light renderer token values. |
| `topoViewerThemeStyle` | Advanced | Convert a mode and token overrides into CSS variables. |
| `topoViewerThemeClassName` | Advanced | Resolve the renderer theme class for a mode. |
| `TopoViewerThemeTokens` | Supported | Typed renderer chrome and semantic color tokens. |
| `TopoViewerThemeStyle` | Advanced | Typed CSS properties containing generated `--topoviewer-*` variables. |
| `TopoViewerColorMode` | Supported | `light`, `dark`, or host/system-selected mode. |
| `normalizeTopoStatus` | Supported | Normalize common operational aliases into canonical severity. |
| `resolveTopoStatus` | Supported | Resolve status from labels, object fields, or data using deterministic precedence. |
| `buildTopoStatusLegend` | Supported | Build a deterministic non-color status legend from a compiled graph. |
| `topoStatusRank` | Advanced | Compare normalized severity priority. |

Status normalization returns `normal`, `info`, `warning`, `minor`, `major`,
`critical`, or `unknown`. Rendered object accessibility names and status cues
use the same resolver. `buildTopoStatusLegend` returns labels, counts, and text
cues such as `OK`, `W`, and `!`; hosts remain responsible for placing the
legend in their own product layout.

## Host Integration Helpers

These exports support application adapters that need the same viewport control
contract as the static embed. They are public but experimental while the
authoring surfaces mature.

| Export | Stability | Use |
|---|---|---|
| `ViewportSettingsPanel` | Experimental | Shared layer, display, helper-line, grid-snap, and attention controls. |
| `ViewportSettingsPanelProps` | Experimental | Typed host callback contract for `ViewportSettingsPanel`. |
| `authoringHelperLinesOptions` | Experimental | Smooth authoring defaults with commit-time snapping. |
| `layerIds` | Advanced | Return stable IDs from layer definitions. |
| `reconcileSelectedLayerIds` | Advanced | Keep valid selected layers or fall back to all available layers. |
| `toggleSelectedLayerId` | Advanced | Add or remove one layer ID without duplicates. |

Import these helpers from `topoviewer/integration`; do not import package source
files by relative repository path. Import the shared renderer stylesheet from
`topoviewer/style.css`.

## Compile, Compose, Validate

| Export | Stability | Use |
|---|---|---|
| `composeTopoViewerDocument` | Supported | Merge topology and stylesheet YAML into one document. |
| `compileTopoGraph` | Supported | Compile a TopoViewer document into renderable graph state. |
| `compileTopoGraphResult` | Supported | Validate limits and compile unknown input into a success result or structured diagnostics. |
| `classifyTopoRenderState` | Advanced | Classify a compiled document as `ready`, `empty`, or `filtered-empty`. |
| `topoDiagnosticFromError` | Advanced | Normalize an unknown compiler/runtime error into a public diagnostic. |
| `applyStyle` | Advanced | Apply stylesheet rules to one object in compiler-style workflows. |
| `displayName` | Supported | Resolve canonical display text from `labels.name`, then `id`. |
| `safeMarkdownToHtml` | Advanced | Render supported Markdown as sanitized HTML for host-owned editing previews. |
| `validateTopoDocument` | Supported | Validate schema-level document correctness. |
| `lintTopoDocument` | Supported | Run semantic diagnostics. |
| `migrateTopoDocument` | Supported | Migrate older document shapes. |
| `migrateTopoBundle` | Supported | Migrate a split legacy topology/stylesheet pair into canonical `0.2` source ownership. |
| `migrateTopoToggles` | Supported | Migrate persisted toggle state. |
| `CURRENT_SCHEMA_VERSION` | Supported | Current schema version marker. |

Use `lintTopoDocument(document, { profile: 'tvds' })` to add opt-in design-system
warnings for status selectors that rely only on color and for literal text/background
color pairs below 4.5:1 contrast. The default profile is unchanged for backwards
compatibility.

## Layout

| Export | Stability | Use |
|---|---|---|
| `computeLayoutPositions` | Supported | Calculate positions for configured layout modes. |
| `BUILT_IN_LAYOUT_PROVIDERS` | Advanced | Immutable provider registry for `manual`, `force`, `clos`, and `tree`. |
| `computeClosLayoutPositions` | Supported | Calculate generic CLOS positions. |
| `computeTreeLayoutPositions` | Supported | Calculate deterministic directed hierarchy positions. |
| `analyzeClosLayoutDiagnostics` | Supported | Inspect CLOS inference quality and conflicts. |
| `rebuildRegionNodes` | Advanced | Rebuild region hulls after graph changes. |
| `LayoutMode` | Supported | Built-in YAML layout mode union. |
| `LayoutPosition` | Supported | One calculated graph coordinate with numeric `x` and `y` values. |
| `LayoutPositions` | Supported | Node-ID-to-coordinate map returned by layout providers. |
| `LayoutProvider` | Advanced | Host-owned deterministic layout provider contract. |
| `LayoutProviderInput` | Advanced | Read-only nodes, links, layout settings, and initial positions passed to a provider. |
| `LayoutProviderRegistry` | Advanced | Read-only provider lookup supplied to `computeLayoutPositions`. |
| `ClosLayoutDirection` | Supported | Direction type for generic CLOS layout. |
| `ClosInferLabelRole` | Supported | Explicit CLOS role override mapping type. |
| `TreeLayoutDirection` | Supported | Direction type for deterministic tree layout. |
| `TreeLayoutOptions` | Supported | Bounded tree level, node, and component gaps. |

Custom providers are an advanced TypeScript calculation hook. The canonical
YAML schema accepts only built-in layout modes; registering host code does not
silently expand the portable YAML contract.

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
| `normalizeViewportThresholds` | Supported | Normalize collapse/expand thresholds and hysteresis. |
| `NormalizedViewportThresholds` | Supported | Bounded lower and upper thresholds returned by normalization. |
| `resolveViewportThresholdTransition` | Supported | Classify one zoom value as lower, hold, upper, or invalid. |
| `ViewportThresholdTransition` | Supported | Result classification returned for one zoom value. |
| `reduceViewportExpansion` | Supported | Purely derive aggregate expansion state from zoom and eligible groups. |
| `ViewportExpansionInput` | Supported | Immutable zoom, group, expansion, and policy input for the reducer. |
| `ViewportExpansionReason` | Supported | Explains whether the reducer expanded, collapsed, retained, or rejected state. |

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
`LayoutConfig`, `LayoutMode`, `ClosLayoutOptions`, `TreeLayoutOptions`,
`TreeLayoutDirection`, `DiagramDefinition`, `DiagramShape`,
`DiagramCallout`, `DiagramConnector`, `DiagramPin`, `DiagramText`,
`ToggleDefinition`, `TopoBundleMigrationInput`, `TopoBundleMigrationResult`,
`CompiledGraph`, `CompiledNode`, `CompiledEdge`, `CompiledNodeData`,
`CompiledEdgeData`, `TopoViewerExtension`, `TopoViewerExtensionContext`, and
`TopoViewerConnectionCreate`, `TopoViewerGridOptions`, `TopoViewerHelperLinesOptions`, and
`TopoViewerNodePositionChange`, `TopoViewerObjectClick`,
`TopoViewerObjectDoubleClick`, `TopoViewerPaneClick`, `TopoViewerToolbarAction`,
`TopoViewerViewport`, `TopoViewerViewportControlsOptions`, `TopoCompileResult`,
`TopoRenderState`, `TopoViewerDiagnostic`, and `TopoViewerDiagnosticCode`.

The migration declarations are exported as `type TopoBundleMigrationInput` and
`type TopoBundleMigrationResult` from the package entry point.

Attention types include `FocusQuery`, `FocusResult`,
`FocusPresentationMode`, `AttentionPresentationResult`,
`AttentionScoreResult`, `AggregateGraphResult`, and related aggregate/group
types.

Runtime support types also include `TopoViewerColorMode`,
`TopoViewerThemeTokens`, `TopoViewerInteractionPreset`, `TopoStatusSeverity`,
`TopoStatusLegendEntry`, `ViewportThresholdPolicy`, and
`ViewportExpansionResult`.

Style types include `StyleKeyDefinition`, `StyleTargetKind`,
`StyleValueDataType`, `StyleDefault`, `NodeShapeName`, `NodeIconFit`,
`NodeLayoutCardStyle`, `NodeLabelPosition`, `NodeBadgePosition`, and
`NodeStatusPlacement`.
