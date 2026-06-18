---
hide:
  - toc
---

# Region collapse

Region collapse demonstrates progressive disclosure. The access metro region starts declaratively collapsed into one aggregate summary node; click the `Access metro` summary in the live viewport to expand the region and reveal its member nodes and internal links. Click the expanded region hull to collapse it back into the summary node.

=== "Live Viewport"

    ```topoviewer
    topology: ../../../examples/attention/region-collapse/topology.yaml
    stylesheet: ../../../examples/attention/region-collapse/stylesheet.yaml
    height: 500px
    controls: true
    controlsOpen: false
    title: Region collapse
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/region-collapse/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/region-collapse/stylesheet.yaml"
    ```
