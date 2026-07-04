---
hide:
  - toc
---

# Endpoint label controls

## What This Demonstrates

Use endpoint labels when the two ends of an edge need visible port names. This example keeps circle and square arrow markers as geometry only, then renders `sourceLabel` and `targetLabel` as styled endpoint annotations with automatic placement.

`endpointLabelDistance` moves labels away from their endpoint along the edge. `endpointLabelSideOffset` moves labels perpendicular to the edge during auto placement. `sourceLabelXOffset`, `sourceLabelYOffset`, `targetLabelXOffset`, and `targetLabelYOffset` are final manual nudges after auto placement.

## Expected Result

The live viewport should render "Endpoint label controls" without blocking diagnostics. It should show: Endpoint labels can show physical ports while arrow markers remain pure geometry. The test metadata expects `graphNodes`: `3`, `minVisibleEdges`: `2`.

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
    title: Endpoint label controls
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/edges/endpoint-label-controls/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/edges/endpoint-label-controls/stylesheet.yaml"
    ```
