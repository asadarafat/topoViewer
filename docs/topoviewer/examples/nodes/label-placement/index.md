---
hide:
  - toc
---

# Node label placement

Node label placement keeps labels readable when node shapes, labels, and nearby links compete for space. This example places labels above, beside, and inside four nodes while keeping graph facts unchanged.

## Expected Result

Node labels can be placed around or inside node bodies with wrapping and backing controls.

## Try It

1. Copy the two YAML tabs into your own project.
2. In the `node[labels.role = "service"]` rule in stylesheet.yaml, set `labelPosition` to `"top"`.
3. Reload. The matched node label moves above the body.
4. Restore the original settings and reload to compare with the starting view.

=== "Live Viewport"

    ```topoviewer
    topology: topology.yaml
    stylesheet: stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Node label placement
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/nodes/label-placement/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/nodes/label-placement/stylesheet.yaml"
    ```
