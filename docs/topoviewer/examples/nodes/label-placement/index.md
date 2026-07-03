---
hide:
  - toc
---

# Node label placement

## What This Demonstrates

Node label placement keeps labels readable when node shapes, labels, and nearby links compete for space. This example places labels above, beside, and inside four nodes while keeping graph facts unchanged.

## Expected Result

The live viewport should render "Node label placement" without blocking diagnostics. It should show: Node labels can be placed around or inside node bodies with wrapping and backing controls. The test metadata expects `graphNodes`: `4`, `minVisibleEdges`: `4`.

## What To Inspect

- Inspect node labels, data, icon definitions, and body shape settings.
- Compare label, badge, status, icon, border, and underlay style keys.

## Use When

Use this pattern when node identity, iconography, labels, status, or shape treatment matters.

=== "Live Viewport"

    ```topoviewer
    topology: topology.yaml
    stylesheet: stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Node label placement
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/nodes/label-placement/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/nodes/label-placement/stylesheet.yaml"
    ```
