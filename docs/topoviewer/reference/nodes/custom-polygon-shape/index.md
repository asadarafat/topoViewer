---
hide:
  - toc
---

# Custom polygon node

Use `shape: polygon` with `shapePolygonPoints` when a domain needs a recognizable marker that is not covered by the named shape set. Points are normalized x/y pairs in the `[-1, 1]` coordinate space.

=== "Live Viewport"

    ```topoviewer
    topology: ../../../examples/nodes/custom-polygon-shape/topology.yaml
    stylesheet: ../../../examples/nodes/custom-polygon-shape/stylesheet.yaml
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
