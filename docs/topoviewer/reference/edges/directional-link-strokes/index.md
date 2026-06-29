---
hide:
  - toc
---

# Directional link strokes

## What This Demonstrates

Directional link strokes model two operational directions on one physical link. Use them when one adjacency has independent telemetry for each direction and duplicate links would misrepresent the topology.

## Expected Result

The live viewport should render "Directional link strokes" without blocking diagnostics. It should show: One physical link can show two independently styled traffic directions. The test metadata expects `graphNodes`: `2`, `minVisibleEdges`: `1`.

## What To Inspect

- Inspect `graph.links` for endpoint IDs and labels.
- Compare line, arrow, label, and curve style keys in the stylesheet.

## Use When

Use this pattern when link readability, routing, arrowheads, or edge labels matter.

=== "Live Viewport"

    ```topoviewer
    topology: ../../../examples/edges/directional-link-strokes/topology.yaml
    stylesheet: ../../../examples/edges/directional-link-strokes/stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Directional link strokes
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/edges/directional-link-strokes/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/edges/directional-link-strokes/stylesheet.yaml"
    ```
