---
hide:
  - toc
---

# Standalone text boxes

Standalone text belongs under `diagram.texts`, not `graph.nodes`. Use it for
titles, explanatory copy, maintenance notes, and other presentation content that
must remain selectable, resizable, layer-aware, and reviewable in YAML.

## Expected Result

Layer-aware text boxes add editable canvas copy without creating graph objects.

## Try It

1. Copy the two YAML tabs into your own project.
2. In `diagram.texts.0` in topology.yaml, set `diagram.texts.0.text` to `"Maintenance window: 22:00 UTC"`.
3. Reload. The annotation text changes without creating or altering a graph relationship.
4. Restore the original settings and reload to compare with the starting view.

=== "Live Viewport"

    ```topoviewer
    topology: topology.yaml
    stylesheet: stylesheet.yaml
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
