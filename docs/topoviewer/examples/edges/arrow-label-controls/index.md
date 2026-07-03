---
hide:
  - toc
---

# Arrow and label controls

## What This Demonstrates

Use directional arrow properties when the two ends of an edge need different semantics. This example uses a circle at the source, a vee at the target, and separate endpoint label styles so source and target capacity are readable at a glance.

## Expected Result

The live viewport should render "Arrow and label controls" without blocking diagnostics. It should show: Directional arrow and endpoint label styles can be controlled independently. The test metadata expects `graphNodes`: `3`, `minVisibleEdges`: `2`.

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
    title: Arrow and label controls
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/edges/arrow-label-controls/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/edges/arrow-label-controls/stylesheet.yaml"
    ```
