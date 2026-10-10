---
hide:
  - toc
---

# Directional link strokes

Directional link strokes model two operational directions on one physical link.
Use them when one adjacency has independent telemetry for each direction and
duplicate links would misrepresent the topology.

The parent link still owns the stable topology identity and any endpoint port
labels. Each `linkDirection` inherits the parent link style, then applies
direction-specific overrides such as line color, arrow marker, dash pattern,
and direction label.

Use direction labels for vector values such as bandwidth or packet rate. Use
`sourceLabel` and `targetLabel` for physical ports. TopoViewer keeps arrows as
marker geometry and places endpoint, center, and direction labels with a shared
label placement pass so dense operational diagrams remain inspectable.

## Expected Result

One physical link can show two independently styled traffic directions.

## Try It

1. Copy the two YAML tabs into your own project.
2. In the `linkDirection` rule in stylesheet.yaml, set `lineWidth` to `7`.
3. Reload. One matching direction becomes wider without changing the opposite directional channel.
4. Restore the original settings and reload to compare with the starting view.

=== "Live Viewport"

    ```topoviewer
    topology: topology.yaml
    stylesheet: stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Directional link strokes
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/edges/directional-link-strokes/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/edges/directional-link-strokes/stylesheet.yaml"
    ```
