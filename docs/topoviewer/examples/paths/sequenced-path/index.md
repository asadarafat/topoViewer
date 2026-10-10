---
hide:
  - toc
---

# Sequenced path

A sequenced path is more than a link: it records the ordered nodes that the logical path traverses. Rendering expands the sequence into path segments.

## Expected Result

A path sequence models ordered traversal through graph nodes.

## Try It

1. Copy the two YAML tabs into your own project.
2. In the `path[labels.protocol = "sr-te"]` rule in stylesheet.yaml, set `lineWidth` to `8`.
3. Reload. The ordered path is emphasized without changing the nodes in its sequence.
4. Restore the original settings and reload to compare with the starting view.

=== "Live Viewport"

    ```topoviewer
    topology: topology.yaml
    stylesheet: stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Sequenced path
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/paths/sequenced-path/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/paths/sequenced-path/stylesheet.yaml"
    ```
