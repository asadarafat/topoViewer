---
hide:
  - toc
---

# Region focus

Region focus uses `graph.regions[].members` as the declarative grouping source. The attention query focuses the access metro region, so its member nodes become prominent while the PE outside the region and the surrounding links stay as dimmed context.

=== "Live Viewport"

    ```topoviewer
    topology: ../../../examples/attention/region-focus/topology.yaml
    stylesheet: ../../../examples/attention/region-focus/stylesheet.yaml
    height: 460px
    controls: true
    controlsOpen: false
    title: Region focus
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/region-focus/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/region-focus/stylesheet.yaml"
    ```
