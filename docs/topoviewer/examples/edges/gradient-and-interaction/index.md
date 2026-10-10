---
hide:
  - toc
---

# Gradient and interaction flags

Linear gradients are useful for directional utilization, ownership, or state transitions. `interactive: false` leaves a reference edge visible while removing edge click handling, and `labelInteractive: false` keeps labels from taking pointer events.

## Expected Result

Linear gradients and interaction flags can be declared directly on edge style rules.

## Try It

1. Copy the two YAML tabs into your own project.
2. In the `link` rule in stylesheet.yaml, set `selectable` to `false`.
3. Reload. Clicking the matched edge no longer selects it; its rendered relationship remains visible.
4. Restore the original settings and reload to compare with the starting view.

=== "Live Viewport"

    ```topoviewer
    topology: topology.yaml
    stylesheet: stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Gradient and interaction flags
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/edges/gradient-and-interaction/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/edges/gradient-and-interaction/stylesheet.yaml"
    ```
