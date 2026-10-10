# Paths

Explore paths behavior with a live diagram and its two source files. Each example includes an edit to try in your own copy.

## Sequenced path

A sequenced path is more than a link: it records the ordered nodes that the logical path traverses. Rendering expands the sequence into path segments.

### Expected Result

A path sequence models ordered traversal through graph nodes.

### Try It

1. Copy the two YAML tabs into your own project.
2. In the `path[labels.protocol = "sr-te"]` rule in stylesheet.yaml, set `lineWidth` to `8`.
3. Reload. The ordered path is emphasized without changing the nodes in its sequence.
4. Restore the original settings and reload to compare with the starting view.

=== "Live Viewport"

    ```topoviewer
    topology: sequenced-path/topology.yaml
    stylesheet: sequenced-path/stylesheet.yaml
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

### Expected Result

A child service path can stitch from child endpoints into a parent transport path.

### Try It

1. Copy the two YAML tabs into your own project.
2. In the `path[labels.path = "service"]` rule in stylesheet.yaml, set `lineWidth` to `8`.
3. Reload. The child path lane becomes wider while keeping its parent route and endpoint stubs.
4. Restore the original settings and reload to compare with the starting view.

=== "Live Viewport"

    ```topoviewer
    topology: stitched-child-path/topology.yaml
    stylesheet: stitched-child-path/stylesheet.yaml
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
