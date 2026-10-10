---
hide:
  - toc
---

# Inspector workflow

A Studio authoring fixture for inspecting and editing object labels, data, positions, and relationship endpoints.

The topology includes routers, a firewall, a service, links, and a callout so the Inspect panel has varied object types.

## Expected Result

A Studio fixture for inspecting object labels, data, positions, and relationships.

## Try It

1. Copy the two YAML tabs into your own project.
2. In `diagram.callouts.0` in topology.yaml, set `diagram.callouts.0.body` to `"Inspect this object before proceeding."`.
3. Reload. The annotation text changes without creating or altering a graph relationship.
4. Restore the original settings and reload to compare with the starting view.

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
