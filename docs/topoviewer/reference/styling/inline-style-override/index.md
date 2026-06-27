---
hide:
  - toc
---

# Inline style override

## What This Demonstrates

Inline style is an escape hatch. Use it sparingly for one-off emphasis; reusable visual policy still belongs in the stylesheet.

## Expected Result

The live viewport should render "Inline style override" without blocking diagnostics. It should show: Inline `style` overrides are local escape hatches on individual objects. The test metadata expects `graphNodes`: `2`, `minVisibleEdges`: `1`.

## What To Inspect

- Inspect selector order and the style keys applied by each rule.
- Compare broad defaults with more specific label or data selectors.

## Use When

Use this pattern when building reusable visual rules from labels and data.

=== "Live Viewport"

    ```topoviewer
    topology: ../../../examples/styling/inline-style-override/topology.yaml
    stylesheet: ../../../examples/styling/inline-style-override/stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Inline style override
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/styling/inline-style-override/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/styling/inline-style-override/stylesheet.yaml"
    ```
