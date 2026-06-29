---
hide:
  - toc
---

# Arrows, dashes, and labels

## What This Demonstrates

Arrows, dashes, and labels are edge styling. The request and reply links use the same `lineDashPattern` but different `lineDashOffset` values, so the rendered dash cadence is visibly phase-shifted. Endpoint labels make it clear that `sourceLabel` follows the edge source and `targetLabel` follows the edge target.

## Expected Result

The live viewport should render "Arrows, dashes, and labels" without blocking diagnostics. It should show: Edges can carry labels, arrows, dash patterns, and dash offsets without changing topology semantics. The test metadata expects `graphNodes`: `2`, `minVisibleEdges`: `2`.

## What To Inspect

- Inspect `graph.links` for endpoint IDs and labels.
- Compare line, arrow, label, and curve style keys in the stylesheet.

## Use When

Use this pattern when link readability, routing, arrowheads, or edge labels matter.

=== "Live Viewport"

    ```topoviewer
    topology: ../../../examples/edges/arrows-dashes-labels/topology.yaml
    stylesheet: ../../../examples/edges/arrows-dashes-labels/stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Arrows, dashes, and labels
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/edges/arrows-dashes-labels/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/edges/arrows-dashes-labels/stylesheet.yaml"
    ```
