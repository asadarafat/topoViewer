## Why

TopoViewer now supports declarative node shapes, but node styling is still thin where dense topology views need the most help: label readability, status emphasis, aggregate summaries, and image/icon behavior. Operators should be able to distinguish important nodes and scan crowded environments without relying only on color, shape, or graph expansion.

Cytoscape.js is a useful reference for node styling concepts, but TopoViewer should keep its own contract: selector-based styles, canonical `camelCase` keys, React Flow rendering, and topology facts separated from presentation policy. The right next step is a practical node-style surface that improves readability and operational meaning without trying to mirror every Cytoscape node property.

## What Changes

### 1. Add node label placement, wrapping, and backing controls

Node labels need more control when graphs are dense or node shapes vary. Add label controls for positioning, offsets, wrapping, backing, borders, opacity, and zoom-aware suppression.

Initial style keys:

- `labelPosition`
- `labelXOffset`
- `labelYOffset`
- `labelTextWrap`
- `labelTextMaxWidth`
- `labelTextOverflow`
- `labelTextAlign`
- `labelBackgroundColor`
- `labelBackgroundOpacity`
- `labelBorderColor`
- `labelBorderWidth`
- `labelPadding`
- `labelOpacity`
- `minZoomedLabelFontSize`

Existing label keys such as `labelColor`, `labelFontSize`, and `labelFontWeight` remain supported.

### 2. Add node border, outline, and underlay emphasis controls

Node shape, color, and border width are not enough for status and attention states. Add a restrained emphasis surface:

- `borderStyle`
- `borderDashPattern`
- `borderOpacity`
- `outlineColor`
- `outlineWidth`
- `outlineOpacity`
- `underlayColor`
- `underlayPadding`
- `underlayOpacity`

These controls should help model alarms, focus, aggregate state, and ownership without requiring authors to create custom SVG icons.

### 3. Add icon and image fit controls

TopoViewer already has reusable `icons` with glyphs, SVG, and image sources. Node styles should be able to control how those assets sit inside the node body:

- `iconOpacity`
- `iconPadding`
- `iconFit`
- `iconBackgroundColor`

Supported `iconFit` values should be `contain`, `cover`, and `fill`.

The preferred image model remains `icons`; this change should not introduce a competing arbitrary node background image contract unless implementation proves it is necessary.

### 4. Add aggregate badge and status styling

Attention aggregation and dense summary nodes need compact summary semantics. Add a small badge/status style surface for aggregate and high-signal nodes:

- `badgeLabel`
- `badgeColor`
- `badgeBackgroundColor`
- `badgeBorderColor`
- `badgePosition`
- `statusColor`
- `statusPlacement`
- `statusSize`

Aggregate-generated nodes may populate badge/status values from attention summaries, but explicit stylesheet and per-object values must remain possible.

### 5. Document and example the capability

Add compact node examples with live viewport, topology YAML, stylesheet YAML, and expected assertions. The examples should make each feature obvious with small graphs, not crowded demo topologies.

## Capabilities

### New Capabilities

- `node-style-controls`: practical node label, emphasis, icon, and aggregate-status styling for production topology views.

### Modified Capabilities

- `stylesheet-node-style`: expands supported canonical `camelCase` node style keys.
- `topoviewer-renderer`: renders additional node label, border, outline, underlay, icon, badge, and status behavior.
- `topoviewer-attention`: may enrich aggregate-generated nodes with summary badge/status values.
- `topoviewer-examples`: adds compact node style examples with generated docs and tests.

## Impact

- `packages/topoviewer/src/core/style.ts` - compile new node style keys into renderer data.
- `packages/topoviewer/src/components/NetworkNode.tsx` - render label placement/backing, border style, outlines, underlays, icon fit, badges, and status markers.
- `packages/topoviewer/src/styles.css` - support node label/backing/emphasis/icon/badge/status states.
- `packages/topoviewer/src/core/attention/reduction.ts` - expose aggregate summary values where useful for badges/status.
- `packages/topoviewer/src/core/validation.ts`, `packages/topoviewer/src/core/lint.ts`, and schemas - validate canonical keys and supported values.
- `packages/topoviewer/examples/test-cases/**` - add compact node style examples.
- `packages/topoviewer/tests/**` - add unit and Playwright coverage.
- `packages/topoviewer/docs/**`, `docs/**`, and Zensical sync output - document supported public node controls.
- `packages/mkdocs-topoviewer` - no Python contract change expected; browser asset sync is required after viewer build.

## Non-Goals

- Full Cytoscape.js node style parity.
- Supporting kebab-case style keys.
- Introducing a public `nodeStyle` or `shapeStyle` nested object.
- Making arbitrary CSS accepted as a public style contract.
- Replacing the existing reusable `icons` model with ad hoc per-node background images.
- Implementing full Cytoscape pie-chart, ghost, transition, or event style surfaces.
