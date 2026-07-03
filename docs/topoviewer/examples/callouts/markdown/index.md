---
hide:
  - toc
---

# Markdown callouts

## What This Demonstrates

Callout markdown supports headings, bullets, bold, underline, strike-through, inline code, links, and safe images. Use it for explanation, not for graph identity.

## Expected Result

The live viewport should render "Markdown callouts" without blocking diagnostics. It should show: Callout bodies support markdown, inline formatting, and images. The test metadata expects `graphNodes`: `1`, `visibleCallouts`: `1`.

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
    title: Markdown callouts
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/callouts/markdown/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/callouts/markdown/stylesheet.yaml"
    ```
