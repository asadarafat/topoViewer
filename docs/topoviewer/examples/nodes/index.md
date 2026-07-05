# Nodes

These examples document the nodes behaviors from the canonical TopoViewer test-case catalog. Each section is generated from one test case and keeps the live viewport, topology YAML, and stylesheet YAML together.

## Named node shapes

### What This Demonstrates

Node shape is presentation policy. Use stylesheet selectors to map graph labels such as role or device type to distinct node bodies while keeping topology facts in `graph.nodes` and `graph.links`.

### Expected Result

The live viewport should render "Named node shapes" without blocking diagnostics. It should show: Node body shape can encode device or service role without changing graph facts. The test metadata expects `graphNodes`: `8`, `minVisibleEdges`: `7`.

### What To Inspect

- Inspect node labels, data, icon definitions, and body shape settings.
- Compare label, badge, status, icon, border, and underlay style keys.

### Use When

Use this pattern when node identity, iconography, labels, status, or shape treatment matters.

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

### What This Demonstrates

Use `shape: polygon` with `shapePolygonPoints` when a domain needs a recognizable marker that is not covered by the named shape set. Points are normalized x/y pairs in the `[-1, 1]` coordinate space.

### Expected Result

The live viewport should render "Custom polygon node" without blocking diagnostics. It should show: Polygon node bodies use normalized x/y point pairs through `shapePolygonPoints`. The test metadata expects `graphNodes`: `3`, `minVisibleEdges`: `2`.

### What To Inspect

- Inspect node labels, data, icon definitions, and body shape settings.
- Compare label, badge, status, icon, border, and underlay style keys.

### Use When

Use this pattern when node identity, iconography, labels, status, or shape treatment matters.

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

### What This Demonstrates

Node label placement keeps labels readable when node shapes, labels, and nearby links compete for space. This example places labels above, beside, and inside four nodes while keeping graph facts unchanged.

### Expected Result

The live viewport should render "Node label placement" without blocking diagnostics. It should show: Node labels can be placed around or inside node bodies with wrapping and backing controls. The test metadata expects `graphNodes`: `4`, `minVisibleEdges`: `4`.

### What To Inspect

- Inspect node labels, data, icon definitions, and body shape settings.
- Compare label, badge, status, icon, border, and underlay style keys.

### Use When

Use this pattern when node identity, iconography, labels, status, or shape treatment matters.

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

### What This Demonstrates

Border, outline, and underlay styles create operational emphasis without changing the topology. Warning and critical nodes stand out through stroke pattern, outline, and underlay while the normal peer stays visually quiet.

### Expected Result

The live viewport should render "Border, outline, and underlay" without blocking diagnostics. It should show: Node border, outline, and underlay controls provide operational emphasis without changing graph facts. The test metadata expects `graphNodes`: `3`, `minVisibleEdges`: `2`.

### What To Inspect

- Inspect node labels, data, icon definitions, and body shape settings.
- Compare label, badge, status, icon, border, and underlay style keys.

### Use When

Use this pattern when node identity, iconography, labels, status, or shape treatment matters.

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

### What This Demonstrates

Icon fit, badges, and status markers let a small node carry asset, count, and health cues. Use badges for compact values and status markers for color-coded state.

`iconFit` accepts `contain`, `cover`, and `fill`. This example uses the same wide SVG in a circular node for all three nodes: `contain` preserves the whole SVG with empty space, `cover` crops the wide SVG to fill the circular node body, and `fill` stretches the SVG across the circular node body. The demo SVG opts into stretching with `preserveAspectRatio="none"` so the `fill` behavior is visible.

### Expected Result

The live viewport should render "Icon fit and badges" without blocking diagnostics. It should show: Icon fit, badges, and status markers add compact node-level signals. The test metadata expects `graphNodes`: `3`, `minVisibleEdges`: `2`.

### What To Inspect

- Inspect node labels, data, icon definitions, and body shape settings.
- Compare label, badge, status, icon, border, and underlay style keys.

### Use When

Use this pattern when node identity, iconography, labels, status, or shape treatment matters.

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

### What This Demonstrates

Card node layout is for nodes that need to read like compact operational
records instead of plain device glyphs.

The node is still a `roundRectangle`. The nested `nodeLayout` object only
changes the internal arrangement: icon box on the left, title and subtitle on
the right, and an optional badge attached to the icon. This keeps the shape
contract stable while making the YAML easier to read than a long flat list of
card-specific style keys.

Use this pattern for service maps, application dependencies, Kubernetes
objects, or operations views where every node needs a name plus one short piece
of metadata.

### Expected Result

The live viewport should render "Card node layout" without blocking diagnostics. It should show: Nested `nodeLayout` makes round-rectangle nodes read like compact service cards. The test metadata expects `graphNodes`: `3`, `minVisibleEdges`: `2`.

### What To Inspect

- Inspect node labels, data, icon definitions, and body shape settings.
- Compare label, badge, status, icon, border, and underlay style keys.

### Use When

Use this pattern when node identity, iconography, labels, status, or shape treatment matters.

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
