---
hide:
  - toc
---

# Aggregate badge and status

## What This Demonstrates

Aggregate badge and status defaults make a collapsed group useful before drill-down. The summary node shows the hidden member count as a badge and the worst member severity as a status marker.

## Expected Result

The live viewport should render "Aggregate badge and status" without blocking diagnostics. It should show: Collapsed aggregate summaries can expose hidden member count and worst severity as compact node cues. The test metadata expects `graphNodes`: `2`, `minVisibleEdges`: `1`.

## What To Inspect

- Review the attention state in the live viewport and compare it with the optional Attention YAML tab.
- Check which objects stay prominent and which objects are dimmed, collapsed, or summarized.

## Use When

Use this pattern when a dense graph needs focus, dimming, aggregation, or label-priority behavior.

=== "Live Viewport"

    ```topoviewer
    topology: topology.yaml
    stylesheet: stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Aggregate badge and status
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/aggregate-badge-status/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/aggregate-badge-status/stylesheet.yaml"
    ```
