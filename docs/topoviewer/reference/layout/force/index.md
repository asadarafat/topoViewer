---
hide:
  - toc
---

# Force layout

## What This Demonstrates

Force layout is auto-layout assistance. It is useful when topology data exists but the author does not want to maintain coordinates by hand.

## Expected Result

The live viewport should render "Force layout" without blocking diagnostics. It should show: Force layout computes positions when the author omits coordinates. The test metadata expects `graphNodes`: `5`, `minVisibleEdges`: `5`.

## What To Inspect

- Inspect `layout` options and node positions.
- Check whether positions are authored manually, inferred, or preserved by layout settings.

## Use When

Use this pattern when positions should be repeatable, inferred, or constrained by topology structure.

=== "Live Viewport"

    ```topoviewer
    topology: ../../../examples/layout/force/topology.yaml
    stylesheet: ../../../examples/layout/force/stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Force layout
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/layout/force/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/layout/force/stylesheet.yaml"
    ```
