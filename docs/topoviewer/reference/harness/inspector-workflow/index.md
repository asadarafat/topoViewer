---
hide:
  - toc
---

# Inspector workflow

## What This Demonstrates

An authoring harness template for inspecting and editing object labels, data, positions, and relationship endpoints.

The topology includes routers, a firewall, a service, links, and a callout so the Inspect panel has varied object types.

## Expected Result

The live viewport should render "Inspector workflow" without blocking diagnostics. It should show: A browser harness template for inspecting object labels, data, positions, and relationships.

## What To Inspect

- Use the example as an authoring template in the browser harness.
- Apply changes and confirm the rendered viewport stays in sync with YAML.

## Use When

Use this pattern when building browser or VS Code authoring workflows.

=== "Live Viewport"

    ```topoviewer
    topology: ../../../examples/harness/inspector-workflow/topology.yaml
    stylesheet: ../../../examples/harness/inspector-workflow/stylesheet.yaml
    height: 520px
    controls: true
    controlsOpen: false
    title: Inspector workflow
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/harness/inspector-workflow/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/harness/inspector-workflow/stylesheet.yaml"
    ```
