---
hide:
  - toc
---

# Shape rotation

Shape geometry, dimensions, and rotation are stylesheet policy. The topology keeps stable shape identity, position, layers, and selector labels; text remains a separate annotation concern.

## Expected Result

Shape geometry can be rotated directly or through a stylesheet rule.

## Try It

1. Copy the two YAML tabs into your own project.
2. In the `shape[labels.rotation = "styled"]` rule in stylesheet.yaml, set `rotation` to `45`.
3. Reload. The selected shape rotates to 45 degrees without moving its authored origin.
4. Restore the original settings and reload to compare with the starting view.

=== "Live Viewport"

    ```topoviewer
    topology: topology.yaml
    stylesheet: stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Shape rotation
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/shapes/rotation/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/shapes/rotation/stylesheet.yaml"
    ```
