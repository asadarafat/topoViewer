---
hide:
  - toc
---

# Custom polygon node

Use `shape: polygon` with `shapePolygonPoints` when a domain needs a recognizable marker that is not covered by the named shape set. Points are normalized x/y pairs in the `[-1, 1]` coordinate space.

## Expected Result

Polygon node bodies use normalized x/y point pairs through `shapePolygonPoints`.

## Try It

1. Copy the two YAML tabs into your own project.
2. In the `node[id = "site-b"]` rule in stylesheet.yaml, set `shapePolygonPoints` to `"0 0 1 0 0.5 1"`.
3. Reload. The custom node becomes a triangular polygon while retaining its identity.
4. Restore the original settings and reload to compare with the starting view.

=== "Live Viewport"

    ```topoviewer
    topology: topology.yaml
    stylesheet: stylesheet.yaml
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
