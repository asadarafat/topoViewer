---
hide:
  - toc
---

# Advanced zoom policy

## What This Demonstrates

Advanced zoom policy is an optional host-controlled behavior for map-style overview/detail transitions. The recommended operator workflow is still explicit: click an aggregate summary to expand it, then click the expanded region hull or parent object to collapse it. Use zoom thresholds only when the embedding experience intentionally wants detail to follow viewport scale.

## Expected Result

The live viewport should render "Advanced zoom policy" without blocking diagnostics. It should show: Optionally bind aggregate expansion to zoom thresholds when a host needs map-style overview/detail transitions. The test metadata expects `graphNodes`: `2`, `minVisibleEdges`: `1`, `minRegions`: `0`.

## What To Inspect

- Review the attention state in the live viewport and compare it with the optional Attention YAML tab.
- Check which objects stay prominent and which objects are dimmed, collapsed, or summarized.

## Use When

Use this pattern when a dense graph needs focus, dimming, aggregation, or label-priority behavior.

=== "Live Viewport"

    ```topoviewer
    topology: topology.yaml
    stylesheet: stylesheet.yaml
    height: 500px
    controls: true
    controlsOpen: false
    title: Advanced zoom policy
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/advanced-zoom-policy/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/advanced-zoom-policy/stylesheet.yaml"
    ```
