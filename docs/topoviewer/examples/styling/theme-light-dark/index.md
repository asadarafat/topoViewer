---
hide:
  - toc
---

# Light and dark theme variables

## What This Demonstrates

Theme-aware examples should use CSS variables so the same diagram follows MkDocs Material light and dark mode without duplicating the topology.

## Expected Result

The live viewport should render "Light and dark theme variables" without blocking diagnostics. It should show: Theme-aware styles should use TopoViewer CSS variables. The test metadata expects `graphNodes`: `2`, `minVisibleEdges`: `1`.

## What To Inspect

- Inspect selector order and the style keys applied by each rule.
- Compare broad defaults with more specific label or data selectors.

## Use When

Use this pattern when building reusable visual rules from labels and data.

=== "Live Viewport"

    ```topoviewer
    topology: topology.yaml
    stylesheet: stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Light and dark theme variables
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/styling/theme-light-dark/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/styling/theme-light-dark/stylesheet.yaml"
    ```
