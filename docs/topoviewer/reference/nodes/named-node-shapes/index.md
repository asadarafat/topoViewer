---
hide:
  - toc
---

# Named node shapes

Node shape is presentation policy. Use stylesheet selectors to map graph labels such as role or device type to distinct node bodies while keeping topology facts in `graph.nodes` and `graph.links`.

=== "Live Viewport"

    ```topoviewer
    topology: ../../../examples/nodes/named-node-shapes/topology.yaml
    stylesheet: ../../../examples/nodes/named-node-shapes/stylesheet.yaml
    height: 440px
    controls: true
    controlsOpen: false
    title: Named node shapes
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/nodes/named-node-shapes/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/nodes/named-node-shapes/stylesheet.yaml"
    ```
