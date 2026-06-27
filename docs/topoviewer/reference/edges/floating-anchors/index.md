---
hide:
  - toc
---

# Floating anchors

## What This Demonstrates

Floating anchors are the default edge behavior. The renderer computes a boundary attachment point from the node geometry so the line does not terminate at the node center.

## Expected Result

The live viewport should render "Floating anchors" without blocking diagnostics. It should show: Floating anchors connect to the nearest point on each node boundary. The test metadata expects `graphNodes`: `2`, `minVisibleEdges`: `1`.

## What To Inspect

- Inspect `graph.links` for endpoint IDs and labels.
- Compare line, arrow, label, and curve style keys in the stylesheet.

## Use When

Use this pattern when link readability, routing, arrowheads, or edge labels matter.

=== "Live Viewport"

    ```topoviewer
    topology: ../../../examples/edges/floating-anchors/topology.yaml
    stylesheet: ../../../examples/edges/floating-anchors/stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Floating anchors
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/edges/floating-anchors/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/edges/floating-anchors/stylesheet.yaml"
    ```
