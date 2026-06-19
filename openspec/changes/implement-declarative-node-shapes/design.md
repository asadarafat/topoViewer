## Overview

This change adds declarative node body geometry to TopoViewer. The public authoring surface should stay small: node styles continue to live under `style`, and the primary key remains `shape`. The implementation should not introduce a new top-level `shapeStyle` block because that would blur the existing topology/stylesheet model and conflict with the current internal compiled `shapeStyle` naming used for other rendered objects.

The reference model is Cytoscape-style node shape authoring: a `shape` style property controls node body geometry, and normalized polygon points define custom polygons. TopoViewer should adopt the authoring idea, not Cytoscape syntax. TopoViewer's public style keys and multi-word style values use `camelCase`, so `shapePolygonPoints` is the only public key for custom polygon points.

## Public Contract

Recommended stylesheet form:

```yaml
stylesheet:
  - selector: node[labels.role = "core"]
    style:
      shape: hexagon
      backgroundColor: "#dbeafe"
      borderColor: "#2563eb"
      borderWidth: 2

  - selector: node[labels.role = "custom-marker"]
    style:
      shape: polygon
      shapePolygonPoints: "0 -1 1 0.4 0.35 1 -0.35 1 -1 0.4"
```

Supported keys:

- `shape`: named shape, using camelCase for multi-word values.
- `shapePolygonPoints`: custom polygon points.

Do not add a public `shapeStyle` object. TopoViewer already has `style`, and public shape authoring should compose with the existing selector rules, object `style` overrides, schemas, and docs.

## Rendering Approach

Current node rendering approximates the body shape with CSS border radius. That cannot support triangles, diamonds, stars, tags, or custom polygons.

Recommended implementation:

1. Compile canonical shape values in `compileNodeStyle`.
2. Compile shape metadata into node data, e.g. `nodeShape`, `nodePolygonPoints`, and existing color/border style values.
3. Render the node body as SVG geometry inside `NetworkNode`, with the existing icon centered above the label.
4. Keep React Flow node bounds rectangular for layout, hit testing, dragging, and edge anchors.
5. Apply selection, attention, opacity, and focus classes/styles to the SVG body so state remains visible.

This preserves predictable layout and interaction while allowing richer visual semantics.

## Shape Mapping

Named shapes should be implemented as normalized SVG paths or polygon point sets scaled to the configured body width and height.

Initial geometry can be deterministic and lightweight:

- Ellipse: SVG `<ellipse>`.
- Rectangle and roundRectangle variants: SVG `<rect>` with appropriate radius or path.
- Polygonal named shapes: normalized point lists.
- Star and concave hexagon: normalized point lists.
- Tag, vee, barrel, rhomboid, cutRectangle, bottomRoundRectangle: dedicated normalized path or polygon definitions.
- Custom polygon: parsed normalized x/y pairs transformed from `[-1, 1]` to SVG viewport coordinates.

All generated shapes should fit inside the configured `iconWidth` / `iconHeight` body bounds.

## Validation

Validation should happen in two layers:

- JSON Schema accepts the style keys and basic value types where possible.
- Semantic lint validates shape names, polygon coordinate count, numeric parsing, and `[-1, 1]` bounds.

Runtime should still fail soft. Invalid shape input should render a safe fallback, preferably `ellipse`, and surface lint or validation diagnostics for authors.

## Existing Example Sweep

Existing first-party examples must be migrated to the canonical spelling:

- `shape: ellipse` remains default.
- `shape: rectangle` remains square-cornered.
- `shape: roundrectangle` becomes `shape: roundRectangle`.
- `shape-polygon-points` is not accepted; use `shapePolygonPoints`.
- Existing width, height, icon size, label, meta, attention, and edge-anchor behavior remains unchanged.

## Examples

Add at least two canonical examples:

1. `nodes/shape-style` or `graph/node-shapes`: compact topology with roles such as PE router, firewall, service, and user/site marker, styled by labels.
2. `nodes/custom-polygon-shape`: compact topology showing `shape: polygon` and canonical `shapePolygonPoints`.

Each example should include live viewport, topology YAML, stylesheet YAML, and expected assertions. Use few nodes so the shape behavior is obvious.

## Risks

- SVG body rendering may require careful layering so icons and labels remain readable.
- Arbitrary polygon hit testing should not drive core interaction; React Flow rectangular hit areas are more predictable.
- Too many shape values can create weak visual language. Docs should recommend shape use for semantic categories, not decoration.
- Compound or parent-like nodes may need rectangle-like fallback if child containment depends on rectangular bounds.
