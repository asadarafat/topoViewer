## Findings

### Shared Renderer, Different Wrappers

All three surfaces eventually render `TopoViewer`, but the wrapper paths differ:

- Harness: `packages/vscode-topoviewer/src/webview/WebviewChrome.tsx`
  renders `TopoViewer` from `visibleDocument`, with explicit
  `toggles={{ showRegions: true }}`.
- MkDocs/Zensical: `packages/topoviewer/src/embed.tsx` fetches topology and
  stylesheet YAML, composes them, then renders `EmbeddedTopoViewer`.
- Zensical: `scripts/sync-zensical-docs.mjs` rewrites MkDocs fences into
  explicit HTML embeds and syncs assets into `.artifacts/zensical-docs`.

This means parity can break before `TopoViewer` if composition, selected
layers, toggles, or copied assets differ.

### Composition Is Not DRY Yet

Harness composition is in
`packages/vscode-topoviewer/src/shared/validation.ts`:

```ts
{
  ...stylesheet,
  ...topology,
  layout: topology.layout || stylesheet.layout,
  limits: topology.limits || stylesheet.limits,
  icons: stylesheet.icons || topology.icons,
  labelFields: stylesheet.labelFields || topology.labelFields,
  stylesheet: stylesheet.stylesheet || topology.stylesheet
}
```

Embed composition is in `packages/topoviewer/src/embed.tsx`:

```ts
{
  ...(topology || {}),
  ...(stylesheet || {}),
  graph: topology?.graph || {},
  toggles: topology?.toggles || stylesheet?.toggles || []
}
```

Those are not equivalent when both files define overlapping top-level keys.
This is the highest-risk root cause for future "same YAML, different render"
bugs.

### Viewport Size Changes Fit Scale

The CLOS fixture currently compiles to matching edge paths in harness, MkDocs,
and Zensical. The visible scale differs because:

- harness preview viewport was about `926 x 926`;
- MkDocs/Zensical embed viewport was about `936 x 420`;
- `ReactFlow` uses `fitView`, so the same graph coordinates are scaled
  differently on screen.

This is expected unless parity tests force the same viewer dimensions.

For normal rendering, the more important problem is over-zoom. React Flow's
native default viewport is `x: 0`, `y: 0`, `zoom: 1`; TopoViewer's unconditional
`fitView` can enlarge small graphs beyond that default. A simple two-node
manual layout measured:

- harness: `zoom = 2.30208`;
- MkDocs/Zensical: `zoom = 1.6875`.

Both are uniform scale transforms, but they make icon/name/meta spacing look
different in absolute pixels. The renderer should still fit large graphs down,
but automatic fit should not zoom above `1`.

### Aspect-Sensitive Node Shapes

React Flow zoom is uniform, so it does not distort circles or squares. The
distortion is inside the TopoViewer node geometry: `shape: square` and
`shape: circle` were rendered inside an SVG with `preserveAspectRatio="none"`.
When `width` and `height` differed, the square became a rectangle and the
circle became an ellipse.

The style contract should be:

- `square` and `circle` preserve a 1:1 visible body using the smaller authored
  dimension and center that body inside the configured node box;
- `rectangle` and `ellipse` are the explicit stretched variants;
- explicit `iconWidth`, `iconHeight`, or `iconSize` still override the default
  inner icon/image size.

### Region Hull Bounds Follow Rendered Node Stacks

Region bounds previously used static fallback dimensions for each member node.
That is too coarse once labels, metadata, icon sizing, and aspect-preserving
shapes are part of the rendered node contract.

Compiled node data should expose conservative `regionBoundsWidth` and
`regionBoundsHeight` values derived from the same style data used by
`NetworkNode`. Region hull recomputation should use those compiled dimensions
unless the author explicitly overrides `region.nodeWidth` or
`region.nodeHeight`.

This keeps draggable region behavior deterministic without requiring DOM reads
inside the layout engine.

### Theme Variables Are Surface-Specific

The harness runs inside a MUI theme/CssBaseline environment and imports
TopoViewer styles directly. MkDocs and Zensical use embed assets plus wrapper
CSS that overrides many `--topoviewer-*` variables to fit documentation
themes. This is acceptable only if the contract is explicit and tested under a
shared parity theme.

