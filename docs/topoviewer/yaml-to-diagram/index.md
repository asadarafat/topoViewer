---
hide:
  - toc
---

# YAML to network diagram

## What This Demonstrates

This before/after example starts with topology YAML and a selector stylesheet, then renders the underlay slice from the Real Network Demo. It shows the core TopoViewer contract: graph facts stay declarative, while visual policy turns router roles, regions, layers, and operational state into a readable network diagram.

## Expected Result

The live viewport should render "YAML to network diagram" without blocking diagnostics. It should show: A compact before/after example using the same provider underlay slice as the Real Network Demo. The test metadata expects `graphNodes`: `4`, `minVisibleEdges`: `3`, `minRegions`: `3`.

## What To Inspect

- Inspect the topology YAML for semantic objects.
- Inspect the stylesheet YAML for the visual contract.

## Use When

Use this pattern when documenting how TopoViewer fits into another system, dashboard, or operational workflow.

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
