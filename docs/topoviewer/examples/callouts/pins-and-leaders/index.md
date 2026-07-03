---
hide:
  - toc
---

# Pins and leaders

## What This Demonstrates

Pins give leaders exact attachment points. This matters when a diagram has bars, ports, SAPs, or physical slots where center-point attachment is misleading.

## Expected Result

The live viewport should render "Pins and leaders" without blocking diagnostics. It should show: Leaders can attach to named pins instead of object centers. The test metadata expects `graphNodes`: `1`, `shapes`: `1`, `visibleCallouts`: `1`, `minVisibleEdges`: `2`.

## What To Inspect

- Inspect `diagram.callouts` for visual notes that do not change graph semantics.
- Check the stylesheet rule that controls callout color, border, and text treatment.

## Use When

Use this pattern when the diagram needs explanatory annotations without changing graph semantics.

=== "Live Viewport"

    ```topoviewer
    topology: topology.yaml
    stylesheet: stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Pins and leaders
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/callouts/pins-and-leaders/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/callouts/pins-and-leaders/stylesheet.yaml"
    ```
