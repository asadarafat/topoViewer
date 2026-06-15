---
hide:
  - toc
---

# Light and dark theme variables

Theme-aware examples should use CSS variables so the same diagram follows MkDocs Material light and dark mode without duplicating the topology.

=== "Live Viewport"

    ```topoviewer
    topology: ../../../examples/styling/theme-light-dark/topology.yaml
    stylesheet: ../../../examples/styling/theme-light-dark/stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Light and dark theme variables
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/styling/theme-light-dark/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/styling/theme-light-dark/stylesheet.yaml"
    ```
