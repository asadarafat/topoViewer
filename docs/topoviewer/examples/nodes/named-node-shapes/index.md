---
hide:
  - toc
---

# Named node shapes

## What This Demonstrates

Node shape is presentation policy. Use stylesheet selectors to map graph labels such as role or device type to distinct node bodies while keeping topology facts in `graph.nodes` and `graph.links`.

## Expected Result

The live viewport should render "Named node shapes" without blocking diagnostics. It should show: Node body shape can encode device or service role without changing graph facts. The test metadata expects `graphNodes`: `8`, `minVisibleEdges`: `7`.

## What To Inspect

- Inspect node labels, data, icon definitions, and body shape settings.
- Compare label, badge, status, icon, border, and underlay style keys.

## Use When

Use this pattern when node identity, iconography, labels, status, or shape treatment matters.

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
