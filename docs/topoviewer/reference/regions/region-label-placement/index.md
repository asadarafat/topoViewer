---
hide:
  - toc
---

# Region label placement

Region label placement keeps small or single-node regions readable. Use `labelPosition` and `labelMargin` in region styles to anchor the label on a region edge, then use `headerPadding`, `paddingX`, or `paddingY` on the region when the label needs reserved interior space.

=== "Live Viewport"

    ```topoviewer
    topology: ../../../examples/regions/region-label-placement/topology.yaml
    stylesheet: ../../../examples/regions/region-label-placement/stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Region label placement
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/regions/region-label-placement/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/regions/region-label-placement/stylesheet.yaml"
    ```
