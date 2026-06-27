---
hide:
  - toc
---

# Custom polygon node

## What This Demonstrates

Use `shape: polygon` with `shapePolygonPoints` when a domain needs a recognizable marker that is not covered by the named shape set. Points are normalized x/y pairs in the `[-1, 1]` coordinate space.

## Expected Result

The live viewport should render "Custom polygon node" without blocking diagnostics. It should show: Polygon node bodies use normalized x/y point pairs through `shapePolygonPoints`. The test metadata expects `graphNodes`: `3`, `minVisibleEdges`: `2`.

## What To Inspect

- Inspect node labels, data, icon definitions, and body shape settings.
- Compare label, badge, status, icon, border, and underlay style keys.

## Use When

Use this pattern when node identity, iconography, labels, status, or shape treatment matters.

=== "Live Viewport"

    ```topoviewer
    topology: ../../../examples/nodes/custom-polygon-shape/topology.yaml
    stylesheet: ../../../examples/nodes/custom-polygon-shape/stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Custom polygon node
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/nodes/custom-polygon-shape/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/nodes/custom-polygon-shape/stylesheet.yaml"
    ```
