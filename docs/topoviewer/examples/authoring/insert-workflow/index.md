---
hide:
  - toc
---

# Insert workflow

## What This Demonstrates

A Studio authoring fixture for adding nodes, links, regions, paths, and notes from the object palette.

The graph keeps every declared layer populated so layer toggles remain useful while authoring.

## Expected Result

The live viewport should render "Insert workflow" without blocking diagnostics. It should show: A Studio fixture for inserting nodes, links, paths, regions, and notes.

## What To Inspect

- Use the example as an authoring template in TopoViewer Studio.
- Apply changes and confirm the rendered viewport stays in sync with the source bundle.

## Use When

Use this pattern when building browser or VS Code Studio authoring workflows.

=== "Live Viewport"

    ```topoviewer
    topology: topology.yaml
    stylesheet: stylesheet.yaml
    height: 520px
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
