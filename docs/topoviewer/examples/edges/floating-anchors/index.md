---
hide:
  - toc
---

# Floating anchors

Floating anchors are the default edge behavior. The renderer computes a boundary attachment point from the node geometry so the line does not terminate at the node center.

## Expected Result

Floating anchors connect to the facing side of each visible node outline.

## Try It

1. Copy the two YAML tabs into your own project.
2. In the `link` rule in stylesheet.yaml, set `curveStyle` to `"bezier"`.
3. Reload. The route curves while endpoints remain attached to the facing node outlines.
4. Restore the original settings and reload to compare with the starting view.

=== "Live Viewport"

    ```topoviewer
    topology: topology.yaml
    stylesheet: stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Floating anchors
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/edges/floating-anchors/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/edges/floating-anchors/stylesheet.yaml"
    ```
