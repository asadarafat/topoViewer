---
hide:
  - toc
---

# Kubernetes service map

## What This Demonstrates

This service-dependency example shows TopoViewer as infrastructure-diagram code
outside the network-provider domain. The topology models a small Kubernetes
application namespace, data services, and request/dependency edges while the
stylesheet controls icons, regions, labels, and visual hierarchy.

## Expected Result

The live viewport should render "Kubernetes service map" without blocking diagnostics. It should show: A non-network infrastructure example showing app services, data dependencies, namespaces, and runtime status. The test metadata expects `graphNodes`: `8`, `minVisibleEdges`: `8`, `minRegions`: `2`.

## What To Inspect

- Inspect the topology YAML for semantic objects.
- Inspect the stylesheet YAML for the visual contract.

## Use When

Use this pattern when documenting how TopoViewer fits into another system, dashboard, or operational workflow.

=== "Live Viewport"

    ```topoviewer
    topology: ../integration/kubernetes-service-map/topology.yaml
    stylesheet: ../integration/kubernetes-service-map/stylesheet.yaml
    height: 480px
    controls: true
    controlsOpen: false
    title: Kubernetes service map
    selectedLayerIds:
      - application
      - data
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/integration/kubernetes-service-map/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/integration/kubernetes-service-map/stylesheet.yaml"
    ```
