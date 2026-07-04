# TopoViewer Stylesheet

TopoViewer uses a selector stylesheet inspired by Cytoscape, then compiles matched rules into React Flow nodes and edges. Do not author React Flow internals directly in topology YAML. Keep graph facts in topology and presentation policy in the stylesheet.

Use this page in two passes:

1. Start with the authoring workflow and file anatomy.
2. Use the style key reference only when you need the exact key, accepted values, and defaults.

## Authoring Workflow

A production stylesheet usually follows this order:

1. Set `layout` so every surface has the same viewport and layout policy.
2. Define reusable `icons` once.
3. Set broad defaults with selectors such as `node`, `link`, `path`, and `region`.
4. Add label/data-specific rules such as `node[labels.role = "leaf"]`.
5. Use per-object inline `style` only for exceptions that belong to one object.

```yaml
layout:
  mode: manual
  width: 860
  height: 420

icons:
  router.generic:
    glyph: R
    fill: "#1976d2"
    stroke: "#bbdefb"

stylesheet:
  - selector: node
    style:
      icon: router.generic
      shape: rectangle
      width: 82
      height: 60
  - selector: node[labels.role = "leaf"]
    style:
      outlineColor: "#1976d2"
      outlineWidth: 3
  - selector: link
    style:
      curveStyle: straight
      lineWidth: 3
```

## File Anatomy

Stylesheet YAML can define layout policy, reusable icon assets, label extraction, and ordered style rules.

```yaml
$schema: ../../schemas/topoviewer-stylesheet.schema.json
layout:
  mode: force
  width: 1280
  height: 720

icons:
  router.generic:
    glyph: R
    fill: '#6ea8fe'
    stroke: '#d8e8ff'

labelFields:
  - name

stylesheet:
  - selector: node
    style:
      icon: router.generic
      width: 82
      height: 60
```

| Section | Purpose |
|---|---|
| `$schema` | Optional editor/schema hint. |
| `layout` | Default viewport and layout policy. |
| `icons` | Reusable glyph, image, data URI, or inline SVG assets. |
| `labelFields` | Data fields rendered as primary labels when object labels are not explicit. |
| `stylesheet` | Ordered selector rules that turn topology facts into visual presentation. |

## Rule Model

Rules have a `selector` and a `style` object. Rules are applied in order; later matching rules override earlier matching rules. Per-object `style` overrides matched stylesheet values last.

### Selector Subjects

Supported subject kinds:

- `node`
- `link`
- `linkDirection`
- `path`
- `region`
- `shape`
- `callout`

Supported conditions:

| Selector | Meaning |
|---|---|
| `node` | All nodes. |
| `node[labels.vendor = "nokia"]` | Exact match. |
| `link[labels.protocol = "pcep"]` | Match nested labels. |
| `linkDirection[direction = "sourceToTarget"]` | Match the source-to-target directional stroke of a link that declares `directions.sourceToTarget`. |
| `path[labels.protocol ~= "sr-te"]` | List or whitespace-token contains value. |
| `region[id = "as65000"]` | Match direct entity field. |
| `shape[labels.shape = "sap"]` | Style diagram shapes. |
| `callout[labels.callout = "subscriber-subnet"]` | Style rich callout boxes. |
| `callout[labels.callout = "srrp"]` | Style line-only callout relationships. |
| `link[data.metric = "20"]` | Match nested data value. |

### Precedence

For any object, TopoViewer resolves style in this order:

1. canonical style defaults;
2. broad stylesheet rules, such as `node`;
3. narrower stylesheet rules, such as `node[labels.vendor = "nokia"]`;
4. later matching rules overriding earlier matching rules;
5. inline object `style`.

Use inline object style sparingly. It is useful for one-off exceptions, but reusable visual policy belongs in `stylesheet`.

## Icons

Icons can be text glyphs, external image URLs, data URIs, or inline SVG.

```yaml
icons:
  router.nokia:
    alt: Nokia router
    svg: |
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r="42" fill="#124191"/>
        <text x="48" y="56" text-anchor="middle" font-size="22" font-weight="800" fill="white">N</text>
      </svg>

stylesheet:
  - selector: node[labels.vendor = "nokia"]
    style:
      icon: router.nokia
      iconSize: 48
```

## Layout

The stylesheet can carry the default layout so visual policy stays outside graph facts.

```yaml
layout:
  mode: force
  width: 1280
  height: 720
  iterations: 220
  linkDistance: 185
  chargeStrength: -620
  collideRadius: 66
  centerStrength: 0.05
```

`manual` uses supplied positions as-is. `force` treats supplied positions as deterministic seeds and computes a readable layout. `clos` computes stage-constrained placement from graph structure, directed hierarchy, endpoint counts, and optional hints.

