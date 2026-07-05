## Current State

The current `NetworkNode` renderer has a fixed layout:

```text
node wrapper
  icon/body frame
    shape geometry
    icon content
    badge/status markers
    handles
  node label
  node metadata
```

The compiler maps node `width` and `height` to the visible body and icon frame.
Labels are rendered as separate HTML elements around or inside that body.
Metadata is derived from labels and rendered separately. This is why TopoViewer
can style many network nodes but cannot produce a polished application-card
node with an icon cell and right-side text content inside the same card.

## Design Principle

Do not make `card` a shape.

`shape` is geometry. It controls body boundary, clipping, edge anchor math,
region bounds, hit area, and visual shape. `nodeLayout` is content layout. It
controls how icon, title, subtitle, badge, and content are arranged inside the
body.

The public contract should be:

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
      badgePlacement: topRight
    content:
      align: left
      titleField: name
      subtitleField: data.subtitle
```

## Shape Gate

`nodeLayout.type: card` requires `shape: roundRectangle`.

Reasons:

- A card is rectangular product UI, not arbitrary topology geometry.
- Supporting card layout on circles, diamonds, stars, and polygons would create
  ambiguous clipping, alignment, edge anchors, and badge behavior.
- Requiring explicit `shape: roundRectangle` avoids accidentally changing
  diagrams where the default shape is `rectangle`.

Validation and semantic lint should report a diagnostic when card layout is
declared without `shape: roundRectangle`.

## Minimal Supported Contract

Initial implementation should keep the surface narrow:

```ts
type NodeLayoutStyle = {
  type: 'card';
  direction?: 'horizontal';
  icon?: {
    placement?: 'left';
    width?: number;
    height?: number;
    badgePlacement?: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
  };
  content?: {
    align?: 'left' | 'center' | 'right';
    titleField?: string;
    subtitleField?: string;
  };
};
```

Future values such as vertical cards, right-side icons, multiple subtitle
lines, and action slots should not be documented as supported until they exist.

## Field Resolution

`titleField` and `subtitleField` resolve from stable TopoViewer object fields:

- `id`
- `name`
- `label`
- `labels.<key>`
- `data.<key>`

The renderer should treat resolved values as inert text or as the same safe
markdown pipeline already used for node labels only if that pipeline can be
applied without introducing unsafe HTML. Missing fields should render as empty
content, not crash the graph.

Default values:

- `titleField: name`
- no subtitle when `subtitleField` is absent

## Renderer Model

The renderer may branch inside `NetworkNode` or introduce an internal card
subcomponent. It should keep the React Flow node type stable unless a separate
node type is clearly needed.

Card rendering should preserve:

- object click behavior;
- selection and focus behavior;
- dragging;
- explicit handles;
- default source/target handles;
- edge anchors based on the outer body box;
- attention classes;
- label collision and label z-index behavior for non-card labels;
- export and screenshot behavior.

The card body is still the node body. The internal icon cell is not the edge
anchor. The icon-scoped badge is visual only.

## Badge Behavior

Existing badge behavior remains compatible:

- default layout uses existing `badgePosition` on the node body/icon frame;
- card layout may use `nodeLayout.icon.badgePlacement` to attach the badge to
  the icon cell;
- if card layout omits `nodeLayout.icon.badgePlacement`, existing
  `badgePosition` behavior should remain predictable and documented.

Do not introduce `badgePlacement: iconTopRight` as a flat value. Badge placement
belongs either to the current node body placement enum or to the nested card
icon layout.

## Schema And Style Metadata

The schema must accept the nested `nodeLayout` object under style declarations.
Because style metadata is currently mostly flat, implementation needs a
deliberate bridge:

- schema validates nested structure and enum values;
- semantic lint checks shape gating and unsupported combinations;
- docs/reference generation lists `nodeLayout` as an object style key with
  nested attributes;
- YAML assist suggests nested keys where supported.

Do not flatten the public contract into `nodeLayoutType`, `cardIconWidth`, and
similar keys unless implementation proves nested assist is not viable. The
point of this feature is a more ergonomic nested object for card layout.

## Documentation And Examples

Docs must explain:

- why `card` is `nodeLayout`, not `shape`;
- why card layout requires `shape: roundRectangle`;
- how `titleField` and `subtitleField` resolve;
- how icon-scoped badge placement differs from default badge placement;
- how card nodes preserve topology identity and edge anchors.

Examples must include at least one graph that visually resembles a compact
workflow/service-card layout: left icon, right title/subtitle, badge on the
icon, and normal TopoViewer links/handles.

## Risk Controls

- Keep implementation behind explicit `nodeLayout.type: card`.
- Add failing tests before renderer changes.
- Add visual evidence before declaring the feature complete.
- Keep all old node examples passing.
- Run renderer parity after generated docs/examples are synced.
