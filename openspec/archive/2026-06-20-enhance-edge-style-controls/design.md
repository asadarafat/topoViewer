## Overview

This change expands TopoViewer edge styling where it improves dense topology readability. The design keeps the public contract stylesheet-first, canonical `camelCase`, and renderer-owned. Cytoscape.js remains a reference for useful concepts, not the runtime syntax or exact behavior contract.

Existing edge styles must continue to work:

```yaml
stylesheet:
  - selector: link
    style:
      curveStyle: bezier
      lineColor: "#60a5fa"
      lineWidth: 2
      lineDashPattern: "8 4"
      targetArrowShape: triangle
```

New controls should compose with the existing model rather than introduce nested edge style objects.

## Public Contract

Preferred authoring remains:

```yaml
stylesheet:
  - selector: link[labels.role = "traffic"]
    style:
      curveStyle: bezier
      lineWidth: 4
      lineFill: linearGradient
      lineGradientStopColors:
        - "#22c55e"
        - "#f97316"
      lineGradientStopPositions:
        - 0
        - 1
      targetArrowShape: vee
      targetArrowColor: "#f97316"
      targetArrowSize: 14
      targetDistanceFromNode: 8
      sourceLabel: ingress
      targetLabel: egress
      sourceLabelColor: "#065f46"
      targetLabelColor: "#9a3412"
```

Do not add a public `edgeStyle` object. TopoViewer already has `style`, selector rules, and per-object overrides.

## Arrow Rendering

Current behavior maps any non-`none` arrow shape to React Flow's closed arrow. That is too coarse for operational diagrams.

Recommended implementation:

1. Keep `sourceArrowShape` and `targetArrowShape`.
2. Add direction-specific color and size keys.
3. Keep `arrowColor` as a backwards-compatible fallback.
4. Render custom SVG marker definitions for the supported shape set.
5. Generate marker IDs from shape, color, size, and direction so equivalent markers can be reused.

Supported shape semantics:

- `none`: no marker.
- `triangle`: filled triangular arrow.
- `vee`: open chevron arrow.
- `tee`: terminal bar.
- `circle`: endpoint circle marker.
- `diamond`: filled diamond marker.

If custom markers conflict with React Flow's invisible interaction edge, keep marker rendering on the visible TopoViewer paint layer and keep `BaseEdge` for hit testing only.

## Endpoint Spacing

`sourceDistanceFromNode` and `targetDistanceFromNode` should adjust the visible endpoint after floating/pin/handle endpoint calculation and before path generation.

Interpretation:

- Positive values move the endpoint from the node boundary toward the opposite endpoint.
- `0` preserves current behavior.
- Values should be clamped so an edge cannot invert or collapse below a short minimum visible length.

This spacing should affect:

- visible edge path
- arrow marker position
- source/target label anchor position
- line outline and gradient path

It should not change:

- graph source/target IDs
- path membership
- dependency/focus traversal
- layout inputs

## Label Styling

The renderer currently creates HTML edge labels through `EdgeLabelRenderer`. Keep that model. Expand compiled label style data so center, source, and target labels can be styled independently.

Inheritance order:

1. default CSS variables
2. global label keys such as `labelColor`, `labelFontSize`, `labelFontWeight`, `textBackgroundColor`, and `textBackgroundOpacity`
3. endpoint-specific keys such as `sourceLabelColor` and `targetLabelColor`
4. attention label-priority CSS classes and data attributes

Do not make labels SVG text in this change. HTML labels are easier to style, theme, and keep readable on docs pages.

## Routing Controls

TopoViewer should support deterministic route shaping without promising exact Cytoscape path equivalence.

Recommended approach:

- Keep current `straight`, `bezier`, `unbundled-bezier`, `segments`, `round-segments`, `taxi`, and `round-taxi` author intent.
- Add canonical value aliases only if the existing value contract is explicitly migrated in a separate change. This change focuses on style keys and behavior.
- Implement explicit route points for segment/taxi paths inside `FloatingEdge` when React Flow helper functions are insufficient.

Segment controls:

- `segmentWeights`: fractional positions along the source-target vector.
- `segmentDistances`: perpendicular offsets at those weights.
- A single value applies one bend; arrays apply multiple bends.

Taxi controls:

- `taxiDirection`: `auto`, `vertical`, `horizontal`, `upward`, `downward`, `leftward`, or `rightward`.
- `taxiTurn`: absolute or relative turn distance from the source side.
- `taxiTurnMinDistance`: minimum edge length before the turn applies.

If a route control is invalid, lint should report it and runtime should fall back to current route behavior.

## Gradient Lines

Gradient lines should render on the visible SVG paint layer:

1. Compile `lineFill`, `lineGradientStopColors`, and `lineGradientStopPositions` into edge data.
2. Generate a stable per-edge or per-style `linearGradient` ID.
3. Define the gradient in the edge paint-layer SVG.
4. Set the visible path stroke to `url(#gradient-id)`.
5. Preserve `lineOpacity`, `lineDashPattern`, line outlines, lane rendering, and attention dimming.

Initial scope:

- `lineFill: solid` remains default.
- `lineFill: linearGradient` enables gradient strokes.
- Stops may be arrays or whitespace-separated strings.
- Stop positions may be normalized numbers `0..1` or percentages.

Out of scope:

- radial gradients
- per-segment gradients on multi-segment paths
- animated gradients

## Interaction Flags

Add two flags:

- `interactive`: controls edge click/select hit testing.
- `labelInteractive`: controls label pointer events.

Default behavior remains interactive. When `interactive: false`, TopoViewer should keep the edge visible but suppress click handling and selection where React Flow allows it. When `labelInteractive: false`, labels should use `pointer-events: none` while remaining visible.

## Validation And Lint

Validation should continue rejecting kebab-case style keys. Add semantic lint for:

- unsupported arrow shapes
- non-numeric arrow sizes
- invalid endpoint spacing values
- mismatched gradient color/position counts
- invalid gradient stop positions
- invalid route control arrays
- unsupported `taxiDirection`

Runtime should fail soft and preserve a visible graph even if style input is imperfect.

## Examples

Add compact examples under the existing reference examples structure:

1. `edges/arrow-label-controls`: direction-specific arrows and endpoint label styling.
2. `edges/endpoint-spacing-routing`: endpoint spacing plus deterministic segment/taxi routing on a small graph.
3. `edges/gradient-and-interaction`: gradient line, decorative non-interactive edge, and label interaction behavior.

Each example should include live viewport, topology YAML, stylesheet YAML, and expected assertions. Keep each graph small so the visual effect is obvious.

## Risks

- SVG marker definitions can become brittle if IDs collide across multiple viewer instances.
- Endpoint spacing and marker geometry can visually misalign on very short edges unless distances are clamped.
- Rich label styling can make docs examples noisy; examples should use restraint.
- Route controls can be overfit to Cytoscape semantics. TopoViewer must document its own deterministic behavior.
- Gradients and outlines need careful ordering so outlines do not hide the gradient stroke.
