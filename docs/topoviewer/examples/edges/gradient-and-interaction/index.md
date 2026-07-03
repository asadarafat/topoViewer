---
hide:
  - toc
---

# Gradient and interaction flags

## What This Demonstrates

Linear gradients are useful for directional utilization, ownership, or state transitions. `interactive: false` leaves a reference edge visible while removing edge click handling, and `labelInteractive: false` keeps labels from taking pointer events.

## Expected Result

The live viewport should render "Gradient and interaction flags" without blocking diagnostics. It should show: Linear gradients and interaction flags can be declared directly on edge style rules. The test metadata expects `graphNodes`: `4`, `minVisibleEdges`: `2`.

## What To Inspect

- Inspect `graph.links` for endpoint IDs and labels.
- Compare line, arrow, label, and curve style keys in the stylesheet.

## Use When

Use this pattern when link readability, routing, arrowheads, or edge labels matter.

=== "Live Viewport"

    ```topoviewer
    topology: topology.yaml
    stylesheet: stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Gradient and interaction flags
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/edges/gradient-and-interaction/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/edges/gradient-and-interaction/stylesheet.yaml"
    ```
