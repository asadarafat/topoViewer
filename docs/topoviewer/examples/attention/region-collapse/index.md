---
hide:
  - toc
---

# Region collapse

## What This Demonstrates

Region collapse demonstrates progressive disclosure. The access metro region starts declaratively collapsed into one aggregate summary node; click the `Access metro` summary in the live viewport to expand the region and reveal its member nodes and internal links. Click the expanded region hull to collapse it back into the summary node.

## Expected Result

The live viewport should render "Region collapse" without blocking diagnostics. It should show: Collapse a region into an aggregate summary, then click it to expand member nodes. The test metadata expects `graphNodes`: `2`, `minVisibleEdges`: `1`.

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
    title: Region collapse
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/region-collapse/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/region-collapse/stylesheet.yaml"
    ```
