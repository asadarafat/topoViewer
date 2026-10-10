---
hide:
  - toc
---

# Real network service path

The service path view starts from the real network transport layer and adds the Payments L3VPN. Customer edge nodes and access links appear at the sides, while the service lane is stitched over the SR transport path through the provider core.

## Expected Result

A service path view that focuses the customer L3VPN path across the same provider topology.

## Try It

1. Copy the two YAML tabs into your own project. Copy the Attention YAML tab into your `topoviewer` fence too; focus and collapse settings are separate from the two source files. Select the same layers in the viewer: `underlay`, `bgp`, `transport`, `service`.
2. In `graph.nodes.0` in topology.yaml, set `graph.nodes.0.labels.name` to `"Edge renamed"`.
3. Reload. The visible alias on ce-fra changes; its stable ID, relationships, and memberships remain unchanged.
4. Restore the original settings and reload to compare with the starting view.

=== "Live Viewport"

    ```topoviewer
    topology: ../../../integration/real-network-service-path/topology.yaml
    stylesheet: ../../../integration/real-network-service-path/stylesheet.yaml
    height: 520px
    controls: true
    controlsOpen: false
    title: Real network service path
    selectedLayerIds:
      - underlay
      - bgp
      - transport
      - service
    attention:
      query:
        pathIds:
          - payments-primary
        mode: dim-context
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/integration/real-network-service-path/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/integration/real-network-service-path/stylesheet.yaml"
    ```

=== "Attention YAML"

    ```yaml
    attention:
      query:
        pathIds:
          - payments-primary
        mode: dim-context
    ```
