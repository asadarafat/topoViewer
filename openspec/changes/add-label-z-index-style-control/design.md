## Design

### Public contract

TopoViewer style keys remain flat and canonical `camelCase`.

Recommended authoring:

```yaml
stylesheet:
  - selector: region
    style:
      zIndex: -20
      labelZIndex: 80
      labelPosition: topCenter
      labelBackgroundColor: var(--topoviewer-panel-bg)

  - selector: node[labels.role = "critical"]
    style:
      zIndex: 10
      labelZIndex: 120
      labelPosition: top

  - selector: link[labels.type = "service"]
    style:
      zIndex: 8
      labelZIndex: 90
      sourceLabelZIndex: 95
      targetLabelZIndex: 95
```

`labelZIndex` is the only canonical spelling. The key is intentionally not
`labelZindex`: TopoViewer already exposes `zIndex`, and style-key composition
should preserve the existing sub-key spelling.

### Semantics

`zIndex` controls the rendered object body or edge line. `labelZIndex` controls
the rendered label.

If `labelZIndex` is absent, the renderer must preserve current behavior:

- node labels stay visually tied to node rendering;
- region labels stay visually tied to region rendering;
- edge labels keep current React Flow label ordering;
- screenshots, exports, selection, hover, and drag behavior remain unchanged.

If `labelZIndex` is present, the label should participate in an independent
label stacking model. Larger values render above smaller values. Negative
values are allowed where the underlying renderer can support them, but examples
should prefer non-negative values because labels are usually readability aids.

### Renderer approach

Node and region labels are currently rendered inside their object components.
A child `z-index` cannot reliably escape the parent object stacking context.
Therefore implementation must not pretend local CSS is enough for global label
ordering.

Recommended approach:

1. Compile label positioning, content, and `labelZIndex` into renderer data.
2. Keep existing in-object label rendering when `labelZIndex` is absent.
3. When `labelZIndex` is present, render node and region labels through a
   graph-space label overlay, such as a React Flow viewport portal or a
   TopoViewer-owned label layer.
4. Keep object body rendering unchanged so `zIndex` remains object ordering.
5. Preserve click, selection, hover, drag, keyboard focus, and attention state
   behavior. Portaled labels should not accidentally block canvas gestures.

The overlay must remain graph-space, not viewport-fixed. Labels must move and
zoom with the topology.

Edge labels already use React Flow label rendering patterns. Apply z-index to
the center label and endpoint labels through their HTML label styles. Endpoint
label keys fall back in this order:

```text
sourceLabelZIndex -> labelZIndex -> default
targetLabelZIndex -> labelZIndex -> default
```

### Source and target label keys

Use endpoint-specific keys only for edge labels:

- `sourceLabelZIndex`;
- `targetLabelZIndex`.

Do not add node-specific keys such as `nodeLabelZIndex`. The selector context
already defines whether a style applies to nodes, links, paths, regions,
shapes, or callouts.

### Validation and lint

JSON schema can document the shared style key as a number. Semantic lint should
remain the context-specific authority.

Validation rules:

- `labelZIndex`, `sourceLabelZIndex`, and `targetLabelZIndex` must be finite
  numbers.
- kebab-case and non-canonical casing must be rejected by the existing
  canonical style-key lint path.
- endpoint-specific keys should warn or error when used where no source/target
  label can render.

### Documentation

Docs should explain the distinction between:

- `zIndex`: object/body/line order;
- `labelZIndex`: label order.

Docs should also mention that `labelZIndex` is not automatic collision
avoidance. It decides draw order when labels overlap; it does not move labels
away from each other.

### Examples

Add compact examples rather than a large demo:

1. A region behind two nodes where the region label is lifted above the nodes
   with `labelZIndex`.
2. Two crossing or close links where edge labels use `labelZIndex`.
3. A source/target label example where `sourceLabelZIndex` and
   `targetLabelZIndex` override the center label.

Each example should include live viewport, topology YAML, stylesheet YAML, and
expected assertions.

## Risks

- Portaling node or region labels can break object-relative positioning if
  graph-space coordinates are not calculated from the same bounds used by the
  current object renderer.
- Portaled labels can accidentally intercept clicks and drags.
- Export paths may miss labels if the export logic only captures node DOM
  descendants.
- Label z-index can be overused and make every label fight for attention.
  Documentation should frame it as a targeted dense-graph readability control.
