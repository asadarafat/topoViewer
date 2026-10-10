---
hide:
  - toc
---

# Border, outline, and underlay

Border, outline, and underlay styles create operational emphasis without changing the topology. Warning and critical nodes stand out through stroke pattern, outline, and underlay while the normal peer stays visually quiet.

## Expected Result

Node border, outline, and underlay controls provide operational emphasis without changing graph facts.

## Try It

1. Copy the two YAML tabs into your own project.
2. In the `node[labels.state = "critical"]` rule in stylesheet.yaml, set `outlineWidth` to `8`.
3. Reload. The outer outline grows independently of the body border and underlay.
4. Restore the original settings and reload to compare with the starting view.

=== "Live Viewport"

    ```topoviewer
    topology: topology.yaml
    stylesheet: stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Border, outline, and underlay
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/nodes/border-outline-underlay/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/nodes/border-outline-underlay/stylesheet.yaml"
    ```
