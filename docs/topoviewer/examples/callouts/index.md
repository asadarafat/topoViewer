# Callouts

These examples document the callouts behaviors from the canonical TopoViewer test-case catalog. Each section is generated from one test case and keeps the live viewport, topology YAML, and stylesheet YAML together.

## Markdown callouts

### What This Demonstrates

Callout markdown supports headings, bullets, bold, underline, strike-through, inline code, links, and safe images. Use it for explanation, not for graph identity.

### Expected Result

The live viewport should render "Markdown callouts" without blocking diagnostics. It should show: Callout bodies support markdown, inline formatting, and images. The test metadata expects `graphNodes`: `1`, `visibleCallouts`: `1`.

### What To Inspect

- Inspect `diagram.callouts` for visual notes that do not change graph semantics.
- Check the stylesheet rule that controls callout color, border, and text treatment.

### Use When

Use this pattern when the diagram needs explanatory annotations without changing graph semantics.

=== "Live Viewport"

    ```topoviewer
    topology: markdown/topology.yaml
    stylesheet: markdown/stylesheet.yaml
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

## Pins and leaders

### What This Demonstrates

Pins give leaders exact attachment points. This matters when a diagram has bars, ports, SAPs, or physical slots where center-point attachment is misleading.

### Expected Result

The live viewport should render "Pins and leaders" without blocking diagnostics. It should show: Leaders can attach to named pins instead of object centers. The test metadata expects `graphNodes`: `1`, `shapes`: `1`, `visibleCallouts`: `1`, `minVisibleEdges`: `2`.

### What To Inspect

- Inspect `diagram.callouts` for visual notes that do not change graph semantics.
- Check the stylesheet rule that controls callout color, border, and text treatment.

### Use When

Use this pattern when the diagram needs explanatory annotations without changing graph semantics.

=== "Live Viewport"

    ```topoviewer
    topology: pins-and-leaders/topology.yaml
    stylesheet: pins-and-leaders/stylesheet.yaml
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

## Image embed callout

### What This Demonstrates

Image embeds are allowed inside markdown when the URL is safe. This lets documentation diagrams include small symbols, screenshots, or badges without creating fake graph nodes.

### Expected Result

The live viewport should render "Image embed callout" without blocking diagnostics. It should show: Image embeds are allowed when the URL is safe. The test metadata expects `visibleCallouts`: `1`.

### What To Inspect

- Inspect `diagram.callouts` for visual notes that do not change graph semantics.
- Check the stylesheet rule that controls callout color, border, and text treatment.

### Use When

Use this pattern when the diagram needs explanatory annotations without changing graph semantics.

=== "Live Viewport"

    ```topoviewer
    topology: image-embed/topology.yaml
    stylesheet: image-embed/stylesheet.yaml
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
