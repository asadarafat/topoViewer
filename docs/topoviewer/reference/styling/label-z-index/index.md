---
hide:
  - toc
---

# Label z-index

Use `labelZIndex` when labels need their own draw order without moving the object body, edge line, or region hull. The region label, edge label, endpoint labels, and node labels in this example intentionally use separate label layers.

=== "Live Viewport"

    ```topoviewer
    topology: ../../../examples/styling/label-z-index/topology.yaml
    stylesheet: ../../../examples/styling/label-z-index/stylesheet.yaml
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
