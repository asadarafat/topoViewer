---
hide:
  - toc
---

# Icon fit and badges

Icon fit, badges, and status markers let a small node carry asset, count, and health cues. Use badges for compact values and status markers for color-coded state.

`iconFit` accepts `contain`, `cover`, and `fill`. This example uses the same wide SVG in a circular node for all three nodes: `contain` preserves the whole SVG with empty space, `cover` crops the wide SVG to fill the circular node body, and `fill` stretches the SVG across the circular node body. The demo SVG opts into stretching with `preserveAspectRatio="none"` so the `fill` behavior is visible.

## Expected Result

Icon fit, badges, and status markers add compact node-level signals.

## Try It

1. Copy the two YAML tabs into your own project.
2. In the `node[labels.role = "fill"]` rule in stylesheet.yaml, set `badgePosition` to `"bottomLeft"`.
3. Reload. The badge moves to the lower-left shell; its text and source identity are unchanged.
4. Restore the original settings and reload to compare with the starting view.

=== "Live Viewport"

    ```topoviewer
    topology: topology.yaml
    stylesheet: stylesheet.yaml
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
