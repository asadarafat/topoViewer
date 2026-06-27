---
hide:
  - toc
---

# Overlapping regions

## What This Demonstrates

Overlapping regions are important for network diagrams because some routers, such as ABRs, belong to two scopes at once. R05 is intentionally inside both IS-IS L1 and IS-IS L2.

## Expected Result

The live viewport should render "Overlapping regions" without blocking diagnostics. It should show: A shared node can be a member of multiple regions. The test metadata expects `graphNodes`: `3`, `minVisibleEdges`: `1`, `minRegions`: `3`.

## What To Inspect

- Inspect `graph.regions` membership and label placement.
- Check padding and region style keys that prevent overlap with member nodes.

## Use When

Use this pattern when grouping nodes into sites, racks, pods, domains, or ownership boundaries.

=== "Live Viewport"

    ```topoviewer
    topology: ../../../examples/regions/overlapping-regions/topology.yaml
    stylesheet: ../../../examples/regions/overlapping-regions/stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Overlapping regions
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/regions/overlapping-regions/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/regions/overlapping-regions/stylesheet.yaml"
    ```