### Documentation CSS Can Only Theme Colors

The docs pages are allowed to set TopoViewer color variables, for example
`--topoviewer-bg`, `--topoviewer-fg-strong`, `--topoviewer-border`, and edge or
region label colors. They must not change renderer geometry.

The boundary is:

- allowed: CSS variables that resolve colors, opacity colors, shadows, and
  color-mix inputs;
- not allowed: inherited page rules that change width, height, min/max size,
  aspect ratio, padding, margin, line-height, letter-spacing, font-size,
  page-provided webfont availability, SVG sizing, image sizing, node stack
  layout, edge path geometry, handle geometry, or control button dimensions.

MkDocs and Zensical commonly ship broad content rules such as `svg { max-width:
100%; height: auto; }`. Those are correct for article content, but they must
not apply to TopoViewer's internal SVG surfaces. TopoViewer should therefore
use scoped geometry selectors for node body SVGs, standalone shape SVGs, icon
images, edge paint SVGs, and controls. The selectors should be strong enough to
win over documentation content rules without blocking supported color variable
theming.

TopoViewer renderer text should also use a page-independent font stack. A docs
theme may load a product font for prose, but the graph renderer should not
measure labels differently depending on whether that page font is present.

## Recommended Design

### 1. Shared Composition Function

Add a public or internal core helper in `packages/topoviewer/src/core`, for
example:

```ts
composeTopoViewerDocument(topology: TopoDocument, stylesheet?: TopoDocument): TopoDocument
```

The helper should define exact precedence:

- topology owns graph facts;
- stylesheet owns visual styling, icons, label fields, and stylesheet rules;
- layout and limits precedence must be deliberate and documented;
- toggles should have one deterministic merge rule.

Harness validation and `embed.tsx` must both call this helper.

### 2. Viewer-Only Parity Harness

Add a deterministic parity route or test helper that renders a selected
canonical fixture using:

- fixed viewport width and height;
- fixed dark/light color scheme;
- fixed initial selected layers;
- fixed controls closed;
- no surrounding docs page chrome in the screenshot crop.

This avoids false failures from page layout while catching renderer drift.
The parity harness should also record React Flow viewport zoom and fail if a
surface auto-zooms above `1`, because the authoring default should use React
Flow's default scale as the upper bound.

### 3. DOM And Visual Assertions

For each parity fixture, assert both:

- structural DOM data: node count, edge count, label count, edge `d` paths,
  computed stroke widths, icon box sizes, SVG geometry boxes, and selected
  layer IDs;
- screenshot crop against a stable baseline or cross-surface pixel delta.

DOM assertions explain failures faster. Screenshot assertions catch CSS issues
that DOM counts miss.

The parity page should intentionally include representative documentation CSS
resets for `svg`, `img`, and `button` elements. That makes the test exercise
the real contract: host pages may exist around the viewer, but renderer
geometry must remain owned by TopoViewer.

### 4. Asset Freshness Gate

Keep the generated asset clean gate, but add a clearer failure message for
renderer parity:

- build `packages/topoviewer/dist/embed`;
- sync MkDocs assets;
- sync Zensical assets;
- then run parity checks against the built `site/` tree.

The old missing-link screenshot is consistent with stale or mismatched embed
assets, so parity should run after asset sync, not before.

### 5. Golden Fixture Set

Start with a small fixture matrix:

- `graph/basic`: catches simple link visibility and label placement;
- `harness/clos-2spine-4leaf`: catches SVG icons, CLOS layout, regions, and
  dense links;
- `regions/region-label-placement`: catches region label anchor and edge
  endpoint visibility;
- `styling/label-z-index`: catches label stacking behavior;
- one SVG-icon harness template: catches icon fit and glyph alignment.

## Risks

- Full screenshot parity can be flaky if it compares page chrome or fonts.
  Use viewer-only crops and DOM assertions first.
- Docs themes can intentionally differ from harness. The parity mode must force
  the same variables so product theme differences do not mask renderer drift.
- If composition precedence changes existing behavior, update docs and tests in
  the same patch.
