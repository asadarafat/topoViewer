---
hide:
  - toc
---

# Markdown callouts

Callout markdown supports headings, bullets, bold, underline, strike-through, inline code, links, and safe images. Use it for explanation, not for graph identity.

## Expected Result

Callout bodies support markdown, inline formatting, and images.

## Try It

1. Copy the two YAML tabs into your own project.
2. In `diagram.callouts.0` in topology.yaml, set `diagram.callouts.0.markdown` to `"Inspect this object before proceeding."`.
3. Reload. The annotation text changes without creating or altering a graph relationship.
4. Restore the original settings and reload to compare with the starting view.

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
