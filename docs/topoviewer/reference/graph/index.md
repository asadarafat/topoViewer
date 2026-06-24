# Graph

These examples document the graph behaviors from the canonical TopoViewer test-case catalog. Each section is generated from one test case and keeps the live viewport, topology YAML, and stylesheet YAML together.

## Graph basic

A minimal TopoViewer graph starts with named nodes and named links. Keep topology facts in `graph.nodes` and `graph.links`; let the stylesheet decide how those facts are presented.

=== "Live Viewport"

    ```topoviewer
    topology: ../../examples/graph/basic/topology.yaml
    stylesheet: ../../examples/graph/basic/stylesheet.yaml
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

`labels` are for classification and selector matching. `data` carries facts like metrics, delay, loopback, or counters that tools can inspect without making the visual stylesheet brittle.

=== "Live Viewport"

    ```topoviewer
    topology: ../../examples/graph/labels-and-data/topology.yaml
    stylesheet: ../../examples/graph/labels-and-data/stylesheet.yaml
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

Parent and child nodes model ownership without losing graph semantics. The child remains selectable and linkable, while the parent can auto-expand when child nesting is enabled.

=== "Live Viewport"

    ```topoviewer
    topology: ../../examples/graph/parent-child-nodes/topology.yaml
    stylesheet: ../../examples/graph/parent-child-nodes/stylesheet.yaml
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

## CLOS 2-spine 4-leaf

A compact **2-spine, 4-leaf CLOS** fixture with manual layout.

- 2 spine nodes
- 4 leaf nodes
- 8 full-mesh fabric links (each leaf to both spines)

=== "Live Viewport"

    ```topoviewer
    topology: ../../examples/graph/clos-2spine-4leaf/topology.yaml
    stylesheet: ../../examples/graph/clos-2spine-4leaf/stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: CLOS 2-spine 4-leaf
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/graph/clos-2spine-4leaf/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/graph/clos-2spine-4leaf/stylesheet.yaml"
    ```
