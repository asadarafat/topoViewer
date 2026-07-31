## Context

`packages/topoviewer` owns graph semantics, compilation, React Flow rendering,
attention, validation, and public package artifacts. Embeds, Studio, Grafana,
MkDocs, Zensical, and custom React applications are consumers. Today the
package has strong graph behavior but several product-level contracts are
private or implicit: the embed owns zoom aggregation transitions, the CSS
contains two dark token sets and many chrome literals, compilation throws,
status semantics are spread across labels and mapper vocabulary, and hierarchy
layout is fixed to force or CLOS implementations.

React Flow already supplies focusable nodes and edges, tab traversal, native
selection, arrow-key movement, ARIA configuration, and color mode. The core
must retain and enrich that behavior rather than implement a second keyboard
graph navigator.

## Goals / Non-Goals

**Goals:**

- Establish one explicit logical-topology ownership boundary.
- Make compilation and rendering resilient without breaking throwing callers.
- Expose full semantic descriptions to assistive technology.
- Make light/dark theme ownership typed and enforceable.
- Normalize status semantics independently from visual style and runtime data.
- Share viewport aggregation behavior across hosts.
- Generalize layout ownership only enough to add a proven tree provider.
- Preserve packed ESM, CJS, type, embed, and schema compatibility.

**Non-Goals:**

- Geographic projection, map navigation, or a map SDK.
- Material UI or application panels in the renderer.
- Host loading orchestration, authentication, telemetry collection, or legend
  placement.
- A second keyboard navigation model layered over React Flow.
- Arbitrary plugin code loaded from YAML.
- Recoloring authored topology styles to one product palette.

## Decisions

### The base package is logical-only

Core positions objects in Cartesian graph space. Geographic coordinates may
remain ordinary domain data, but projection and map interaction belong to a
host adapter. This avoids a mandatory map dependency and keeps every current
surface map-neutral.

### Safe compilation wraps the authoritative compiler

`compileTopoGraphResult` will call the existing compiler and convert known
validation, limit, and compile failures into stable diagnostics. It will not
fork validation or compilation. `compileTopoGraph` remains throwing for source
compatibility and for callers that prefer fail-fast behavior.

`TopoViewer` becomes a small error-boundary shell around an inner renderer.
The inner renderer derives `empty` versus `filtered-empty` after compilation.
Default fallbacks use semantic HTML and an ARIA live region. Hosts can provide
fallback render functions and a diagnostic callback. Loading remains outside
the component because only a host knows whether data is still in flight.

### Accessibility extends React Flow's native model

The package keeps nodes and edges focusable and keyboard accessibility enabled.
Compiled ARIA labels include object kind, stable ID, visible label when
different, endpoint names for links, and normalized status. Visual labels may
truncate; accessibility labels never do. Status markers receive text through
the object description rather than becoming extra tab stops.

The implementation does not make connection handles a keyboard navigation
surface. Authoring hosts use named interaction presets and React Flow's native
selection/movement behavior; future keyboard link creation requires a separate
authoring command contract.

### Theme tokens are framework-neutral

`TopoViewerThemeTokens` is a flat typed token map whose keys correspond to
`--topoviewer-*` variables. Built-in light and dark constants are immutable.
`colorMode` selects the token set, and `theme` applies partial per-mode
overrides. `system` uses CSS media queries so it reacts without JavaScript
listeners.

Theme tokens own renderer chrome, controls, fallback states, edge-label
surfaces, and default canvas surfaces. Authored `stylesheet` declarations still
own graph object appearance. Existing dark values are retained where practical
to reduce visual churn. Spacing uses multiples of four; geometry controlled by
topology style metadata is outside that rule.

A small package script scans core CSS after stripping approved theme blocks,
SVG/data content, and comments. Any remaining color literal fails with a line
reference. One canonical CSS token block replaces the competing root and
parity declarations.

### Status semantics are independent of status styling

The public severity scale is `normal`, `info`, `warning`, `minor`, `major`,
`critical`, and `unknown`. The resolver recognizes documented aliases from
`labels.status`, `labels.severity`, `data.status`, and `data.severity` without
mutating source data. Mapped telemetry may call the same resolver.

Legend construction is a pure function over semantic objects and returns
deterministically ordered labels, glyph cues, and counts. Hosts decide where to
render legends. The opt-in `tvds` lint profile warns when a status selector
changes only color and when parseable literal foreground/background pairs miss
WCAG AA for normal text. It does not attempt browser-computed contrast.

### Viewport aggregation is a pure reducer

The current embed threshold logic moves into
`core/attention/viewportController.ts`. Inputs are the current expanded IDs,
zoom, policy, and eligible group IDs; output is the next IDs and a change
reason. Expansion and collapse thresholds are normalized once and preserve a
hysteresis band. The embed calls this reducer. Direct hosts receive the same
function and types.

### Interaction modes are immutable presets

The package exports plain `TopoViewerProps` subsets:

- runtime: no drag, resize, or connect handles;
- guided authoring: drag/select with shape-aware connection handles;
- rapid authoring: drag/select with full-node connection targets.

Presets are intentionally composable; explicit host props may override them.

### Layout uses an in-process provider registry

`LayoutProvider` is a synchronous, deterministic TypeScript interface. YAML
contains only a provider name and serializable options; it never loads code.
Built-in providers are held in an immutable registry. `computeLayoutPositions`
accepts an optional registry extension for trusted React hosts, while normal
compilation uses built-ins only. Unknown modes fail explicitly.

The tree provider uses directed links to establish parents, stable ID sorting
for ties, breadth-first levels, and deterministic component packing. Nodes
without incoming links become roots. If no root exists, the lexicographically
first unvisited node starts the component. Visited tracking breaks cycles.
Directions transform one canonical top-to-bottom result. Options are
`direction`, `levelGap`, `nodeGap`, and `componentGap`.

## Risks / Trade-offs

- **Fallback behavior hides programmer errors** -> The throwing compiler stays
  public; the React boundary reports diagnostics through a callback.
- **ARIA labels become verbose** -> Labels are deterministic and limited to
  identity, endpoints, and status; arbitrary data is not announced.
- **Theme migration changes screenshots** -> Dark mode remains default and
  visual regression fixtures are updated only for intentional token changes.
- **Contrast lint produces false confidence** -> It checks only parseable
  literals and is documented as authoring guidance, not a browser audit.
- **Status aliases conflict** -> Explicit severity wins over status and labels
  win over data; tests lock precedence.
- **Provider extensibility becomes speculative** -> Only tree is new; the
  interface is exercised by all built-ins and no dynamic loader is introduced.
- **Tree links are not a strict tree** -> Deterministic first-parent ownership
  and visited tracking keep DAGs and cycles bounded; links remain unchanged.

## Migration Plan

1. Add contracts and tests while preserving existing exports and defaults.
2. Move embed viewport behavior onto the shared reducer with parity tests.
3. Migrate CSS chrome to canonical token declarations and run screenshot tests.
4. Publish schema and docs additions, then verify packed ESM/CJS consumers.

Rollback is additive: hosts may ignore all new exports, use dark mode, retain
the throwing compiler, and keep existing layouts. Removing `tree` documents
requires changing only `layout.mode` and its options.

## Open Questions

None. Geographic rendering is explicitly deferred until a concrete host and
projection contract justify a separate change.
