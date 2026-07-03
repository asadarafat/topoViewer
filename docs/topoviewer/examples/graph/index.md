# Graph

These examples document the graph behaviors from the canonical TopoViewer test-case catalog. Each section is generated from one test case and keeps the live viewport, topology YAML, and stylesheet YAML together.

## Graph basic

### What This Demonstrates

A minimal TopoViewer graph starts with named nodes and named links. Keep topology facts in `graph.nodes` and `graph.links`; let the stylesheet decide how those facts are presented.

### Expected Result

The live viewport should render "Graph basic" without blocking diagnostics. It should show: A minimal graph with two nodes and one named link. The test metadata expects `graphNodes`: `2`, `minVisibleEdges`: `1`.

### What To Inspect

- Inspect `graph.nodes`, `graph.links`, and object labels.
- Check how the stylesheet turns semantic facts into visual presentation.

### Use When

Use this pattern when modeling the core semantic graph.

=== "Live Viewport"

    ```topoviewer
    topology: basic/topology.yaml
    stylesheet: basic/stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Graph basic
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/graph/basic/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/graph/basic/stylesheet.yaml"
    ```

## Labels and data

### What This Demonstrates

`labels` are for classification and selector matching. `data` carries facts like metrics, delay, loopback, or counters that tools can inspect without making the visual stylesheet brittle.

### Expected Result

The live viewport should render "Labels and data" without blocking diagnostics. It should show: Classification lives in `labels`; operational values live in `data`. The test metadata expects `graphNodes`: `2`, `minVisibleEdges`: `1`.

### What To Inspect

- Inspect `graph.nodes`, `graph.links`, and object labels.
- Check how the stylesheet turns semantic facts into visual presentation.

### Use When

Use this pattern when modeling the core semantic graph.

=== "Live Viewport"

    ```topoviewer
    topology: labels-and-data/topology.yaml
    stylesheet: labels-and-data/stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Labels and data
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/graph/labels-and-data/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/graph/labels-and-data/stylesheet.yaml"
    ```

## Parent and child nodes

### What This Demonstrates

Parent and child nodes model ownership without losing graph semantics. The child remains selectable and linkable, while the parent can auto-expand when child nesting is enabled.

### Expected Result

The live viewport should render "Parent and child nodes" without blocking diagnostics. It should show: Logical nodes can be nested inside physical parent nodes. The test metadata expects `graphNodes`: `4`, `minVisibleEdges`: `1`.

### What To Inspect

- Inspect `graph.nodes`, `graph.links`, and object labels.
- Check how the stylesheet turns semantic facts into visual presentation.

### Use When

Use this pattern when modeling the core semantic graph.

=== "Live Viewport"

    ```topoviewer
    topology: parent-child-nodes/topology.yaml
    stylesheet: parent-child-nodes/stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Parent and child nodes
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/graph/parent-child-nodes/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/graph/parent-child-nodes/stylesheet.yaml"
    ```
