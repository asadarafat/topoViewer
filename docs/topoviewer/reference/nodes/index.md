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
