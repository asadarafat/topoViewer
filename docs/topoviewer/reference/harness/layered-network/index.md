---
hide:
  - toc
---

# Layered network authoring

The default authoring harness template.

It combines underlay, BGP, service, and operations layers in one small topology so the harness can demonstrate layer toggles, relationship editing, attention, and diagnostics without starting from an empty graph.

=== "Live Viewport"

    ```topoviewer
    topology: ../../../examples/harness/layered-network/topology.yaml
    stylesheet: ../../../examples/harness/layered-network/stylesheet.yaml
    height: 520px
    controls: true
    controlsOpen: false
    title: Layered network authoring
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/harness/layered-network/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/harness/layered-network/stylesheet.yaml"
    ```
