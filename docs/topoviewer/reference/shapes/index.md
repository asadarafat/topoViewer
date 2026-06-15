# Shapes

These examples document the shapes behaviors from the canonical TopoViewer test-case catalog. Each section is generated from one test case and keeps the live viewport, topology YAML, and stylesheet YAML together.

## Two-dimensional shapes

2D shapes are geometry-only primitives. They are deliberately separate from graph nodes so decorative geometry does not pollute topology truth.

=== "Live Viewport"

    ```topoviewer
    topology: ../../examples/shapes/two-dimensional/topology.yaml
    stylesheet: ../../examples/shapes/two-dimensional/stylesheet.yaml
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

3D shapes cover the common diagram metaphors: cube, cuboid, sphere, cone, cylinder, pyramid, and prism. Use callouts when text needs to sit near them.

=== "Live Viewport"

    ```topoviewer
    topology: ../../examples/shapes/three-dimensional/topology.yaml
    stylesheet: ../../examples/shapes/three-dimensional/stylesheet.yaml
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

Rotation can be authored on the shape itself or assigned through a selector rule. Text remains a separate callout concern.

=== "Live Viewport"

    ```topoviewer
    topology: ../../examples/shapes/rotation/topology.yaml
    stylesheet: ../../examples/shapes/rotation/stylesheet.yaml
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
