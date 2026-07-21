---
hide:
  - toc
---

# Two-dimensional shapes

## What This Demonstrates

2D shapes are annotation primitives. They remain separate from graph nodes, while topology labels provide stable selector facts and the stylesheet owns visual geometry and dimensions.

## Expected Result

The live viewport should render "Two-dimensional shapes" without blocking diagnostics. It should show: 2D geometry primitives are diagram objects, not graph facts. The test metadata expects `shapes`: `14`.

## What To Inspect

- Inspect `diagram.shapes` and confirm they are visual explanation objects, not graph facts.
- Check shape geometry, fill, stroke, z-index, and label behavior.

## Use When

Use this pattern when adding visual explanation objects around a graph.

=== "Live Viewport"

    ```topoviewer
    topology: topology.yaml
    stylesheet: stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Two-dimensional shapes
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/shapes/two-dimensional/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/shapes/two-dimensional/stylesheet.yaml"
    ```
