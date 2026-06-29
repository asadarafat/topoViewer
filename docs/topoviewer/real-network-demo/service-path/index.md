---
hide:
  - toc
---

# Real network service path

## What This Demonstrates

The service path view starts from the real network transport layer and adds the Payments L3VPN. Customer edge nodes and access links appear at the sides, while the service lane is stitched over the SR transport path through the provider core.

## Expected Result

The live viewport should render "Real network service path" without blocking diagnostics. It should show: A service path view that focuses the customer L3VPN path across the same provider topology. The test metadata expects `graphNodes`: `7`, `minVisibleEdges`: `13`, `minRegions`: `3`.

## What To Inspect

- Inspect the topology YAML for semantic objects.
- Inspect the stylesheet YAML for the visual contract.

## Use When

Use this pattern when documenting how TopoViewer fits into another system, dashboard, or operational workflow.

=== "Live Viewport"

    ```topoviewer
    topology: ../../examples/integration/real-network-service-path/topology.yaml
    stylesheet: ../../examples/integration/real-network-service-path/stylesheet.yaml
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
