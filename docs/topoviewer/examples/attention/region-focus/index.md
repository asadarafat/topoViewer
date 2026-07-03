---
hide:
  - toc
---

# Region focus

## What This Demonstrates

Region focus uses `graph.regions[].members` as the declarative grouping source. The attention query focuses the access metro region, so its member nodes become prominent while the PE outside the region and the surrounding links stay as dimmed context.

## Expected Result

The live viewport should render "Region focus" without blocking diagnostics. It should show: Focus a region and its member nodes while preserving surrounding context. The test metadata expects `graphNodes`: `4`, `minVisibleEdges`: `3`, `minRegions`: `1`.

## What To Inspect

- Review the attention state in the live viewport and compare it with the optional Attention YAML tab.
- Check which objects stay prominent and which objects are dimmed, collapsed, or summarized.

## Use When

Use this pattern when a dense graph needs focus, dimming, aggregation, or label-priority behavior.

=== "Live Viewport"

    ```topoviewer
    topology: topology.yaml
    stylesheet: stylesheet.yaml
    height: 460px
    controls: true
    controlsOpen: false
    title: Region focus
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/region-focus/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/region-focus/stylesheet.yaml"
    ```
