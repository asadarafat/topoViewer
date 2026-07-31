---
hide:
  - toc
---

# Tree layout

## What This Demonstrates

Tree layout arranges a directed hierarchy into deterministic levels without
requiring authored positions.

This example uses a service dependency tree with one disconnected component:

- link direction defines parent-to-child traversal
- sibling order is stable by object ID, independent of YAML array order
- `layout.tree.direction` controls the orientation
- bounded gaps keep disconnected components readable

Use `tree` for hierarchies and dependency views. Use `clos` for dense staged
fabrics, `force` for general graphs, and `manual` when placement is part of the
reviewed artifact.

## Expected Result

The live viewport should render "Tree layout" without blocking diagnostics. It should show: Tree layout computes deterministic levels for directed hierarchies and disconnected components. The test metadata expects `graphNodes`: `6`, `minVisibleEdges`: `4`.

## What To Inspect

- Inspect `layout` options and node positions.
- Check whether positions are authored manually, inferred, or preserved by layout settings.

## Use When

Use this pattern when positions should be repeatable, inferred, or constrained by topology structure.

=== "Live Viewport"

    ```topoviewer
    topology: topology.yaml
    stylesheet: stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Tree layout
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/layout/tree/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/layout/tree/stylesheet.yaml"
    ```
