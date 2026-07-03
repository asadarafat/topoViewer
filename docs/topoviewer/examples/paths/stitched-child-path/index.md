---
hide:
  - toc
---

# Stitched child path

## What This Demonstrates

Stitched service paths model access-to-core-to-access behavior. The child endpoints remain inside AGG nodes, while the service lane is stitched into every segment of the parent transport path.

## Expected Result

The live viewport should render "Stitched child path" without blocking diagnostics. It should show: A child service path can stitch from child endpoints into a parent transport path. The test metadata expects `graphNodes`: `7`, `minVisibleEdges`: `1`.

## What To Inspect

- Inspect `graph.paths` and the nodes or links they traverse.
- Check lane, pipe, label, and arrow styling for service-path readability.

## Use When

Use this pattern when visualizing service paths, dependency paths, or multi-hop routes.

=== "Live Viewport"

    ```topoviewer
    topology: topology.yaml
    stylesheet: stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Stitched child path
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/paths/stitched-child-path/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/paths/stitched-child-path/stylesheet.yaml"
    ```
