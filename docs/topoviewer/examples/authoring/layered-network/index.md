---
hide:
  - toc
---

# Layered network authoring

## What This Demonstrates

The default compact Studio authoring fixture.

It combines underlay, BGP, service, and operations layers in one small topology so Studio and regression checks can exercise layer toggles, relationship editing, attention, and diagnostics without starting from an empty graph.

## Expected Result

The live viewport should render "Layered network authoring" without blocking diagnostics. It should show: A compact layered-network fixture for Studio, demos, and regression checks.

## What To Inspect

- Use the example as an authoring template in TopoViewer Studio.
- Apply changes and confirm the rendered viewport stays in sync with the source bundle.

## Use When

Use this pattern when building Browser or Desktop Studio authoring workflows.

=== "Live Viewport"

    ```topoviewer
    topology: topology.yaml
    stylesheet: stylesheet.yaml
    height: 520px
    controls: true
    controlsOpen: false
    title: Layered network authoring
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/authoring/layered-network/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/authoring/layered-network/stylesheet.yaml"
    ```
