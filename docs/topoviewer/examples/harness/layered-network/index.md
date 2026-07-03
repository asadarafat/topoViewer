---
hide:
  - toc
---

# Layered network authoring

## What This Demonstrates

The default authoring harness template.

It combines underlay, BGP, service, and operations layers in one small topology so the harness can demonstrate layer toggles, relationship editing, attention, and diagnostics without starting from an empty graph.

## Expected Result

The live viewport should render "Layered network authoring" without blocking diagnostics. It should show: The default browser harness template for layered network authoring.

## What To Inspect

- Use the example as an authoring template in the browser harness.
- Apply changes and confirm the rendered viewport stays in sync with YAML.

## Use When

Use this pattern when building browser or VS Code authoring workflows.

=== "Live Viewport"

    ```topoviewer
    topology: topology.yaml
    stylesheet: stylesheet.yaml
    height: 520px
    controls: true
    controlsOpen: false
    title: Layered network authoring
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/harness/layered-network/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/harness/layered-network/stylesheet.yaml"
    ```
