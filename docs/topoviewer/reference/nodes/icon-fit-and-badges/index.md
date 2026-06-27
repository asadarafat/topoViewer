---
hide:
  - toc
---

# Icon fit and badges

## What This Demonstrates

Icon fit, badges, and status markers let a small node carry asset, count, and health cues. Use badges for compact values and status markers for color-coded state.

`iconFit` accepts `contain`, `cover`, and `fill`. This example uses the same wide SVG in a circular node for all three nodes: `contain` preserves the whole SVG with empty space, `cover` crops the wide SVG to fill the circular node body, and `fill` stretches the SVG across the circular node body. The demo SVG opts into stretching with `preserveAspectRatio="none"` so the `fill` behavior is visible.

## Expected Result

The live viewport should render "Icon fit and badges" without blocking diagnostics. It should show: Icon fit, badges, and status markers add compact node-level signals. The test metadata expects `graphNodes`: `3`, `minVisibleEdges`: `2`.

## What To Inspect

- Inspect node labels, data, icon definitions, and body shape settings.
- Compare label, badge, status, icon, border, and underlay style keys.

## Use When

Use this pattern when node identity, iconography, labels, status, or shape treatment matters.

=== "Live Viewport"

    ```topoviewer
    topology: ../../../examples/nodes/icon-fit-and-badges/topology.yaml
    stylesheet: ../../../examples/nodes/icon-fit-and-badges/stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Icon fit and badges
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/nodes/icon-fit-and-badges/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/nodes/icon-fit-and-badges/stylesheet.yaml"
    ```
