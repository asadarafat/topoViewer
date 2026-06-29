---
hide:
  - toc
---

# Complete network demo

## What This Demonstrates

The complete network demo is the integration fixture. It is intentionally broader than the feature fixtures and proves that graph facts, paths, regions, child nodes, shapes, callouts, SVG icons, controls, and theme variables can coexist.

## Expected Result

The live viewport should render "Complete network demo" without blocking diagnostics. It should show: An integrated network example combining graph facts, regions, child nodes, paths, shapes, and callouts. The test metadata expects `graphNodes`: `9`, `shapes`: `9`, `minVisibleEdges`: `1`, `minRegions`: `3`.

## What To Inspect

- Inspect the topology YAML for semantic objects.
- Inspect the stylesheet YAML for the visual contract.

## Use When

Use this pattern when documenting how TopoViewer fits into another system, dashboard, or operational workflow.

=== "Live Viewport"

    ```topoviewer
    topology: ../examples/integration/complete-network-demo/topology.yaml
    stylesheet: ../examples/integration/complete-network-demo/stylesheet.yaml
    height: 640px
    controls: true
    controlsOpen: false
    title: Complete network demo
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/integration/complete-network-demo/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/integration/complete-network-demo/stylesheet.yaml"
    ```
