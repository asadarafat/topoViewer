---
hide:
  - toc
---

# Real network failure view

## What This Demonstrates

The failure view turns operational state into attention. Critical and major objects stay bright, healthy context remains visible but muted, and the impacted service path is still traceable through the same underlying topology facts.

## Expected Result

The live viewport should render "Real network failure view" without blocking diagnostics. It should show: A failure view that focuses critical objects and keeps the impacted service path traceable. The test metadata expects `graphNodes`: `7`, `minVisibleEdges`: `13`, `minRegions`: `3`.

## What To Inspect

- Inspect the topology YAML for semantic objects.
- Inspect the stylesheet YAML for the visual contract.

## Use When

Use this pattern when documenting how TopoViewer fits into another system, dashboard, or operational workflow.

=== "Live Viewport"

    ```topoviewer
    topology: ../../integration/real-network-failure-view/topology.yaml
    stylesheet: ../../integration/real-network-failure-view/stylesheet.yaml
    height: 520px
    controls: true
    controlsOpen: false
    title: Real network failure view
    selectedLayerIds:
      - underlay
      - bgp
      - transport
      - service
      - operations
    attention:
      query:
        data:
          severity: critical
        mode: dim-context
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/integration/real-network-failure-view/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/integration/real-network-failure-view/stylesheet.yaml"
    ```

=== "Attention YAML"

    ```yaml
    attention:
      query:
        data:
          severity: critical
        mode: dim-context
    ```
