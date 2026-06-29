---
hide:
  - toc
---

# Grafana telemetry call flow

## What This Demonstrates

The Grafana telemetry call flow documents how a mounted TopoViewer bundle becomes an operational dashboard overlay. It uses TopoViewer primitives instead of a text-only sequence diagram: YAML files, rule generation, Prometheus, Grafana data frames, mapper rules, and the rendered panel are all modeled as graph objects.

## Expected Result

The live viewport should render "Grafana telemetry call flow" without blocking diagnostics. It should show: A TopoViewer-native call-flow diagram for mounted YAML bundles, Prometheus rules, Grafana data frames, mapper rules, and runtime overlays. The test metadata expects `graphNodes`: `9`, `minVisibleEdges`: `9`, `minRegions`: `3`.

## What To Inspect

- Inspect the topology YAML for semantic objects.
- Inspect the stylesheet YAML for the visual contract.

## Use When

Use this pattern when documenting how TopoViewer fits into another system, dashboard, or operational workflow.

=== "Live Viewport"

    ```topoviewer
    topology: ../examples/integration/grafana-telemetry-call-flow/topology.yaml
    stylesheet: ../examples/integration/grafana-telemetry-call-flow/stylesheet.yaml
    height: 520px
    controls: true
    controlsOpen: false
    title: Grafana telemetry call flow
    selectedLayerIds:
      - authoring
      - normalization
      - runtime
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/integration/grafana-telemetry-call-flow/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/integration/grafana-telemetry-call-flow/stylesheet.yaml"
    ```
