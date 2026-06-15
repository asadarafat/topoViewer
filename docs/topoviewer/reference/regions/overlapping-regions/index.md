---
hide:
  - toc
---

# Overlapping regions

Overlapping regions are important for network diagrams because some routers, such as ABRs, belong to two scopes at once. R05 is intentionally inside both IS-IS L1 and IS-IS L2.

=== "Live Viewport"

    ```topoviewer
    topology: ../../../examples/regions/overlapping-regions/topology.yaml
    stylesheet: ../../../examples/regions/overlapping-regions/stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Overlapping regions
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/regions/overlapping-regions/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/regions/overlapping-regions/stylesheet.yaml"
    ```
