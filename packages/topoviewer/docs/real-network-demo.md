# Real Network Demo

This demo uses one compact provider topology and renders it four ways: underlay, BGP, service path, and failure view. The point is not to create four unrelated diagrams. The point is that one set of graph facts can answer four operational questions.

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
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/integration/real-network-bgp/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/integration/real-network-bgp/stylesheet.yaml"
    ```

## Service Path

The Payments L3VPN path is focused so the traversed nodes and path segments stand out.

=== "Live Viewport"

    ```topoviewer
    topology: examples/integration/real-network-service-path/topology.yaml
    stylesheet: examples/integration/real-network-service-path/stylesheet.yaml
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
