---
hide:
  - toc
---

# Hide context

Hide context mode is useful when context should be removed from the rendered view instead of muted. The topology marks two PE nodes with `labels.role: pe`; the attention query focuses that label and hides every non-matching node and link.

=== "Live Viewport"

    ```topoviewer
    topology: ../../../examples/attention/hide-context/topology.yaml
    stylesheet: ../../../examples/attention/hide-context/stylesheet.yaml
    height: 440px
    controls: true
    controlsOpen: false
    title: Hide context
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/hide-context/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/hide-context/stylesheet.yaml"
    ```
