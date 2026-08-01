---
hide:
  - toc
---

# Attention workflow

## What This Demonstrates

A Studio authoring fixture for editing attention behavior against a small multi-layer service topology.

Use it to exercise object focus, path focus, dense link grouping, and region aggregation.

## Expected Result

The live viewport should render "Attention workflow" without blocking diagnostics. It should show: A Studio fixture for editing attention focus, aggregation, and link grouping.

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
    title: Attention workflow
    selectedLayerIds:
      - underlay
      - service
      - operations
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/authoring/attention-workflow/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/authoring/attention-workflow/stylesheet.yaml"
    ```
