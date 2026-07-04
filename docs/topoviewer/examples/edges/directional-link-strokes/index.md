---
hide:
  - toc
---

# Directional link strokes

## What This Demonstrates

Directional link strokes model two operational directions on one physical link.
Use them when one adjacency has independent telemetry for each direction and
duplicate links would misrepresent the topology.

The parent link still owns the stable topology identity and any endpoint port
labels. Each `linkDirection` inherits the parent link style, then applies
direction-specific overrides such as line color, arrow marker, dash pattern,
and direction label.

Use direction labels for vector values such as bandwidth or packet rate. Use
`sourceLabel` and `targetLabel` for physical ports. TopoViewer keeps arrows as
marker geometry and places endpoint, center, and direction labels with a shared
label placement pass so dense operational diagrams remain inspectable.

## Expected Result

The live viewport should render "Directional link strokes" without blocking diagnostics. It should show: One physical link can show two independently styled traffic directions. The test metadata expects `graphNodes`: `2`, `minVisibleEdges`: `1`.

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
