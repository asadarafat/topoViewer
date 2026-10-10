# Callouts

Explore callouts behavior with a live diagram and its two source files. Each example includes an edit to try in your own copy.

## Markdown callouts

Callout markdown supports headings, bullets, bold, underline, strike-through, inline code, links, and safe images. Use it for explanation, not for graph identity.

### Expected Result

Callout bodies support markdown, inline formatting, and images.

### Try It

1. Copy the two YAML tabs into your own project.
2. In `diagram.callouts.0` in topology.yaml, set `diagram.callouts.0.markdown` to `"Inspect this object before proceeding."`.
3. Reload. The annotation text changes without creating or altering a graph relationship.
4. Restore the original settings and reload to compare with the starting view.

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

Pins give leaders exact attachment points. This matters when a diagram has bars, ports, SAPs, or physical slots where center-point attachment is misleading.

The SAP `service` pin faces PE1’s `west` pin. The access line approaches that
facing edge, while the note sits above it; neither leader crosses the router.
SAP means service access point.

### Expected Result

Leaders can attach to named pins instead of object centers.

### Try It

1. Copy the two YAML tabs into your own project.
2. In the `callout` rule in stylesheet.yaml, set `lineWidth` to `3`.
3. Reload. The leader becomes wider; its named pin attachment remains on the same object.
4. Restore the original settings and reload to compare with the starting view.

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

Image embeds are allowed inside markdown when the URL is safe. This lets documentation diagrams include small symbols, screenshots, or badges without creating fake graph nodes.

### Expected Result

Image embeds are allowed when the URL is safe.

### Try It

1. Copy the two YAML tabs into your own project.
2. In `diagram.callouts.0` in topology.yaml, set `diagram.callouts.0.markdown` to `"Inspect this object before proceeding."`.
3. Reload. The annotation text changes without creating or altering a graph relationship.
4. Restore the original settings and reload to compare with the starting view.

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
