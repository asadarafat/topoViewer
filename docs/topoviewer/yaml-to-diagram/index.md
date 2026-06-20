---
hide:
  - toc
---

# YAML to network diagram

This before/after example starts with topology YAML and a selector stylesheet, then renders a compact provider network. It shows the core TopoViewer contract: topology facts stay declarative, while visual policy turns roles, protocols, service paths, and operational state into a readable diagram.

=== "Live Viewport"

    ```topoviewer
    topology: ../examples/integration/yaml-to-network-diagram/topology.yaml
    stylesheet: ../examples/integration/yaml-to-network-diagram/stylesheet.yaml
    height: 520px
    controls: true
    controlsOpen: false
    title: YAML to network diagram
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/integration/yaml-to-network-diagram/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/integration/yaml-to-network-diagram/stylesheet.yaml"
    ```
