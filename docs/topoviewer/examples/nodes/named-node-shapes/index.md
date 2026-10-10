---
hide:
  - toc
---

# Named node shapes

Node shape is presentation policy. Use stylesheet selectors to map graph labels such as role or device type to distinct node bodies while keeping topology facts in `graph.nodes` and `graph.links`.

## Expected Result

Node body shape can encode device or service role without changing graph facts.

## Try It

1. Copy the two YAML tabs into your own project.
2. In the `node[labels.role = "switch"]` rule in stylesheet.yaml, set `shape` to `"circle"`.
3. Reload. The matched node uses a circular body; its identity and links stay intact.
4. Restore the original settings and reload to compare with the starting view.

=== "Live Viewport"

    ```topoviewer
    topology: topology.yaml
    stylesheet: stylesheet.yaml
    height: 440px
    controls: true
    controlsOpen: false
    title: Named node shapes
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/nodes/named-node-shapes/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/nodes/named-node-shapes/stylesheet.yaml"
    ```
