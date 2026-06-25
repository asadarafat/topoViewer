---
hide:
  - toc
---

# Attention workflow

An authoring harness template for editing attention behavior against a small multi-layer service topology.

Use it to exercise object focus, path focus, dense link grouping, and region aggregation from the browser harness.

=== "Live Viewport"

    ```topoviewer
    topology: ../../../examples/harness/attention-workflow/topology.yaml
    stylesheet: ../../../examples/harness/attention-workflow/stylesheet.yaml
    height: 520px
    controls: true
    controlsOpen: false
    title: Attention workflow
    selectedLayerIds:
      - underlay
      - service
      - operations
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/harness/attention-workflow/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/harness/attention-workflow/stylesheet.yaml"
    ```
