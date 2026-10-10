---
hide:
  - toc
---

# Insert workflow

A Studio authoring fixture for adding nodes, links, regions, paths, and notes from the object palette.

The graph keeps every declared layer populated so layer toggles remain useful while authoring.

## Expected Result

A Studio fixture for inserting nodes, links, paths, regions, and notes.

## Try It

1. Copy the two YAML tabs into your own project.
2. In `diagram.callouts.0` in topology.yaml, set `diagram.callouts.0.body` to `"Inspect this object before proceeding."`.
3. Reload. The annotation text changes without creating or altering a graph relationship.
4. Restore the original settings and reload to compare with the starting view.

=== "Live Viewport"

    ```topoviewer
    topology: topology.yaml
    stylesheet: stylesheet.yaml
    height: 600px
    controls: true
    controlsOpen: false
    title: Insert workflow
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/authoring/insert-workflow/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/authoring/insert-workflow/stylesheet.yaml"
    ```
