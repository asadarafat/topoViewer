## Why

Dense topology views often need labels to remain readable even when regions,
edges, and nodes overlap. Today TopoViewer supports `zIndex`, but that controls
the draw order of the whole object. It does not give authors a way to lift a
label above nearby topology while keeping the object body itself behind or at a
lower layer.

This matters for large, densely populated environments: labels are often the
thing operators need most, and pushing an entire node, region, or link above
the rest of the graph just to make the label readable changes the visual
meaning of the diagram.

## What Changes

### 1. Add canonical `labelZIndex`

Add a public style key named `labelZIndex`.

The casing decision is explicit:

- `labelZIndex` is canonical.
- `label-z-index`, `labelZindex`, `label-zIndex`, and other aliases are not
  supported.
- The name composes the existing `label*` style-prefix convention with the
  existing `zIndex` key. Since `zIndex` is already canonical, the composed key
  must preserve the capital `I`.

### 2. Apply the key across labels

`labelZIndex` should apply to labels for:

- nodes;
- links and paths;
- regions;
- shapes and callouts where a label is rendered.

For edge endpoint labels, add optional fine-grained keys:

- `sourceLabelZIndex`;
- `targetLabelZIndex`.

Those endpoint-specific values fall back to `labelZIndex` when omitted.

### 3. Keep object `zIndex` separate from label draw order

`zIndex` remains the object draw order. `labelZIndex` controls only the label
draw order. Existing documents without `labelZIndex` must preserve current
rendering behavior.

### 4. Implement a real label layering model

For node and region labels, simply putting `z-index` on a child element is not
enough because the label remains constrained by the parent node or region
stacking context. The implementation must decide on a renderer model that
supports independent label ordering when `labelZIndex` is used.

### 5. Document and test the behavior

Add small examples that demonstrate label draw order without crowded graphs.
Update schema hints, semantic lint, YAML authoring intelligence, and docs so
authors can discover `labelZIndex` confidently.

## Capabilities

### New Capabilities

- `label-z-index-style-control`: independent label draw order for TopoViewer
  style declarations.

### Modified Capabilities

- `stylesheet-node-style`: accepts canonical `labelZIndex`.
- `stylesheet-edge-style`: accepts canonical `labelZIndex`,
  `sourceLabelZIndex`, and `targetLabelZIndex`.
- `stylesheet-region-style`: accepts canonical `labelZIndex`.
- `stylesheet-shape-style` and `stylesheet-callout-style`: accept
  `labelZIndex` where labels are rendered.
- `topoviewer-renderer`: renders labels with independent draw order where the
  style requests it.
- `vscode-topoviewer-yaml-authoring`: suggests the new keys and typed numeric
  values.

## Impact

- `packages/topoviewer/src/core/style.ts` - compile label z-index keys into
  renderer data.
- `packages/topoviewer/src/components/NetworkNode.tsx` and
  `RegionNode.tsx` - preserve existing labels when no `labelZIndex` is set and
  support independent layering when it is set.
- `packages/topoviewer/src/components/FloatingEdge.tsx` - apply center,
  source, and target label z-index.
- `packages/topoviewer/src/styles.css` - support label-layer styling without
  breaking current label appearance.
- `packages/topoviewer/src/core/lint.ts`, schemas, and tests - validate
  canonical keys and numeric values.
- `packages/vscode-topoviewer/src/webview/webviewStyleMetadata.ts` and YAML
  intelligence - expose typed authoring help.
- `packages/topoviewer/content/**`, generated docs, MkDocs, and Zensical -
  document and demonstrate the capability.

## Non-Goals

- Automatic label collision detection.
- Automatic label placement or force-based label layout.
- Replacing object `zIndex`.
- Supporting kebab-case style keys or compatibility aliases.
- Letting arbitrary CSS become part of the public style contract.
