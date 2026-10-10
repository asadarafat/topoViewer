---
hide:
  - toc
---

# Dense link grouping

A compact Studio fixture for parallel links and link grouping.

Use it to tune bundle threshold behavior without loading a large topology.

## Expected Result

A Studio fixture for parallel link grouping and bundle threshold editing.

## Try It

1. Copy the two YAML tabs into your own project.
2. In `graph.nodes.0` in topology.yaml, set `graph.nodes.0.labels.name` to `"Edge renamed"`.
3. Reload. The visible alias on a changes; its stable ID, relationships, and memberships remain unchanged.
4. Restore the original settings and reload to compare with the starting view.

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
    --8<-- "docs/topoviewer/examples/authoring/dense-links/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/authoring/dense-links/stylesheet.yaml"
    ```
