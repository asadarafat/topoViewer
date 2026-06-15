---
hide:
  - toc
---

# Draggable regions

Regions can be interactive hulls. Setting `draggable: true` and `selectable: true` in the stylesheet makes the region behave like an editable scope object.

=== "Live Viewport"

    ```topoviewer
    topology: ../../../examples/regions/draggable-regions/topology.yaml
    stylesheet: ../../../examples/regions/draggable-regions/stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Draggable regions
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/regions/draggable-regions/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/regions/draggable-regions/stylesheet.yaml"
    ```
