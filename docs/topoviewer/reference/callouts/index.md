# Callouts

These examples document the callouts behaviors from the canonical TopoViewer test-case catalog. Each section is generated from one test case and keeps the live viewport, topology YAML, and stylesheet YAML together.

## Markdown callouts

Callout markdown supports headings, bullets, bold, underline, strike-through, inline code, links, and safe images. Use it for explanation, not for graph identity.

=== "Live Viewport"

    ```topoviewer
    topology: ../../examples/callouts/markdown/topology.yaml
    stylesheet: ../../examples/callouts/markdown/stylesheet.yaml
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

Pins give leaders exact attachment points. This matters when a diagram has bars, ports, SAPs, or physical slots where center-point attachment is misleading.

=== "Live Viewport"

    ```topoviewer
    topology: ../../examples/callouts/pins-and-leaders/topology.yaml
    stylesheet: ../../examples/callouts/pins-and-leaders/stylesheet.yaml
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

Image embeds are allowed inside markdown when the URL is safe. This lets documentation diagrams include small symbols, screenshots, or badges without creating fake graph nodes.

=== "Live Viewport"

    ```topoviewer
    topology: ../../examples/callouts/image-embed/topology.yaml
    stylesheet: ../../examples/callouts/image-embed/stylesheet.yaml
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
