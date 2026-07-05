---
hide:
  - toc
---

# Card node layout

## What This Demonstrates

Card node layout is for nodes that need to read like compact operational
records instead of plain device glyphs.

The node is still a `roundRectangle`. The nested `nodeLayout` object only
changes the internal arrangement: icon box on the left, title and subtitle on
the right. Badges and status markers stay node-level controls, so a card can
keep a TurboFlow-style badge on the top-right shell while its icon cell renders
either a glyph or an inline SVG. Use the badge size keys when the compact
defaults are too small for the card body.

Use this pattern for service maps, application dependencies, Kubernetes
objects, or operations views where every node needs a name plus one short piece
of metadata.

## Expected Result

The live viewport should render "Card node layout" without blocking diagnostics. It should show: Nested `nodeLayout` makes round-rectangle nodes read like compact service cards. The test metadata expects `graphNodes`: `3`, `minVisibleEdges`: `2`.

## What To Inspect

- Inspect node labels, data, icon definitions, and body shape settings.
- Compare label, badge, status, icon, border, and underlay style keys.

## Use When

Use this pattern when node identity, iconography, labels, status, or shape treatment matters.

=== "Live Viewport"

    ```topoviewer
    topology: topology.yaml
    stylesheet: stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Card node layout
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/nodes/card-node-layout/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/nodes/card-node-layout/stylesheet.yaml"
    ```
