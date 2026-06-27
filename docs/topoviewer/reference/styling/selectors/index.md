---
hide:
  - toc
---

# Selector styling

## What This Demonstrates

Selector styling is the core authoring contract. Topology authors classify objects once; visual rules then match by kind, id, labels, or data.

## Expected Result

The live viewport should render "Selector styling" without blocking diagnostics. It should show: Selector rules classify objects by kind, id, labels, or data. The test metadata expects `graphNodes`: `2`, `minVisibleEdges`: `1`.

## What To Inspect

- Inspect selector order and the style keys applied by each rule.
- Compare broad defaults with more specific label or data selectors.

## Use When

Use this pattern when building reusable visual rules from labels and data.

=== "Live Viewport"

    ```topoviewer
    topology: ../../../examples/styling/selectors/topology.yaml
    stylesheet: ../../../examples/styling/selectors/stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Selector styling
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/styling/selectors/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/styling/selectors/stylesheet.yaml"
    ```
