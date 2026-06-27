---
hide:
  - toc
---

# Image embed callout

## What This Demonstrates

Image embeds are allowed inside markdown when the URL is safe. This lets documentation diagrams include small symbols, screenshots, or badges without creating fake graph nodes.

## Expected Result

The live viewport should render "Image embed callout" without blocking diagnostics. It should show: Image embeds are allowed when the URL is safe. The test metadata expects `visibleCallouts`: `1`.

## What To Inspect

- Inspect `diagram.callouts` for visual notes that do not change graph semantics.
- Check the stylesheet rule that controls callout color, border, and text treatment.

## Use When

Use this pattern when the diagram needs explanatory annotations without changing graph semantics.

=== "Live Viewport"

    ```topoviewer
    topology: ../../../examples/callouts/image-embed/topology.yaml
    stylesheet: ../../../examples/callouts/image-embed/stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Image embed callout
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/callouts/image-embed/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/callouts/image-embed/stylesheet.yaml"
    ```
