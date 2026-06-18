---
hide:
  - toc
---

# Parent and label collapse

Parent and label collapse shows the other aggregate group types. Service child nodes under `PE-1` collapse by parent-child relationship, and access nodes collapse by `labels.role: access`; clicking the `PE-1 services` summary expands only that parent-derived group.

=== "Live Viewport"

    ```topoviewer
    topology: ../../../examples/attention/parent-label-collapse/topology.yaml
    stylesheet: ../../../examples/attention/parent-label-collapse/stylesheet.yaml
    height: 500px
    controls: true
    controlsOpen: false
    title: Parent and label collapse
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/parent-label-collapse/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/parent-label-collapse/stylesheet.yaml"
    ```
