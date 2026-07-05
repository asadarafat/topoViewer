# Phase 0 Current Renderer Audit

Date: 2026-07-05

## Current Evidence

The React Flow Turbo Flow example is implemented as a custom React Flow node:
the example registers a `TurboNode` through `nodeTypes`, passes icon/title/
subtitle as node data, and renders a custom internal DOM structure.

TopoViewer currently renders network nodes through a fixed `NetworkNode`
structure:

```text
node wrapper
  icon/body frame
    shape SVG
    icon content
    badge/status
    handles
  label
  metadata
```

Relevant local source:

- `packages/topoviewer/src/components/NetworkNode.tsx`
- `packages/topoviewer/src/core/style.ts`
- `packages/topoviewer/src/core/styleDefaults.ts`

## Conclusion

TopoViewer can approximate the color, border, badge, and label styling of a
Turbo-style node, but it cannot currently express a true card node with a small
left icon cell and right-side title/subtitle content inside one node body.

The correct public model is:

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
```

## Decisions

- `card` is not a `shape`.
- `shape` remains the outer geometry and edge-boundary contract.
- `nodeLayout` is the internal content layout contract.
- `nodeLayout.type: card` requires explicit `shape: roundRectangle`.
- Existing node rendering remains the default when `nodeLayout` is absent.
