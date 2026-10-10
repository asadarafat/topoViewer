---
hide:
  - toc
---

# Edge curve styles

Curve styles are presentation choices. The graph still says A connects to B/C/D/E; the stylesheet controls whether that relationship renders as straight, taxi, smooth-taxi, or unbundled-bezier.

## Expected Result

Different `curveStyle` values produce different edge routing models.

## Try It

1. Copy the two YAML tabs into your own project.
2. In the `link[labels.curve = "unbundled-bezier"]` rule in stylesheet.yaml, set `curveStyle` to `"straight"`.
3. Reload. The matching edge uses a direct route instead of its previous curve.
4. Restore the original settings and reload to compare with the starting view.

=== "Live Viewport"

    ```topoviewer
    topology: topology.yaml
    stylesheet: stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Edge curve styles
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/edges/curve-styles/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/edges/curve-styles/stylesheet.yaml"
    ```
