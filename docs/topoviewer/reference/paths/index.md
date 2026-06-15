# Paths

These examples document the paths behaviors from the canonical TopoViewer test-case catalog. Each section is generated from one test case and keeps the live viewport, topology YAML, and stylesheet YAML together.

## Sequenced path

A sequenced path is more than a link: it records the ordered nodes that the logical path traverses. Rendering expands the sequence into path segments.

=== "Live Viewport"

    ```topoviewer
    topology: ../../examples/paths/sequenced-path/topology.yaml
    stylesheet: ../../examples/paths/sequenced-path/stylesheet.yaml
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

## Stitched child path

Stitched service paths model access-to-core-to-access behavior. The child endpoints remain inside AGG nodes, while the service lane is stitched into every segment of the parent transport path.

=== "Live Viewport"

    ```topoviewer
    topology: ../../examples/paths/stitched-child-path/topology.yaml
    stylesheet: ../../examples/paths/stitched-child-path/stylesheet.yaml
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
