---
hide:
  - toc
---

# Link grouping

## What This Demonstrates

Link grouping demonstrates threshold-based edge aggregation. Three transport links between the same two routers start as one summary link labeled `3 links`; click the summary link to reveal each member as a Cytoscape-style bundled Bezier edge. Use the explicit `Collapse 3 links` control to return to the summary without turning member-edge selection into a hidden toggle.

## Expected Result

The live viewport should render "Link grouping" without blocking diagnostics. It should show: Group parallel links by endpoint and layer when the count crosses a threshold. The test metadata expects `graphNodes`: `2`.

## What To Inspect

- Review the attention state in the live viewport and compare it with the optional Attention YAML tab.
- Check which objects stay prominent and which objects are dimmed, collapsed, or summarized.

## Use When

Use this pattern when a dense graph needs focus, dimming, aggregation, or label-priority behavior.

=== "Live Viewport"

    ```topoviewer
    topology: topology.yaml
    stylesheet: stylesheet.yaml
    height: 440px
    controls: true
    controlsOpen: false
    title: Link grouping
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/link-grouping/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/link-grouping/stylesheet.yaml"
    ```
