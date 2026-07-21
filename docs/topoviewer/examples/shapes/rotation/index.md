---
hide:
  - toc
---

# Shape rotation

## What This Demonstrates

Shape geometry, dimensions, and rotation are stylesheet policy. The topology keeps stable shape identity, position, layers, and selector labels; text remains a separate annotation concern.

## Expected Result

The live viewport should render "Shape rotation" without blocking diagnostics. It should show: Shape geometry can be rotated directly or through a stylesheet rule. The test metadata expects `shapes`: `3`.

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
    title: Shape rotation
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/shapes/rotation/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/shapes/rotation/stylesheet.yaml"
    ```
