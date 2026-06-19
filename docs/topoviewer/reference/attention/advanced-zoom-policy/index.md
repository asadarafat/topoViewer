---
hide:
  - toc
---

# Advanced zoom policy

Advanced zoom policy is an optional host-controlled behavior for map-style overview/detail transitions. The recommended operator workflow is still explicit: click an aggregate summary to expand it, then click the expanded region hull or parent object to collapse it. Use zoom thresholds only when the embedding experience intentionally wants detail to follow viewport scale.

=== "Live Viewport"

    ```topoviewer
    topology: ../../../examples/attention/advanced-zoom-policy/topology.yaml
    stylesheet: ../../../examples/attention/advanced-zoom-policy/stylesheet.yaml
    height: 500px
    controls: true
    controlsOpen: false
    title: Advanced zoom policy
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/advanced-zoom-policy/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/advanced-zoom-policy/stylesheet.yaml"
    ```
