# Shapes

These examples document the shapes behaviors from the canonical TopoViewer test-case catalog. Each section is generated from one test case and keeps the live viewport, topology YAML, and stylesheet YAML together.

## Two-dimensional shapes

### What This Demonstrates

2D shapes are geometry-only primitives. They are deliberately separate from graph nodes so decorative geometry does not pollute topology truth.

### Expected Result

The live viewport should render "Two-dimensional shapes" without blocking diagnostics. It should show: 2D geometry primitives are diagram objects, not graph facts. The test metadata expects `shapes`: `14`.

### What To Inspect

- Inspect `diagram.shapes` and confirm they are visual explanation objects, not graph facts.
- Check shape geometry, fill, stroke, z-index, and label behavior.

### Use When

Use this pattern when adding visual explanation objects around a graph.

=== "Live Viewport"

    ```topoviewer
    topology: two-dimensional/topology.yaml
    stylesheet: two-dimensional/stylesheet.yaml
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

## Three-dimensional shapes

### What This Demonstrates

3D shapes cover the common diagram metaphors: cube, cuboid, sphere, cone, cylinder, pyramid, and prism. Use callouts when text needs to sit near them.

### Expected Result

The live viewport should render "Three-dimensional shapes" without blocking diagnostics. It should show: 3D geometry primitives are available for common diagram metaphors. The test metadata expects `shapes`: `7`.

### What To Inspect

- Inspect `diagram.shapes` and confirm they are visual explanation objects, not graph facts.
- Check shape geometry, fill, stroke, z-index, and label behavior.

### Use When

Use this pattern when adding visual explanation objects around a graph.

=== "Live Viewport"

    ```topoviewer
    topology: three-dimensional/topology.yaml
    stylesheet: three-dimensional/stylesheet.yaml
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

## Shape rotation

### What This Demonstrates

Rotation can be authored on the shape itself or assigned through a selector rule. Text remains a separate callout concern.

### Expected Result

The live viewport should render "Shape rotation" without blocking diagnostics. It should show: Shape geometry can be rotated directly or through a stylesheet rule. The test metadata expects `shapes`: `3`.

### What To Inspect

- Inspect `diagram.shapes` and confirm they are visual explanation objects, not graph facts.
- Check shape geometry, fill, stroke, z-index, and label behavior.

### Use When

Use this pattern when adding visual explanation objects around a graph.

=== "Live Viewport"

    ```topoviewer
    topology: rotation/topology.yaml
    stylesheet: rotation/stylesheet.yaml
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
