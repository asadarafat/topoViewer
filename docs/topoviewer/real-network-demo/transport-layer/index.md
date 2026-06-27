---
hide:
  - toc
---

# Real network transport layer

## What This Demonstrates

The transport layer view starts from the real network BGP view and adds the programmed SR transport path between FRA-PE1 and LON-PE1. BGP remains visible as control-plane context, while the transport path shows the ordered forwarding intent across the underlay.

## Expected Result

The live viewport should render "Real network transport layer" without blocking diagnostics. It should show: A transport layer view that adds the programmed SR path on top of the real network BGP view. The test metadata expects `graphNodes`: `5`, `minVisibleEdges`: `8`, `minRegions`: `3`.

## What To Inspect

- Inspect the topology YAML for semantic objects.
- Inspect the stylesheet YAML for the visual contract.

## Use When

Use this pattern when documenting a reusable TopoViewer behavior.

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
