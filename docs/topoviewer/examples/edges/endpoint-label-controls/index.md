---
hide:
  - toc
---

# Endpoint label controls

Use endpoint labels when the two ends of an edge need visible port names. This
example keeps circle and square arrow markers as geometry only, then renders
`sourceLabel` and `targetLabel` as styled endpoint annotations with automatic
placement.

`endpointLabelDistance` moves labels away from their endpoint along the edge. `endpointLabelSideOffset` moves labels perpendicular to the edge during auto placement. `sourceLabelXOffset`, `sourceLabelYOffset`, `targetLabelXOffset`, and `targetLabelYOffset` are final manual nudges after auto placement.

Use the center `label` for the relationship name. Use `sourceLabel` and
`targetLabel` for interface names. Do not put interface names inside arrow
markers; arrows stay marker geometry so the label engine can place endpoint
text independently.

## Expected Result

Endpoint labels can show physical ports while arrow markers remain pure geometry.

## Try It

1. Copy the two YAML tabs into your own project.
2. In the `link` rule in stylesheet.yaml, set `sourceLabelYOffset` to `20`.
3. Reload. The source-side port label moves vertically; the endpoint ID and arrow attachment stay unchanged.
4. Restore the original settings and reload to compare with the starting view.

=== "Live Viewport"

    ```topoviewer
    topology: topology.yaml
    stylesheet: stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Endpoint label controls
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/edges/endpoint-label-controls/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/edges/endpoint-label-controls/stylesheet.yaml"
    ```
