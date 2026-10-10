---
hide:
  - toc
---

# Arrows, dashes, and labels

Arrows, dashes, and labels are edge styling. The request and reply links use the same `lineDashPattern` but different `lineDashOffset` values, so the rendered dash cadence is visibly phase-shifted. Endpoint labels make it clear that `sourceLabel` follows the edge source and `targetLabel` follows the edge target.

## Expected Result

Edges can carry labels, arrows, dash patterns, and dash offsets without changing topology semantics.

## Try It

1. Copy the two YAML tabs into your own project.
2. In the `link[labels.direction = "reply"]` rule in stylesheet.yaml, set `targetArrowShape` to `"none"`.
3. Reload. The target arrow disappears; the source relationship remains present.
4. Restore the original settings and reload to compare with the starting view.

=== "Live Viewport"

    ```topoviewer
    topology: topology.yaml
    stylesheet: stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Arrows, dashes, and labels
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/edges/arrows-dashes-labels/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/edges/arrows-dashes-labels/stylesheet.yaml"
    ```
