---
hide:
  - toc
---

# Label z-index

## What This Demonstrates

Use `labelZIndex` when labels need their own draw order without moving the object body, edge line, or region hull. The region label, edge label, endpoint labels, and node labels in this example intentionally use separate label layers.

## Expected Result

The live viewport should render "Label z-index" without blocking diagnostics. It should show: Labels can draw in their own layer without changing object, edge, or region draw order. The test metadata expects `graphNodes`: `2`, `minVisibleEdges`: `1`, `minRegions`: `1`.

## What To Inspect

- Inspect selector order and the style keys applied by each rule.
- Compare broad defaults with more specific label or data selectors.

## Use When

Use this pattern when building reusable visual rules from labels and data.

=== "Live Viewport"

    ```topoviewer
    topology: ../../../examples/styling/label-z-index/topology.yaml
    stylesheet: ../../../examples/styling/label-z-index/stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Label z-index
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/styling/label-z-index/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/styling/label-z-index/stylesheet.yaml"
    ```
