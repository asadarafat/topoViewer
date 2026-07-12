# Text

These examples document the text behaviors from the canonical TopoViewer test-case catalog. Each section is generated from one test case and keeps the live viewport, topology YAML, and stylesheet YAML together.

## Standalone text boxes

### What This Demonstrates

Standalone text belongs under `diagram.texts`, not `graph.nodes`. Use it for
titles, explanatory copy, maintenance notes, and other presentation content that
must remain selectable, resizable, layer-aware, and reviewable in YAML.

### Expected Result

The live viewport should render "Standalone text boxes" without blocking diagnostics. It should show: Layer-aware text boxes add editable canvas copy without creating graph objects. The test metadata expects `texts`: `3`.

### What To Inspect

- Inspect `diagram.texts` for standalone labels and explanatory copy that do not change graph semantics.
- Check text alignment, typography, background, border, rotation, and layer membership.

### Use When

Use this pattern when the canvas needs editable standalone text instead of a graph node or callout.

=== "Live Viewport"

    ```topoviewer
    topology: standalone-text-boxes/topology.yaml
    stylesheet: standalone-text-boxes/stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Standalone text boxes
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/text/standalone-text-boxes/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/text/standalone-text-boxes/stylesheet.yaml"
    ```
