---
hide:
  - toc
---

# Parent and label collapse

## What This Demonstrates

Parent and label collapse shows the other aggregate group types. Service child nodes under `PE-1` collapse by parent-child relationship, and access nodes collapse by `labels.role: access`; clicking the `PE-1 services` summary expands only that parent-derived group.

## Expected Result

The live viewport should render "Parent and label collapse" without blocking diagnostics. It should show: Collapse parent-child objects and label-defined groups into aggregate summaries. The test metadata expects `graphNodes`: `4`, `minVisibleEdges`: `3`.

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
    title: Parent and label collapse
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/parent-label-collapse/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/parent-label-collapse/stylesheet.yaml"
    ```
