# Nodes

These examples document the nodes behaviors from the canonical TopoViewer test-case catalog. Each section is generated from one test case and keeps the live viewport, topology YAML, and stylesheet YAML together.

## Named node shapes

Node shape is presentation policy. Use stylesheet selectors to map graph labels such as role or device type to distinct node bodies while keeping topology facts in `graph.nodes` and `graph.links`.

=== "Live Viewport"

    ```topoviewer
    topology: ../../examples/nodes/named-node-shapes/topology.yaml
    stylesheet: ../../examples/nodes/named-node-shapes/stylesheet.yaml
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

=== "Live Viewport"

    ```topoviewer
    topology: ../../examples/nodes/custom-polygon-shape/topology.yaml
    stylesheet: ../../examples/nodes/custom-polygon-shape/stylesheet.yaml
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

=== "Live Viewport"

    ```topoviewer
    topology: ../../examples/nodes/label-placement/topology.yaml
    stylesheet: ../../examples/nodes/label-placement/stylesheet.yaml
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

=== "Live Viewport"

    ```topoviewer
    topology: ../../examples/nodes/border-outline-underlay/topology.yaml
    stylesheet: ../../examples/nodes/border-outline-underlay/stylesheet.yaml
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

=== "Live Viewport"

    ```topoviewer
    topology: ../../examples/nodes/icon-fit-and-badges/topology.yaml
    stylesheet: ../../examples/nodes/icon-fit-and-badges/stylesheet.yaml
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
