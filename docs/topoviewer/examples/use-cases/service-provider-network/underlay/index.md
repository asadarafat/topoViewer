---
hide:
  - toc
---

# Real network underlay

The underlay view shows only the physical routed core: PE and P routers, straight grey transport links, and metro/core regions. Service endpoints, route reflectors, BGP sessions, and service paths are hidden so the operator can inspect the physical topology without control-plane or service overlays.

## Expected Result

A provider underlay view that foregrounds transport capacity, media, and backup links.

## Try It

1. Copy the two YAML tabs into your own project. Select the same layers in the viewer: `underlay`.
2. In `graph.nodes.0` in topology.yaml, set `graph.nodes.0.labels.name` to `"Edge renamed"`.
3. Reload. The visible alias on ce-fra changes; its stable ID, relationships, and memberships remain unchanged.
4. Restore the original settings and reload to compare with the starting view.

=== "Live Viewport"

    ```topoviewer
    topology: ../../../integration/real-network-underlay/topology.yaml
    stylesheet: ../../../integration/real-network-underlay/stylesheet.yaml
    height: 520px
    controls: true
    controlsOpen: false
    title: Real network underlay
    selectedLayerIds:
      - underlay
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/integration/real-network-underlay/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/integration/real-network-underlay/stylesheet.yaml"
    ```
