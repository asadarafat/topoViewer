---
hide:
  - toc
---

# Label z-index

Use `labelZIndex` when labels need their own draw order without moving the object body, edge line, or region hull. The region label, edge label, endpoint labels, and node labels in this example intentionally use separate label layers.

## Expected Result

Labels can draw in their own layer without changing object, edge, or region draw order.

## Try It

1. Copy the two YAML tabs into your own project.
2. In the `region` rule in stylesheet.yaml, set `labelZIndex` to `100`.
3. Reload. The matching label moves above competing drawing layers without changing its object body order.
4. Restore the original settings and reload to compare with the starting view.

=== "Live Viewport"

    ```topoviewer
    topology: topology.yaml
    stylesheet: stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Label z-index
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/styling/label-z-index/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/styling/label-z-index/stylesheet.yaml"
    ```
