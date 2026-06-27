---
hide:
  - toc
---

# Graph basic

## What This Demonstrates

A minimal TopoViewer graph starts with named nodes and named links. Keep topology facts in `graph.nodes` and `graph.links`; let the stylesheet decide how those facts are presented.

## Expected Result

The live viewport should render "Graph basic" without blocking diagnostics. It should show: A minimal graph with two nodes and one named link. The test metadata expects `graphNodes`: `2`, `minVisibleEdges`: `1`.

## What To Inspect

- Inspect `graph.nodes`, `graph.links`, and object labels.
- Check how the stylesheet turns semantic facts into visual presentation.

## Use When

Use this pattern when modeling the core semantic graph.

=== "Live Viewport"

    ```topoviewer
    topology: ../../../examples/graph/basic/topology.yaml
    stylesheet: ../../../examples/graph/basic/stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Graph basic
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/graph/basic/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/graph/basic/stylesheet.yaml"
    ```
