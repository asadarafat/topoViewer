---
hide:
  - toc
---

# Real network BGP

The BGP view starts from the real network underlay and adds the route reflector plus PE-to-RR sessions. Transport links remain straight grey context, while the BGP overlay carries the control-plane question.

=== "Live Viewport"

    ```topoviewer
    topology: ../../examples/integration/real-network-bgp/topology.yaml
    stylesheet: ../../examples/integration/real-network-bgp/stylesheet.yaml
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
