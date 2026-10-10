---
hide:
  - toc
---

# Two-dimensional shapes

2D shapes are annotation primitives. They remain separate from graph nodes, while topology labels provide stable selector facts and the stylesheet owns visual geometry and dimensions.

## Expected Result

2D geometry primitives are diagram objects, not graph facts.

## Try It

1. Copy the two YAML tabs into your own project.
2. In the `shape` rule in stylesheet.yaml, set `geometry` to `"circle"`.
3. Reload. The selected annotation uses circular geometry; graph connectivity is unaffected.
4. Restore the original settings and reload to compare with the starting view.

=== "Live Viewport"

    ```topoviewer
    topology: topology.yaml
    stylesheet: stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Two-dimensional shapes
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/shapes/two-dimensional/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/shapes/two-dimensional/stylesheet.yaml"
    ```
