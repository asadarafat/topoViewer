---
hide:
  - toc
---

# Border, outline, and underlay

## What This Demonstrates

Border, outline, and underlay styles create operational emphasis without changing the topology. Warning and critical nodes stand out through stroke pattern, outline, and underlay while the normal peer stays visually quiet.

## Expected Result

The live viewport should render "Border, outline, and underlay" without blocking diagnostics. It should show: Node border, outline, and underlay controls provide operational emphasis without changing graph facts. The test metadata expects `graphNodes`: `3`, `minVisibleEdges`: `2`.

## What To Inspect

- Inspect node labels, data, icon definitions, and body shape settings.
- Compare label, badge, status, icon, border, and underlay style keys.

## Use When

Use this pattern when node identity, iconography, labels, status, or shape treatment matters.

=== "Live Viewport"

    ```topoviewer
    topology: ../../../examples/nodes/border-outline-underlay/topology.yaml
    stylesheet: ../../../examples/nodes/border-outline-underlay/stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Border, outline, and underlay
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/nodes/border-outline-underlay/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/nodes/border-outline-underlay/stylesheet.yaml"
    ```
