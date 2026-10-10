# Nodes

Explore nodes behavior with a live diagram and its two source files. Each example includes an edit to try in your own copy.

## Named node shapes

Node shape is presentation policy. Use stylesheet selectors to map graph labels such as role or device type to distinct node bodies while keeping topology facts in `graph.nodes` and `graph.links`.

### Expected Result

Node body shape can encode device or service role without changing graph facts.

### Try It

1. Copy the two YAML tabs into your own project.
2. In the `node[labels.role = "switch"]` rule in stylesheet.yaml, set `shape` to `"circle"`.
3. Reload. The matched node uses a circular body; its identity and links stay intact.
4. Restore the original settings and reload to compare with the starting view.

=== "Live Viewport"

    ```topoviewer
    topology: named-node-shapes/topology.yaml
    stylesheet: named-node-shapes/stylesheet.yaml
    height: 440px
    controls: true
    controlsOpen: false
    title: Named node shapes
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/nodes/named-node-shapes/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/nodes/named-node-shapes/stylesheet.yaml"
    ```

## Custom polygon node

Use `shape: polygon` with `shapePolygonPoints` when a domain needs a recognizable marker that is not covered by the named shape set. Points are normalized x/y pairs in the `[-1, 1]` coordinate space.

### Expected Result

Polygon node bodies use normalized x/y point pairs through `shapePolygonPoints`.

### Try It

1. Copy the two YAML tabs into your own project.
2. In the `node[id = "site-b"]` rule in stylesheet.yaml, set `shapePolygonPoints` to `"0 0 1 0 0.5 1"`.
3. Reload. The custom node becomes a triangular polygon while retaining its identity.
4. Restore the original settings and reload to compare with the starting view.

=== "Live Viewport"

    ```topoviewer
    topology: custom-polygon-shape/topology.yaml
    stylesheet: custom-polygon-shape/stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Custom polygon node
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/nodes/custom-polygon-shape/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/nodes/custom-polygon-shape/stylesheet.yaml"
    ```

## Node label placement

Node label placement keeps labels readable when node shapes, labels, and nearby links compete for space. This example places labels above, beside, and inside four nodes while keeping graph facts unchanged.

### Expected Result

Node labels can be placed around or inside node bodies with wrapping and backing controls.

### Try It

1. Copy the two YAML tabs into your own project.
2. In the `node[labels.role = "service"]` rule in stylesheet.yaml, set `labelPosition` to `"top"`.
3. Reload. The matched node label moves above the body.
4. Restore the original settings and reload to compare with the starting view.

=== "Live Viewport"

    ```topoviewer
    topology: label-placement/topology.yaml
    stylesheet: label-placement/stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Node label placement
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/nodes/label-placement/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/nodes/label-placement/stylesheet.yaml"
    ```

## Border, outline, and underlay

Border, outline, and underlay styles create operational emphasis without changing the topology. Warning and critical nodes stand out through stroke pattern, outline, and underlay while the normal peer stays visually quiet.

### Expected Result

Node border, outline, and underlay controls provide operational emphasis without changing graph facts.

### Try It

1. Copy the two YAML tabs into your own project.
2. In the `node[labels.state = "critical"]` rule in stylesheet.yaml, set `outlineWidth` to `8`.
3. Reload. The outer outline grows independently of the body border and underlay.
4. Restore the original settings and reload to compare with the starting view.

=== "Live Viewport"

    ```topoviewer
    topology: border-outline-underlay/topology.yaml
    stylesheet: border-outline-underlay/stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Border, outline, and underlay
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/nodes/border-outline-underlay/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/nodes/border-outline-underlay/stylesheet.yaml"
    ```

## Icon fit and badges

Icon fit, badges, and status markers let a small node carry asset, count, and health cues. Use badges for compact values and status markers for color-coded state.

`iconFit` accepts `contain`, `cover`, and `fill`. This example uses the same wide SVG in a circular node for all three nodes: `contain` preserves the whole SVG with empty space, `cover` crops the wide SVG to fill the circular node body, and `fill` stretches the SVG across the circular node body. The demo SVG opts into stretching with `preserveAspectRatio="none"` so the `fill` behavior is visible.

### Expected Result

Icon fit, badges, and status markers add compact node-level signals.

### Try It

1. Copy the two YAML tabs into your own project.
2. In the `node[labels.role = "fill"]` rule in stylesheet.yaml, set `badgePosition` to `"bottomLeft"`.
3. Reload. The badge moves to the lower-left shell; its text and source identity are unchanged.
4. Restore the original settings and reload to compare with the starting view.

=== "Live Viewport"

    ```topoviewer
    topology: icon-fit-and-badges/topology.yaml
    stylesheet: icon-fit-and-badges/stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Icon fit and badges
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/nodes/icon-fit-and-badges/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/nodes/icon-fit-and-badges/stylesheet.yaml"
    ```

## Card node layout

Card node layout is for nodes that need to read like compact operational
records instead of plain device glyphs.

The node is still a `roundRectangle`. The nested `nodeLayout` object only
changes the internal arrangement: icon box on the left, title and subtitle on
the right. Badges and status markers stay node-level controls, so a card can
keep a TurboFlow-style badge on the top-right shell while its icon cell renders
either a glyph or an inline SVG. Use the badge size keys when the compact
defaults are too small for the card body.

Use this pattern for service maps, application dependencies, Kubernetes
objects, or operations views where every node needs a name plus one short piece
of metadata.

### Expected Result

Nested `nodeLayout` makes round-rectangle nodes read like compact service cards.

### Try It

1. Copy the two YAML tabs into your own project.
2. In the `node` rule in stylesheet.yaml, set `nodeLayout.content.align` to `"center"`.
3. Reload. The card title and subtitle align centrally in their content cell; the icon remains separate.
4. Restore the original settings and reload to compare with the starting view.

=== "Live Viewport"

    ```topoviewer
    topology: card-node-layout/topology.yaml
    stylesheet: card-node-layout/stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Card node layout
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/nodes/card-node-layout/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/nodes/card-node-layout/stylesheet.yaml"
    ```
