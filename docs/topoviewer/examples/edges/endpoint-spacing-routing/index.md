---
hide:
  - toc
---

# Endpoint spacing and routing

Endpoint spacing moves the visible line inward from node boundaries. Segment controls make manual bend points explicit, while taxi controls create deterministic right-angled routes without relying on automatic layout guesses.

## Expected Result

Endpoint spacing, segment controls, and taxi controls make edge routes explicit.

## Try It

1. Copy the two YAML tabs into your own project.
2. In the `link[labels.route = "taxi"]` rule in stylesheet.yaml, set `taxiTurn` to `60`.
3. Reload. The taxi turn changes while its source and target remain the same.
4. Restore the original settings and reload to compare with the starting view.

=== "Live Viewport"

    ```topoviewer
    topology: topology.yaml
    stylesheet: stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Endpoint spacing and routing
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/edges/endpoint-spacing-routing/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/edges/endpoint-spacing-routing/stylesheet.yaml"
    ```