For automatic CLOS layout, keep the stylesheet focused on layout geometry and
author links from earlier stage to later stage. Directed `source` -> `target`
links are the strongest automatic root signal. Low endpoint count is used as a
fuzzy fallback only when direction is not usable.
Generic stage fields such as `labels.stage`, `data.stage`, `labels.tier`, or
`labels.level` can act as direct stage hints. Domain labels such as
`labels.node` and `labels.role` are not stage hints by default.

```yaml
layout:
  mode: clos
  width: 860
  height: 420
  clos:
    direction: topToBottom
    nodeGap: 168
    groupGap: 208
```

`labels.node`, `labels.role`, and similar classifier fields remain styling and
filter metadata by default:

```yaml
stylesheet:
  - selector: node[labels.node = "spine"]
    style:
      outlineColor: "#9c27b0"
      outlineWidth: 4
```

Those labels do not move nodes unless they are explicitly referenced by a layout
hint. Use `stageKey` when your topology already has a direct stage field and you
want to make that stage source explicit:

```yaml
layout:
  mode: clos
  clos:
    stageKey: labels.stage
    stageOrder: [core, aggregation, access]
    groupKey: labels.site
```

Use `inferLabelRole` only when an existing role vocabulary should be mapped to
stages without adding a dedicated stage field:

```yaml
layout:
  mode: clos
  inferLabelRole:
    - stage-1: p
    - stage-2: pe
    - stage-3: agg
    - stage-4: access
```

## Default Behavior

Style defaults are defined in TopoViewer's canonical style defaults registry. Runtime compilation, YAML authoring help, schema/lint alignment checks, and this reference are expected to agree.

Important defaults:

- Nodes: Defaults to `rectangle` and Defaults to `82` x `60`; also default to `borderWidth: 4`, `labelPosition: bottom`, `badgePosition: topRight`, `statusPlacement: bottomRight`, `draggable: true`, `selectable: true`, and `zIndex: 10`.
- Node `backgroundColor` and `borderColor` are derived from the selected icon's `fill` and `stroke`.
- Polygon nodes use `shape: polygon` plus `shapePolygonPoints` when the named shape set is not enough. Points are normalized x/y pairs in the `[-1, 1]` coordinate space.
- Links and paths: Defaults to `bezier`; also default to `anchor: floating`, `lineColor: #6ea8fe`, `lineWidth: 1`, `lineStyle: solid`, `lineFill: solid`, no arrows, `interactive: true`, `labelInteractive: true`, and `zIndex: 6`. Links with declared `directions` can render `directionalStrokes` with `directionCenterGap: 48` and `directionStartGap: 14`.
- Regions: Defaults to `roundRectangle`; also default to `labelPosition: topLeft`, `labelMargin: 12`, `borderWidth: 1`, non-draggable, non-selectable, and `zIndex: -20`.
- Diagram shapes: Defaults to `180` x `72`; also default to `shape: rectangle`, `strokeWidth: 2`, draggable, non-selectable, and `zIndex: -10`.
- Callouts: Defaults to `320` x `120`; also default to `textAlign: left`, draggable, non-selectable, and `zIndex: 30`.

## Link Label Roles

Links can expose three different label roles. Keep them separate so dense
diagrams remain readable and so telemetry overlays do not corrupt topology
identity.

- `label` is the center edge label. Use it for the relationship name, circuit
  name, protocol, or other text that describes the whole link.
- `sourceLabel` and `targetLabel` are endpoint labels. Use them for physical
  port names such as `e1-1`, `eth1`, or `xe-0/0/0`.
- `link.directions.*.label` is a direction label. Use it for vector values such
  as bandwidth, packet rate, loss, or per-direction state.

Arrows are marker geometry only. Do not put port names inside arrow markers.
Use `sourceArrowShape` and `targetArrowShape` to show directionality, then use
`sourceLabel` and `targetLabel` for endpoint text.

Endpoint labels are automatically positioned near their endpoint by default.
`endpointLabelDistance` moves the label along the link direction,
`endpointLabelSideOffset` moves it perpendicular to the link direction, and
`sourceLabelXOffset` / `targetLabelXOffset` plus their Y counterparts are final
manual nudges after auto placement.

When a link has center, endpoint, and direction labels, TopoViewer applies a
deterministic label placement pass so those labels prefer nearby readable
positions before falling back to opacity reduction in unavoidable dense cases.

## Style Key Index

This is a compact index of canonical camelCase keys accepted by the runtime. Use [Stylesheet Reference](./stylesheet-reference.md) for exact data types, accepted enum values, defaults, and target-specific notes.

