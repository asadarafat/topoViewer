# Service Provider Network

This example uses one compact service-provider topology and renders it five
ways: underlay, BGP, transport layer, service path, and failure view.

The point is not to create five unrelated diagrams. The point is that one set
of graph facts can answer five operational questions.

## Underlay

Transport capacity, media, and backup links are the primary signal.

=== "Live Viewport"

    ```topoviewer
    topology: examples/integration/real-network-underlay/topology.yaml
    stylesheet: examples/integration/real-network-underlay/stylesheet.yaml
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

## BGP

Route reflector sessions become the dominant objects while the underlay remains visible as context.

=== "Live Viewport"

    ```topoviewer
    topology: examples/integration/real-network-bgp/topology.yaml
    stylesheet: examples/integration/real-network-bgp/stylesheet.yaml
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

## Transport Layer

The programmed SR transport path is added on top of the BGP view so the forwarding intent is visible without losing control-plane context.

=== "Live Viewport"

    ```topoviewer
    topology: examples/integration/real-network-transport-layer/topology.yaml
    stylesheet: examples/integration/real-network-transport-layer/stylesheet.yaml
    height: 520px
    controls: true
    controlsOpen: false
    title: Real network transport layer
    selectedLayerIds:
      - underlay
      - bgp
      - transport
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/integration/real-network-transport-layer/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/integration/real-network-transport-layer/stylesheet.yaml"
    ```

## Service Path

The Payments L3VPN is added on top of the transport layer. Customer edge nodes and access links appear at the sides, while the service lane follows the SR transport carrier through the core.

=== "Live Viewport"

    ```topoviewer
    topology: examples/integration/real-network-service-path/topology.yaml
    stylesheet: examples/integration/real-network-service-path/stylesheet.yaml
    height: 520px
    controls: true
    controlsOpen: false
    title: Real network service path
    selectedLayerIds:
      - underlay
      - bgp
      - transport
      - service
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

## Failure View

Critical and major objects stay bright, healthy context stays visible but muted, and the impacted service path remains traceable.

=== "Live Viewport"

    ```topoviewer
    topology: examples/integration/real-network-failure-view/topology.yaml
    stylesheet: examples/integration/real-network-failure-view/stylesheet.yaml
    height: 520px
    controls: true
    controlsOpen: false
    title: Real network failure view
    selectedLayerIds:
      - underlay
      - bgp
      - transport
      - service
      - operations
    attention:
      query:
        data:
          severity: critical
        mode: dim-context
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/integration/real-network-failure-view/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/integration/real-network-failure-view/stylesheet.yaml"
    ```

=== "Attention YAML"

    ```yaml
    attention:
      query:
        data:
          severity: critical
        mode: dim-context
    ```
