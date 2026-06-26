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

### Theme Variables Are Surface-Specific

The harness runs inside a MUI theme/CssBaseline environment and imports
TopoViewer styles directly. MkDocs and Zensical use embed assets plus wrapper
CSS that overrides many `--topoviewer-*` variables to fit documentation
themes. This is acceptable only if the contract is explicit and tested under a
shared parity theme.

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

### 3. DOM And Visual Assertions

For each parity fixture, assert both:

- structural DOM data: node count, edge count, label count, edge `d` paths,
  computed stroke widths, icon box sizes, and selected layer IDs;
- screenshot crop against a stable baseline or cross-surface pixel delta.

DOM assertions explain failures faster. Screenshot assertions catch CSS issues
that DOM counts miss.

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