- Node keys: `shape`, `shapePolygonPoints`, `width`, `height`, `backgroundColor`, `borderColor`, `borderWidth`, `borderStyle`, `borderDashPattern`, `borderOpacity`, `outlineColor`, `outlineWidth`, `outlineOpacity`, `underlayColor`, `underlayPadding`, `underlayOpacity`, `icon`, `iconSize`, `iconWidth`, `iconHeight`, `iconColor`, `iconFit`, `iconPadding`, `iconBackgroundColor`, `iconOpacity`, `labelPosition`, `labelColor`, `labelFontSize`, `labelFontWeight`, `labelOpacity`, `labelBackgroundColor`, `labelBackgroundOpacity`, `labelBorderColor`, `labelBorderWidth`, `labelPadding`, `labelTextMaxWidth`, `labelTextWrap`, `labelTextOverflow`, `labelTextAlign`, `labelXOffset`, `labelYOffset`, `labelZIndex`, `minZoomedLabelFontSize`, `metaColor`, `metaFontSize`, `metaFontWeight`, `badgeLabel`, `badgePosition`, `badgeColor`, `badgeBackgroundColor`, `badgeBorderColor`, `statusColor`, `statusPlacement`, `statusSize`, `display`, `draggable`, `selectable`, `opacity`, `zIndex`.
- Link keys: `labelXOffset`, `labelYOffset`, `directionalStrokes`, `directionCenterGap`, `directionStartGap`, `directionLabelPlacement`, `directionLabelOffset`, `directionLabelRotation`, `directionOverlayLayer`, `label`, `lineColor`, `lineWidth`, `lineStyle`, `lineDashPattern`, `lineDashOffset`, `lineCap`, `lineOutlineWidth`, `lineOutlineColor`, `lineOpacity`, `lineFill`, `lineGradientStopColors`, `lineGradientStopPositions`, `curveStyle`, `anchor`, `controlPointStepSize`, `controlPointDistance`, `controlPointWeight`, `edgeDistances`, `segmentDistances`, `segmentWeights`, `taxiDirection`, `taxiTurn`, `taxiTurnMinDistance`, `sourceDistanceFromNode`, `targetDistanceFromNode`, `arrowColor`, `targetArrowShape`, `targetArrowColor`, `targetArrowSize`, `targetArrowOffset`, `sourceArrowShape`, `sourceArrowColor`, `sourceArrowSize`, `sourceArrowOffset`, `labelColor`, `labelFontSize`, `labelFontWeight`, `labelFontStyle`, `labelBorderColor`, `labelBorderWidth`, `textBackgroundColor`, `textBackgroundOpacity`, `labelZIndex`, `sourceLabel`, `sourceLabelColor`, `sourceLabelBackgroundColor`, `sourceLabelBorderColor`, `sourceLabelBorderWidth`, `sourceLabelFontSize`, `sourceLabelFontWeight`, `sourceLabelFontStyle`, `sourceLabelOpacity`, `sourceLabelAutoPosition`, `sourceLabelDistance`, `sourceLabelMaxDistance`, `sourceLabelSideOffset`, `sourceLabelZIndex`, `targetLabel`, `targetLabelColor`, `targetLabelBackgroundColor`, `targetLabelBorderColor`, `targetLabelBorderWidth`, `targetLabelFontSize`, `targetLabelFontWeight`, `targetLabelFontStyle`, `targetLabelOpacity`, `targetLabelAutoPosition`, `targetLabelDistance`, `targetLabelMaxDistance`, `targetLabelSideOffset`, `targetLabelZIndex`, `sourceLabelXOffset`, `sourceLabelYOffset`, `targetLabelXOffset`, `targetLabelYOffset`, `endpointLabelAutoPosition`, `endpointLabelDistance`, `endpointLabelMaxDistance`, `endpointLabelSideOffset`, `endpointLabelOverlayLayer`, `sourceLabelOverlayLayer`, `targetLabelOverlayLayer`, `interactive`, `interactionWidth`, `labelInteractive`, `display`, `opacity`, `zIndex`.
- `linkDirection` selectors reuse the link stroke, arrow, label, display, opacity, and z-index keys for source-to-target and target-to-source directional lanes.
- Path keys: `labelXOffset`, `labelYOffset`, `label`, `lineColor`, `lineWidth`, `lineStyle`, `lineDashPattern`, `lineDashOffset`, `lineCap`, `lineOpacity`, `curveStyle`, `anchor`, `controlPointStepSize`, `controlPointDistance`, `controlPointWeight`, `edgeDistances`, `segmentDistances`, `segmentWeights`, `taxiDirection`, `taxiTurn`, `taxiTurnMinDistance`, `arrowColor`, `targetArrowShape`, `targetArrowColor`, `targetArrowSize`, `targetArrowOffset`, `sourceArrowShape`, `sourceArrowColor`, `sourceArrowSize`, `sourceArrowOffset`, `labelColor`, `labelFontSize`, `labelFontWeight`, `labelFontStyle`, `labelZIndex`, `sourceLabel`, `sourceLabelZIndex`, `targetLabel`, `targetLabelZIndex`, `sourceLabelXOffset`, `sourceLabelYOffset`, `targetLabelXOffset`, `targetLabelYOffset`, `laneWidth`, `laneGap`, `pipe`, `pipeWidth`, `pipeFill`, `pipeBorderColor`, `pipeBorderWidth`, `pipeOpacity`, `animated`, `interactive`, `display`, `opacity`, `zIndex`.
- Region keys: `shape`, `backgroundColor`, `borderColor`, `borderWidth`, `labelPosition`, `labelMargin`, `labelColor`, `labelBackgroundColor`, `labelFontSize`, `labelFontWeight`, `labelZIndex`, `draggable`, `selectable`, `opacity`, `zIndex`.
- Diagram shape keys: `shape`, `fill`, `stroke`, `strokeWidth`, `backgroundColor`, `borderColor`, `borderWidth`, `rotation`, `boxShadow`, `width`, `height`, `display`, `draggable`, `selectable`, `opacity`, `zIndex`, `labelZIndex`.
- Callout keys: `backgroundColor`, `borderColor`, `borderWidth`, `color`, `titleColor`, `titleBackgroundColor`, `titleFontSize`, `titleFontWeight`, `bodyColor`, `bodyFontSize`, `bodyFontWeight`, `bodyLineHeight`, `textAlign`, `borderRadius`, `boxShadow`, `width`, `height`, `display`, `draggable`, `selectable`, `opacity`, `zIndex`, `labelZIndex`.

