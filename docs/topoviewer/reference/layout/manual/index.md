---
hide:
  - toc
---

# Manual layout

## What This Demonstrates

Manual layout means the author supplies coordinates. This is the right mode for diagrams where placement carries meaning.

## Expected Result

The live viewport should render "Manual layout" without blocking diagnostics. It should show: Manual layout preserves authored positions. The test metadata expects `graphNodes`: `3`, `minVisibleEdges`: `2`.

## What To Inspect

- Inspect `layout` options and node positions.
- Check whether positions are authored manually, inferred, or preserved by layout settings.

## Use When

Use this pattern when positions should be repeatable, inferred, or constrained by topology structure.

=== "Live Viewport"

    ```topoviewer
    topology: ../../../examples/layout/manual/topology.yaml
    stylesheet: ../../../examples/layout/manual/stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Manual layout
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/layout/manual/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/layout/manual/stylesheet.yaml"
    ```
