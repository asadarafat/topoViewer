---
hide:
  - toc
---

# Real network BGP

The BGP view starts from the real network underlay and adds the route reflector plus PE-to-RR sessions. Transport links remain straight grey context, while the BGP overlay carries the control-plane question.

## Expected Result

A BGP view that makes route reflector sessions visible while keeping the underlay as context.

## Try It

1. Copy the two YAML tabs into your own project. Select the same layers in the viewer: `underlay`, `bgp`.
2. In `graph.nodes.0` in topology.yaml, set `graph.nodes.0.labels.name` to `"Edge renamed"`.
3. Reload. The visible alias on ce-fra changes; its stable ID, relationships, and memberships remain unchanged.
4. Restore the original settings and reload to compare with the starting view.

=== "Live Viewport"

    ```topoviewer
    topology: ../../../integration/real-network-bgp/topology.yaml
    stylesheet: ../../../integration/real-network-bgp/stylesheet.yaml
    height: 520px
    controls: true
    controlsOpen: false
    title: Real network BGP
    selectedLayerIds:
      - underlay
      - bgp
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/integration/real-network-bgp/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/integration/real-network-bgp/stylesheet.yaml"
    ```
