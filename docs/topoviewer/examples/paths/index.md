# Paths

These examples document the paths behaviors from the canonical TopoViewer test-case catalog. Each section is generated from one test case and keeps the live viewport, topology YAML, and stylesheet YAML together.

## Sequenced path

### What This Demonstrates

A sequenced path is more than a link: it records the ordered nodes that the logical path traverses. Rendering expands the sequence into path segments.

### Expected Result

The live viewport should render "Sequenced path" without blocking diagnostics. It should show: A path sequence models ordered traversal through graph nodes. The test metadata expects `graphNodes`: `3`, `minVisibleEdges`: `2`.

### What To Inspect

- Inspect `graph.paths` and the nodes or links they traverse.
- Check lane, pipe, label, and arrow styling for service-path readability.

### Use When

Use this pattern when visualizing service paths, dependency paths, or multi-hop routes.

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

### What This Demonstrates

Stitched service paths model access-to-core-to-access behavior. The child endpoints remain inside AGG nodes, while the service lane is stitched into every segment of the parent transport path.

### Expected Result

The live viewport should render "Stitched child path" without blocking diagnostics. It should show: A child service path can stitch from child endpoints into a parent transport path. The test metadata expects `graphNodes`: `7`, `minVisibleEdges`: `1`.

### What To Inspect

- Inspect `graph.paths` and the nodes or links they traverse.
- Check lane, pipe, label, and arrow styling for service-path readability.

### Use When

Use this pattern when visualizing service paths, dependency paths, or multi-hop routes.

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
