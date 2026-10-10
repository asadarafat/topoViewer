---
hide:
  - toc
---

# Layered network authoring

The default compact Studio authoring fixture.

It combines underlay, BGP, service, and operations layers in one small topology so Studio and regression checks can exercise layer toggles, relationship editing, attention, and diagnostics without starting from an empty graph.

## Expected Result

A compact layered-network fixture for Studio, demos, and regression checks.

## Try It

1. Copy the two YAML tabs into your own project.
2. In `graph.nodes.0` in topology.yaml, set `graph.nodes.0.labels.name` to `"Edge renamed"`.
3. Reload. The visible alias on fra-pe changes; its stable ID, relationships, and memberships remain unchanged.
4. Restore the original settings and reload to compare with the starting view.

=== "Live Viewport"

    ```topoviewer
    topology: topology.yaml
    stylesheet: stylesheet.yaml
    height: 520px
    controls: true
    controlsOpen: false
    title: Layered network authoring
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/authoring/layered-network/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/authoring/layered-network/stylesheet.yaml"
    ```
