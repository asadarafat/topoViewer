---
hide:
  - toc
---

# Icon fit and badges

Icon fit, badges, and status markers let a small node carry asset, count, and health cues. Use badges for compact values and status markers for color-coded state.

`iconFit` accepts `contain`, `cover`, and `fill`. This example uses the same wide SVG in a square icon box for all three nodes: `contain` preserves the whole SVG with empty space, `cover` crops the wide SVG to fill the box, and `fill` stretches the SVG into the square. The demo SVG opts into stretching with `preserveAspectRatio="none"` so the `fill` behavior is visible.

=== "Live Viewport"

    ```topoviewer
    topology: ../../../examples/nodes/icon-fit-and-badges/topology.yaml
    stylesheet: ../../../examples/nodes/icon-fit-and-badges/stylesheet.yaml
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
