---
hide:
  - toc
---

# Nested regions

## What This Demonstrates

Nested regions let broad domains contain narrower regions. In this case the AS region contains an IS-IS L1 region and the member routers.

## Expected Result

The live viewport should render "Nested regions" without blocking diagnostics. It should show: Regions can be nested so broad domains contain smaller domains. The test metadata expects `graphNodes`: `3`, `minVisibleEdges`: `1`, `minRegions`: `2`.

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
    title: Nested regions
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/regions/nested-regions/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/regions/nested-regions/stylesheet.yaml"
    ```
