---
hide:
  - toc
---

# Real network BGP

The BGP view keeps the same topology but changes the question. The route reflector and PE sessions become the dominant objects, while transport links remain as context so the control plane is not detached from the network it describes.

=== "Live Viewport"

    ```topoviewer
    topology: ../../examples/integration/real-network-bgp/topology.yaml
    stylesheet: ../../examples/integration/real-network-bgp/stylesheet.yaml
    height: 520px
    controls: true
    controlsOpen: false
    title: Real network BGP
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/integration/real-network-bgp/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/integration/real-network-bgp/stylesheet.yaml"
    ```
