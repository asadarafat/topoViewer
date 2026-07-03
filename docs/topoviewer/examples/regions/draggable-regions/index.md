---
hide:
  - toc
---

# Draggable regions

## What This Demonstrates

Regions can be interactive hulls. Setting `draggable: true` and `selectable: true` in the stylesheet makes the region behave like an editable scope object.

## Expected Result

The live viewport should render "Draggable regions" without blocking diagnostics. It should show: Regions can be selectable and draggable hulls. The test metadata expects `graphNodes`: `2`, `minVisibleEdges`: `1`, `minRegions`: `1`.

## What To Inspect

- Inspect `graph.regions` membership and label placement.
- Check padding and region style keys that prevent overlap with member nodes.

## Use When

Use this pattern when grouping nodes into sites, racks, pods, domains, or ownership boundaries.

=== "Live Viewport"

    ```topoviewer
    topology: topology.yaml
    stylesheet: stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Draggable regions
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/regions/draggable-regions/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/regions/draggable-regions/stylesheet.yaml"
    ```
