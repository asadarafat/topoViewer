---
hide:
  - toc
---

# Graph basic

A minimal TopoViewer graph starts with named nodes and named links. Keep topology facts in `graph.nodes` and `graph.links`; let the stylesheet decide how those facts are presented.

=== "Live Viewport"

    ```topoviewer
    topology: ../../../examples/graph/basic/topology.yaml
    stylesheet: ../../../examples/graph/basic/stylesheet.yaml
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
