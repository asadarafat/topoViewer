---
hide:
  - toc
---

# Labels and data

## What This Demonstrates

`labels` are for classification and selector matching. `data` carries facts like metrics, delay, loopback, or counters that tools can inspect without making the visual stylesheet brittle.

## Expected Result

The live viewport should render "Labels and data" without blocking diagnostics. It should show: Classification lives in `labels`; operational values live in `data`. The test metadata expects `graphNodes`: `2`, `minVisibleEdges`: `1`.

## What To Inspect

- Inspect `graph.nodes`, `graph.links`, and object labels.
- Check how the stylesheet turns semantic facts into visual presentation.

## Use When

Use this pattern when modeling the core semantic graph.

=== "Live Viewport"

    ```topoviewer
    topology: topology.yaml
    stylesheet: stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Labels and data
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/graph/labels-and-data/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/graph/labels-and-data/stylesheet.yaml"
    ```
