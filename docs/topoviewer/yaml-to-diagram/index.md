---
hide:
  - toc
---

# YAML to network diagram

This before/after example starts with topology YAML and a selector stylesheet, then renders the underlay slice from the Real Network Demo. It shows the core TopoViewer contract: graph facts stay declarative, while visual policy turns router roles, regions, layers, and operational state into a readable network diagram.

=== "Live Viewport"

    ```topoviewer
    topology: ../examples/integration/yaml-to-network-diagram/topology.yaml
    stylesheet: ../examples/integration/yaml-to-network-diagram/stylesheet.yaml
    height: 520px
    controls: true
    controlsOpen: false
    title: YAML to network diagram
    selectedLayerIds:
      - underlay
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/integration/yaml-to-network-diagram/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/integration/yaml-to-network-diagram/stylesheet.yaml"
    ```