## Common Recipes

### Broad Defaults Then Classification

Start with broad defaults, then classify with labels from topology YAML.

```yaml
stylesheet:
  - selector: node
    style:
      icon: router.generic
      width: 82
      height: 60
      labelColor: var(--topoviewer-fg-strong)
  - selector: node[labels.vendor = "nokia"]
    style:
      icon: router.nokia
  - selector: node[labels.role = "leaf"]
    style:
      outlineColor: "#1976d2"
      outlineWidth: 3
```

### Theme-Safe Labels

In MkDocs, Zensical, the harness, and Grafana, prefer TopoViewer CSS variables for labels and surfaces.

```yaml
stylesheet:
  - selector: node
    style:
      labelColor: var(--topoviewer-fg-strong)
      labelBackgroundColor: var(--topoviewer-panel-bg)
  - selector: link
    style:
      labelColor: var(--topoviewer-fg-strong)
      textBackgroundColor: var(--topoviewer-edge-label-bg)
```

### Explicit Dash Pattern And Offset

Use `lineStyle: dashed` for a quick dash. Use `lineDashPattern` and `lineDashOffset` when the exact visual cadence matters.

```yaml
stylesheet:
  - selector: link[labels.direction = "request"]
    style:
      lineWidth: 4
      lineCap: round
      lineDashPattern: 14 6
      lineDashOffset: 0
  - selector: link[labels.direction = "reply"]
    style:
      lineWidth: 4
      lineCap: round
      lineDashPattern: 14 6
      lineDashOffset: 10
```

`14 6` means paint 14px, skip 6px, repeat. `lineDashOffset: 10` shifts the same pattern 10px along the path, which makes opposite-direction or parallel dashed links easier to distinguish.

### Directional Link Strokes

Use `link.directions` in topology YAML when one physical adjacency needs two independently styled telemetry directions. Use the virtual `linkDirection` selector in stylesheet YAML.

```yaml
stylesheet:
  - selector: link
    style:
      directionalStrokes: true
      directionCenterGap: 64
      directionStartGap: 18
  - selector: linkDirection[direction = "sourceToTarget"]
    style:
      lineColor: "#4caf50"
      targetArrowShape: triangle
  - selector: linkDirection[direction = "targetToSource"]
    style:
      lineColor: "#ff9800"
      sourceArrowShape: triangle
      lineStyle: dashed
```

Use direction labels for the value carried by the vector. Use endpoint labels
for the ports attached to the nodes:

```yaml
graph:
  links:
    - id: spine1-leaf1
      source: spine1
      target: leaf1
      sourceLabel: e1-1
      targetLabel: e1-49
      directions:
        sourceToTarget:
          label: "2.4 Gbps"
        targetToSource:
          label: "710 Mbps"
```

## Detailed Reference

Use [Stylesheet Reference](./stylesheet-reference.md) for the generated key table with data types, accepted values, defaults, and target-specific usage. That page is generated from the canonical runtime style defaults registry, so it is the source to use when authoring exact YAML keys.

## Related Examples
