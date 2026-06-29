---
hide:
  - toc
---

# Real network BGP

## What This Demonstrates

The BGP view starts from the real network underlay and adds the route reflector plus PE-to-RR sessions. Transport links remain straight grey context, while the BGP overlay carries the control-plane question.

## Expected Result

The live viewport should render "Real network BGP" without blocking diagnostics. It should show: A BGP view that makes route reflector sessions visible while keeping the underlay as context. The test metadata expects `graphNodes`: `5`, `minVisibleEdges`: `5`, `minRegions`: `3`.

## What To Inspect

- Inspect the topology YAML for semantic objects.
- Inspect the stylesheet YAML for the visual contract.

## Use When

Use this pattern when documenting how TopoViewer fits into another system, dashboard, or operational workflow.

=== "Live Viewport"

    ```topoviewer
    topology: ../../examples/integration/real-network-bgp/topology.yaml
    stylesheet: ../../examples/integration/real-network-bgp/stylesheet.yaml
    height: 520px
    controls: true
    controlsOpen: false
    title: Real network BGP
    selectedLayerIds:
      - underlay
      - bgp
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/integration/real-network-bgp/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/integration/real-network-bgp/stylesheet.yaml"
    ```
