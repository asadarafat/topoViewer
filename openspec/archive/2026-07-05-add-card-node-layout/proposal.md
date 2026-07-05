## Why

TopoViewer can style node shape, color, labels, metadata, badges, status
markers, icons, handles, and edges, but it cannot currently express a compact
application-card node like the React Flow Turbo Flow example through topology
and stylesheet YAML.

The current node renderer is optimized for network-style glyph nodes: one node
body/icon frame, a label around or inside that body, optional metadata, and
badge/status overlays. That works for routers, services, regions, and many
network diagrams. It is not enough for modern infrastructure/service maps where
the expected node visual is a card: small icon cell on the left, title and
subtitle on the right, compact badge attached to the icon, and a rectangular
body that still behaves like a TopoViewer node.

This is a real feature, not a style alias. The renderer, style schema, style
compiler, YAML assist, docs, examples, and parity checks all need to understand
the nested `nodeLayout` object. The change must remain surgical because it
touches the core node primitive.

## What Changes

Add a first-class card node layout contract:

```yaml
style:
  shape: roundRectangle
  nodeLayout:
    type: card
    direction: horizontal
    icon:
      placement: left
      width: 44
      height: 44
    content:
      align: left
      titleField: name
      subtitleField: data.subtitle
  badgePosition: topRight
  statusPlacement: bottomRight
```

The contract deliberately separates outer shape from inner layout:

- `shape` remains the node geometry and edge-boundary contract.
- `nodeLayout` controls the internal content arrangement.
- `nodeLayout.type: card` is valid only with `shape: roundRectangle`.
- `badgePosition` and `statusPlacement` remain node-level controls on the card
  shell, not icon-cell controls.
- Node-level badge sizing controls scale shell badges for card-sized nodes.
- The existing default node layout remains unchanged when `nodeLayout` is
  absent.

## Capabilities

### New Capabilities

- `card-node-layout`: nested style contract and renderer support for compact
  horizontal card nodes.

### Modified Capabilities

- `stylesheet-node-style`: accepts and validates the nested `nodeLayout` object.
- `topoviewer-renderer`: renders card content inside the node body while
  preserving existing node behavior for non-card nodes.
- `topoviewer-schema`: documents and validates card layout structure,
  supported enum values, and round-rectangle shape gating.
- `topoviewer-yaml-assist`: suggests nested card layout keys in browser and VS
  Code harness authoring surfaces.
- `topoviewer-docs`: documents card layout, constraints, examples, and
  migration guidance.
- `topoviewer-examples`: adds a compact service/workflow example that proves
  card nodes render consistently across Harness, MkDocs, and Zensical.

## Backward Compatibility

This change must not alter current diagrams unless they explicitly opt into
`nodeLayout.type: card`.

Existing node keys such as `shape`, `width`, `height`, `icon`, `iconPadding`,
`labelPosition`, `labelColor`, `metaColor`, `badgeLabel`, `badgePosition`,
`statusColor`, and handles must continue to behave as they do today for the
default node layout.

Existing flat badge placement remains valid. Card layout adds an icon-scoped
badge placement so authors can attach a badge to the icon cell without
overloading `shape`.

## Non-Goals

- Adding `shape: card`.
- Supporting card layout on `circle`, `square`, `diamond`, `polygon`, or other
  non-rectangular shapes.
- Accepting arbitrary React components or arbitrary CSS in YAML.
- Baking title, subtitle, or badge text into SVG icons.
- Replacing current network-style node rendering.
- Implementing every Turbo Flow visual detail or adopting React Flow example
  code as runtime dependency.
- Moving edge anchor math away from the outer node body.

## Implementation Discipline

Tasks are sequential and evidence-gated. A phase is not done until the
corresponding evidence file exists and records what was checked. Implementation
must not advance into the next phase when the prior phase has unchecked tasks or
missing evidence.
