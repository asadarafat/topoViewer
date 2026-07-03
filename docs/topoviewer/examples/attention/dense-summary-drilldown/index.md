---
hide:
  - toc
---

# Dense summary drill-down

## What This Demonstrates

Dense summary drill-down keeps a busy topology useful without making zoom decide what the operator meant. The overview shows one summary per metro, including hidden node count, link count, and worst severity. The PE full mesh between metros is represented as counted aggregate links instead of a pile of individual transport links. Click a metro summary to inspect that region while the rest of the topology stays compressed; drag the expanded region hull to reposition its members, or click the hull to collapse it again.

## Expected Result

The live viewport should render "Dense summary drill-down" without blocking diagnostics. It should show: Keep dense metro topologies readable with summary nodes, counted full-mesh links, and explicit click-to-expand drill-down. The test metadata expects `graphNodes`: `3`, `minVisibleEdges`: `3`, `minRegions`: `0`.

## What To Inspect

- Review the attention state in the live viewport and compare it with the optional Attention YAML tab.
- Check which objects stay prominent and which objects are dimmed, collapsed, or summarized.

## Use When

Use this pattern when a dense graph needs focus, dimming, aggregation, or label-priority behavior.

=== "Live Viewport"

    ```topoviewer
    topology: topology.yaml
    stylesheet: stylesheet.yaml
    height: 560px
    controls: true
    controlsOpen: false
    title: Dense summary drill-down
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/dense-summary-drilldown/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/dense-summary-drilldown/stylesheet.yaml"
    ```
