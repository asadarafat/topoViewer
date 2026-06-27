---
hide:
  - toc
---

# Three-dimensional shapes

## What This Demonstrates

3D shapes cover the common diagram metaphors: cube, cuboid, sphere, cone, cylinder, pyramid, and prism. Use callouts when text needs to sit near them.

## Expected Result

The live viewport should render "Three-dimensional shapes" without blocking diagnostics. It should show: 3D geometry primitives are available for common diagram metaphors. The test metadata expects `shapes`: `7`.

## What To Inspect

- Inspect `diagram.shapes` and confirm they are visual explanation objects, not graph facts.
- Check shape geometry, fill, stroke, z-index, and label behavior.

## Use When

Use this pattern when adding visual explanation objects around a graph.

=== "Live Viewport"

    ```topoviewer
    topology: ../../../examples/shapes/three-dimensional/topology.yaml
    stylesheet: ../../../examples/shapes/three-dimensional/stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Three-dimensional shapes
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/shapes/three-dimensional/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/shapes/three-dimensional/stylesheet.yaml"
    ```
