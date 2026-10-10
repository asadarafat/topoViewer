---
hide:
  - toc
---

# Real network transport layer

The transport layer view starts from the real network BGP view and adds the programmed SR transport path between FRA-PE1 and LON-PE1. BGP remains visible as control-plane context, while the transport path shows the ordered forwarding intent across the underlay.

## Expected Result

A transport layer view that adds the programmed SR path on top of the real network BGP view.

## Try It

1. Copy the two YAML tabs into your own project. Select the same layers in the viewer: `underlay`, `bgp`, `transport`.
2. In `graph.nodes.0` in topology.yaml, set `graph.nodes.0.labels.name` to `"Edge renamed"`.
3. Reload. The visible alias on ce-fra changes; its stable ID, relationships, and memberships remain unchanged.
4. Restore the original settings and reload to compare with the starting view.

=== "Live Viewport"

    ```topoviewer
    topology: ../../../integration/real-network-transport-layer/topology.yaml
    stylesheet: ../../../integration/real-network-transport-layer/stylesheet.yaml
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
