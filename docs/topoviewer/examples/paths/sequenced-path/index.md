---
hide:
  - toc
---

# Sequenced path

## What This Demonstrates

A sequenced path is more than a link: it records the ordered nodes that the logical path traverses. Rendering expands the sequence into path segments.

## Expected Result

The live viewport should render "Sequenced path" without blocking diagnostics. It should show: A path sequence models ordered traversal through graph nodes. The test metadata expects `graphNodes`: `3`, `minVisibleEdges`: `2`.

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
    title: Sequenced path
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/paths/sequenced-path/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/paths/sequenced-path/stylesheet.yaml"
    ```
