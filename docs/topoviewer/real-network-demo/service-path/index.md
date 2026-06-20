---
hide:
  - toc
---

# Real network service path

The service-path view answers the operator question "what does this customer service traverse?" The same graph now emphasizes the Payments L3VPN path from CE-FRA to CE-LON while non-service control-plane context stays muted.

=== "Live Viewport"

    ```topoviewer
    topology: ../../examples/integration/real-network-service-path/topology.yaml
    stylesheet: ../../examples/integration/real-network-service-path/stylesheet.yaml
    height: 520px
    controls: true
    controlsOpen: false
    title: Real network service path
    attention:
      query:
        pathIds:
          - payments-primary
        mode: dim-context
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/integration/real-network-service-path/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/integration/real-network-service-path/stylesheet.yaml"
    ```

=== "Attention YAML"

    ```yaml
    attention:
      query:
        pathIds:
          - payments-primary
        mode: dim-context
    ```
