---
hide:
  - toc
---

# Insert workflow

## What This Demonstrates

An authoring harness template for adding nodes, links, regions, paths, and notes from the Build panel.

The graph keeps every declared layer populated so layer toggles remain useful while authoring.

## Expected Result

The live viewport should render "Insert workflow" without blocking diagnostics. It should show: A browser harness template for inserting nodes, links, paths, regions, and notes.

## What To Inspect

- Use the example as an authoring template in the browser harness.
- Apply changes and confirm the rendered viewport stays in sync with YAML.

## Use When

Use this pattern when building browser or VS Code authoring workflows.

=== "Live Viewport"

    ```topoviewer
    topology: ../../../examples/harness/insert-workflow/topology.yaml
    stylesheet: ../../../examples/harness/insert-workflow/stylesheet.yaml
    height: 520px
    controls: true
    controlsOpen: false
    title: Insert workflow
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/harness/insert-workflow/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/harness/insert-workflow/stylesheet.yaml"
    ```
