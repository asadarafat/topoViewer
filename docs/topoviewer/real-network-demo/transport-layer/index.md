---
hide:
  - toc
---

# Real network transport layer

The transport layer view starts from the real network BGP view and adds the programmed SR transport path between FRA-PE1 and LON-PE1. BGP remains visible as control-plane context, while the transport path shows the ordered forwarding intent across the underlay.

=== "Live Viewport"

    ```topoviewer
    topology: ../../examples/integration/real-network-transport-layer/topology.yaml
    stylesheet: ../../examples/integration/real-network-transport-layer/stylesheet.yaml
    height: 520px
    controls: true
    controlsOpen: false
    title: Real network transport layer
    selectedLayerIds:
      - underlay
      - bgp
      - transport
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/integration/real-network-transport-layer/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/integration/real-network-transport-layer/stylesheet.yaml"
    ```
