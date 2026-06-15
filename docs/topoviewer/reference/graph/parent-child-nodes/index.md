---
hide:
  - toc
---

# Parent and child nodes

Parent and child nodes model ownership without losing graph semantics. The child remains selectable and linkable, while the parent can auto-expand when child nesting is enabled.

=== "Live Viewport"

    ```topoviewer
    topology: ../../../examples/graph/parent-child-nodes/topology.yaml
    stylesheet: ../../../examples/graph/parent-child-nodes/stylesheet.yaml
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
