---
hide:
  - toc
---

# Three-dimensional shapes

3D shapes cover the common diagram metaphors: cube, cuboid, sphere, cone, cylinder, pyramid, and prism. Topology labels classify each primitive and stylesheet selectors own its geometry and dimensions. Use callouts when text needs to sit near them.

These are illustrative vector symbols, not dimensioned engineering projections.
Dashed edges indicate hidden boundaries; the sphere’s rings indicate curvature.
Circles, spheres, squares and cubes preserve aspect ratio when resized.

## Expected Result

3D geometry primitives are available for common diagram metaphors.

## Try It

1. Copy the two YAML tabs into your own project.
2. In the `shape` rule in stylesheet.yaml, set `geometry` to `"cuboid"`.
3. Reload. The selected annotation uses cuboid geometry; this remains an explanatory metaphor.
4. Restore the original settings and reload to compare with the starting view.

=== "Live Viewport"

    ```topoviewer
    topology: topology.yaml
    stylesheet: stylesheet.yaml
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
