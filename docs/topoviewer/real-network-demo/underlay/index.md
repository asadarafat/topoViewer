---
hide:
  - toc
---

# Real network underlay

The underlay view shows only the physical routed core: PE and P routers, straight grey transport links, and metro/core regions. Service endpoints, route reflectors, BGP sessions, and service paths are hidden so the operator can inspect the physical topology without control-plane or service overlays.

=== "Live Viewport"

    ```topoviewer
    topology: ../../examples/integration/real-network-underlay/topology.yaml
    stylesheet: ../../examples/integration/real-network-underlay/stylesheet.yaml
    height: 520px
    controls: true
    controlsOpen: false
    title: Real network underlay
    selectedLayerIds:
      - underlay
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/integration/real-network-underlay/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/integration/real-network-underlay/stylesheet.yaml"
    ```
