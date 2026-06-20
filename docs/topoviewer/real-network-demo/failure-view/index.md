---
hide:
  - toc
---

# Real network failure view

The failure view turns operational state into attention. Critical and major objects stay bright, healthy context remains visible but muted, and the impacted service path is still traceable through the same underlying topology facts.

=== "Live Viewport"

    ```topoviewer
    topology: ../../examples/integration/real-network-failure-view/topology.yaml
    stylesheet: ../../examples/integration/real-network-failure-view/stylesheet.yaml
    height: 520px
    controls: true
    controlsOpen: false
    title: Real network failure view
    attention:
      query:
        data:
          severity: critical
        mode: dim-context
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/integration/real-network-failure-view/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/integration/real-network-failure-view/stylesheet.yaml"
    ```

=== "Attention YAML"

    ```yaml
    attention:
      query:
        data:
          severity: critical
        mode: dim-context
    ```
