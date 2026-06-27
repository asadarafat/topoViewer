---
hide:
  - toc
---

# Parent and child nodes

## What This Demonstrates

Parent and child nodes model ownership without losing graph semantics. The child remains selectable and linkable, while the parent can auto-expand when child nesting is enabled.

## Expected Result

The live viewport should render "Parent and child nodes" without blocking diagnostics. It should show: Logical nodes can be nested inside physical parent nodes. The test metadata expects `graphNodes`: `4`, `minVisibleEdges`: `1`.

## What To Inspect

- Inspect `graph.nodes`, `graph.links`, and object labels.
- Check how the stylesheet turns semantic facts into visual presentation.

## Use When

Use this pattern when modeling the core semantic graph.

=== "Live Viewport"

    ```topoviewer
    topology: ../../../examples/graph/parent-child-nodes/topology.yaml
    stylesheet: ../../../examples/graph/parent-child-nodes/stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Parent and child nodes
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/graph/parent-child-nodes/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/graph/parent-child-nodes/stylesheet.yaml"
    ```
