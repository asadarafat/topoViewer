---
hide:
  - toc
---

# Inspector workflow

## What This Demonstrates

A Studio authoring fixture for inspecting and editing object labels, data, positions, and relationship endpoints.

The topology includes routers, a firewall, a service, links, and a callout so the Inspect panel has varied object types.

## Expected Result

The live viewport should render "Inspector workflow" without blocking diagnostics. It should show: A Studio fixture for inspecting object labels, data, positions, and relationships.

## What To Inspect

- Use the example as an authoring template in TopoViewer Studio.
- Apply changes and confirm the rendered viewport stays in sync with the source bundle.

## Use When

Use this pattern when building Browser or Desktop Studio authoring workflows.

=== "Live Viewport"

    ```topoviewer
    topology: topology.yaml
    stylesheet: stylesheet.yaml
    height: 520px
    controls: true
    controlsOpen: false
    title: Inspector workflow
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/authoring/inspector-workflow/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/authoring/inspector-workflow/stylesheet.yaml"
    ```
