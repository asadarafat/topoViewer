---
hide:
  - toc
---

# Real network underlay

## What This Demonstrates

The underlay view shows only the physical routed core: PE and P routers, straight grey transport links, and metro/core regions. Service endpoints, route reflectors, BGP sessions, and service paths are hidden so the operator can inspect the physical topology without control-plane or service overlays.

## Expected Result

The live viewport should render "Real network underlay" without blocking diagnostics. It should show: A provider underlay view that foregrounds transport capacity, media, and backup links. The test metadata expects `graphNodes`: `4`, `minVisibleEdges`: `3`, `minRegions`: `3`.

## What To Inspect

- Inspect the topology YAML for semantic objects.
- Inspect the stylesheet YAML for the visual contract.

## Use When

Use this pattern when documenting a reusable TopoViewer behavior.

=== "Live Viewport"

    ```topoviewer
    topology: ../../examples/integration/real-network-underlay/topology.yaml
    stylesheet: ../../examples/integration/real-network-underlay/stylesheet.yaml
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
