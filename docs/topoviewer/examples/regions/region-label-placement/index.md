---
hide:
  - toc
---

# Region label placement

## What This Demonstrates

Region label placement keeps small or single-node regions readable. Use `labelPosition` and `labelMargin` in region styles to anchor the label on a region edge, then set `headerPadding`, `paddingX`, or `paddingY` in the same region stylesheet rule when an auto-fit hull needs reserved interior space.

## Expected Result

The live viewport should render "Region label placement" without blocking diagnostics. It should show: Region labels can be anchored around the hull with an explicit margin. The test metadata expects `graphNodes`: `2`, `minVisibleEdges`: `1`, `minRegions`: `2`.

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
    title: Region label placement
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/regions/region-label-placement/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/regions/region-label-placement/stylesheet.yaml"
    ```
