---
hide:
  - toc
---

# Dense link grouping

## What This Demonstrates

A compact harness template for parallel links and link grouping.

Use it to tune bundle threshold behavior without loading a large topology.

## Expected Result

The live viewport should render "Dense link grouping" without blocking diagnostics. It should show: A browser harness template for parallel link grouping and bundle threshold editing.

## What To Inspect

- Use the example as an authoring template in the browser harness.
- Apply changes and confirm the rendered viewport stays in sync with YAML.

## Use When

Use this pattern when building browser or VS Code authoring workflows.

=== "Live Viewport"

    ```topoviewer
    topology: topology.yaml
    stylesheet: stylesheet.yaml
    height: 500px
    controls: true
    controlsOpen: false
    title: Dense link grouping
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/harness/dense-links/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/harness/dense-links/stylesheet.yaml"
    ```
