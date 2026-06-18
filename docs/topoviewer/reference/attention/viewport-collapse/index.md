---
hide:
  - toc
---

# Viewport collapse

Viewport collapse demonstrates zoom-aware progressive disclosure. The topology starts zoomed out with two collapsed region summaries; zoom in to expand the regions and reveal the four member nodes. Zoom back out to collapse the regions into summaries again.

=== "Live Viewport"

    ```topoviewer
    topology: ../../../examples/attention/viewport-collapse/topology.yaml
    stylesheet: ../../../examples/attention/viewport-collapse/stylesheet.yaml
    height: 500px
    controls: true
    controlsOpen: false
    title: Viewport collapse
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/viewport-collapse/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/viewport-collapse/stylesheet.yaml"
    ```
