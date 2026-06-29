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

- Nodes default to `shape: rectangle`, `width: 82`, `height: 60`, `borderWidth: 4`, `labelPosition: bottom`, `badgePosition: topRight`, `statusPlacement: bottomRight`, `draggable: true`, `selectable: true`, and `zIndex: 10`.
- Node `backgroundColor` and `borderColor` are derived from the selected icon's `fill` and `stroke`.
- Links and paths default to `curveStyle: bezier`, `anchor: floating`, `lineColor: #6ea8fe`, `lineWidth: 1`, `lineStyle: solid`, `lineFill: solid`, no arrows, `interactive: true`, `labelInteractive: true`, and `zIndex: 6`. Links with declared `directions` can render `directionalStrokes` with `directionCenterGap: 48` and `directionStartGap: 14`.
- Regions default to `shape: roundRectangle`, `labelPosition: topLeft`, `labelMargin: 12`, `borderWidth: 1`, non-draggable, non-selectable, and `zIndex: -20`.
- Diagram shapes default to `shape: rectangle`, `width: 180`, `height: 72`, `strokeWidth: 2`, draggable, non-selectable, and `zIndex: -10`.
- Callouts default to `width: 320`, `height: 120`, `textAlign: left`, draggable, non-selectable, and `zIndex: 30`.

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

## Style Key Reference

The following sections list the supported style keys by rendered object type. Style keys are canonical `camelCase` in both TypeScript and Stylesheet YAML.

### Node Style Keys

Node `name` and `label` values are rendered as safe inline markdown. Supported label markup is `**bold**`, `*italic*`, `++underline++`, `~~strike~~`, inline code with backticks, links, and images. Raw HTML is escaped.

In MkDocs, prefer theme-aware CSS variables for label colors:

```yaml
stylesheet:
  - selector: node
    style:
      labelColor: var(--topoviewer-fg-strong)
```

Hardcoded pale labels such as `#e5e7eb` look good in dark mode but disappear in light mode because `labelColor` is compiled into an inline style and overrides the theme fallback.

#### Node Sizing

Use `width` and `height` for the visible node body. The node shape, border, underlay, edge anchor, and default icon/image area use this body size.

Use `iconPadding` when the icon glyph or image should sit inside the body with an inset.

If `shape` is omitted, nodes use `rectangle`, so `width` and `height` stretch the body independently. Use `square` or `circle` only when the body must keep a 1:1 aspect ratio. For those aspect-locked shapes, either provide equal `width` and `height`, or provide only one dimension and TopoViewer derives the other. Unequal `width` and `height` on `square` or `circle` is a semantic validation error.

```yaml
stylesheet:
  - selector: node
    style:
      shape: square
      width: 120
      height: 120
```

```yaml
stylesheet:
  - selector: node
    style:
      shape: square
      width: 120
      height: 120
      iconSize: 72
      iconFit: contain
```

#### Icon Fit

`iconFit` controls how SVG and image icons are fitted inside the node body. The node body is the fitting and clipping boundary, so circular and polygonal nodes do not expose a square icon background. Use `iconPadding` when the icon needs inset spacing inside the node boundary.

| Value | Behavior | Use when |
|---|---|---|
| `contain` | Preserves the icon aspect ratio and keeps the full icon visible. Empty space may appear on two sides. | The whole asset must be visible, such as vendor logos or router glyphs. |
| `cover` | Preserves the icon aspect ratio and fills the node body. Parts of the icon may be clipped. | The icon is decorative or crop-safe and should fill the node. |
| `fill` | Stretches the icon to exactly match the node body. Aspect ratio is not preserved. | The SVG was designed for the same box ratio, or intentional stretching is acceptable. |

Use `contain` as the safe default. Use `fill` carefully because it can distort icons when the node body does not match the source SVG viewBox ratio. Some SVG assets also define their own aspect-ratio behavior; when an SVG should visibly stretch under `fill`, author the SVG root with `preserveAspectRatio="none"`.

| Key | Values | Use |
|---|---|---|
| `icon` | icon key | Selects an icon from `icons`. Defaults through `style.icon`, object `icon`, `data.icon`, then `router.generic`. |
| `width`, `height` | number | Visible node body size. Also sets the default edge anchor. Defaults to `82` x `60`. For `square` and `circle`, use equal dimensions, or provide only one dimension and TopoViewer derives the other. Unequal dimensions are invalid for `square` and `circle`. |
| `iconSize` | number | Accepted for compatibility; the current renderer fits icons to the node body. Prefer `iconPadding`. |
| `iconWidth`, `iconHeight` | number | Accepted for compatibility; the current renderer fits icons to the node body. Prefer `iconPadding`. |
| `shape` | `rectangle`, `square`, `circle`, `ellipse`, `triangle`, `roundRectangle`, `bottomRoundRectangle`, `cutRectangle`, `barrel`, `rhomboid`, `diamond`, `pentagon`, `hexagon`, `concaveHexagon`, `heptagon`, `octagon`, `star`, `tag`, `vee`, `polygon` | Node body shape. Defaults to `rectangle`. Use `square` or `circle` only for equal-aspect bodies; use `rectangle` or `ellipse` when the body should intentionally stretch to different `width` and `height` values. |
| `shapePolygonPoints` | number array or string | Custom polygon points when `shape: polygon` is used. |
| `backgroundColor` | CSS color | Icon fill/background. Defaults to the selected icon `fill`. |
| `borderColor` | CSS color | Icon border. Defaults to the selected icon `stroke`. |
| `borderWidth` | number | Icon border width. Defaults to `4`. |
| `borderStyle` | `solid`, `dashed`, `dotted` | Node body border pattern. Defaults to `solid`. |
| `borderDashPattern` | string or number list | Explicit SVG dash pattern for the node body border. |
| `borderOpacity` | number `0..1` | Node body border opacity. |
| `outlineColor`, `outlineWidth`, `outlineOpacity` | CSS color, number, number `0..1` | Visual outline around the node body. Does not change graph geometry. |
| `underlayColor`, `underlayPadding`, `underlayOpacity` | CSS color, number, number `0..1` | Visual underlay behind the node body. Does not change graph geometry. |
| `iconColor` | CSS color | Glyph color. |
| `iconOpacity` | number `0..1` | Icon glyph/image opacity. |
| `iconPadding` | number | Insets icon content inside the node body. |
| `iconFit` | `contain` keeps the full icon visible; `cover` fills the box while preserving aspect ratio and may crop; `fill` stretches to the box and may distort. | Object-fit behavior for SVG/image icons. Defaults through the CSS image default, currently `contain`. |
| `iconBackgroundColor` | CSS color | Background behind icon content inside the node body. |
| `labelColor`, `labelFontSize`, `labelFontWeight` | CSS values | Node label typography. Use markdown in the node `name` or `label` for bold, italic, underline, and strikethrough spans. |
| `labelPosition` | `top`, `right`, `bottom`, `left`, `center` | Places the label relative to the node body. Defaults to `bottom`. |
| `labelXOffset`, `labelYOffset` | number | Pixel offsets applied after label placement. Defaults to `0`. |
| `labelTextWrap`, `labelTextMaxWidth`, `labelTextOverflow`, `labelTextAlign` | `none` or `wrap`, number, `clip` or `ellipsis`, CSS text-align | Label wrapping and overflow controls. |
| `labelBackgroundColor`, `labelBackgroundOpacity` | CSS color, number `0..1` | Label backing for contrast. |
| `labelBorderColor`, `labelBorderWidth`, `labelPadding`, `labelOpacity` | CSS color, number, number, number `0..1` | Label box border, padding, and opacity. |
| `labelZIndex` | number | Draw order for the node label only. Use `zIndex` for the node body. |
| `minZoomedLabelFontSize` | number | Hides the label when viewport zoom would make its effective font smaller than this value. |
| `metaColor`, `metaFontSize`, `metaFontWeight` | CSS values | Node metadata typography. |
| `badgeLabel`, `badgeColor`, `badgeBackgroundColor`, `badgeBorderColor`, `badgePosition` | string/number, CSS colors, position | Compact node badge. Positions are `topLeft`, `topRight`, `bottomLeft`, and `bottomRight`; placement defaults to `topRight`. |
| `statusColor`, `statusPlacement`, `statusSize` | CSS color, position, number | Compact status marker. Placements are `topLeft`, `topRight`, `bottomLeft`, `bottomRight`, and `center`; placement defaults to `bottomRight`. |
| `opacity` | number | Node opacity. |
| `zIndex` | number | Draw order. Defaults to `10`. |
| `display` | `element`, `none` | Hide object with `none`; default is `element`. |
| `draggable` | boolean | Defaults to true. |
| `selectable` | boolean | Defaults to true. |

Use canonical camelCase for multi-word values:

```yaml
stylesheet:
  - selector: node[labels.role = "firewall"]
    style:
      shape: cutRectangle
      backgroundColor: "#fee2e2"
      borderColor: "#b91c1c"
```

Custom polygons use normalized x/y pairs in the `[-1, 1]` coordinate space. Values may be an array of numbers or a space-separated string:

```yaml
stylesheet:
  - selector: node[labels.role = "site"]
    style:
      shape: polygon
      shapePolygonPoints: "0 -1 0.92 -0.12 0.58 1 -0.58 1 -0.92 -0.12"
```

Badges and status markers are intentionally compact. For dense aggregate nodes, TopoViewer can use attention aggregate summary data as defaults: hidden member count becomes a badge, and known worst severity becomes a status color. Explicit stylesheet or per-node style keys override those generated defaults.

### Link and Path Style Keys

Links, paths, callout lines, and virtual `linkDirection` strokes share compatible edge style keys. `linkDirection` applies only to `graph.links[].directions.*` strokes; it does not create another physical link.
Edge labels, including source and target endpoint labels, render when the `showEdgeLabels` toggle is enabled.

| Key | Values | Use |
|---|---|---|
| `curveStyle` | `straight`, `haystack`, `segments`, `taxi`, `smoothTaxi`, `smoothstep`, `simpleBezier`, `unbundledBezier`, `bezier` | Edge route shape. Defaults to `bezier`, which separates same-endpoint parallel edges by varying control-point curvature. |
| `anchor` | `floating`, `fixed` | `floating` is default and attaches edges to the visible node icon. |
| `lineColor` | CSS color | Stroke color. Defaults to `#6ea8fe`. |
| `lineWidth` | number | Stroke width. Defaults to 1. |
| `pipe` | boolean | Renders a parent link/path as a pipe/corridor. Automatically enabled when the object has visible child links or child paths. |
| `pipeWidth` | number | Width of the parent pipe fill. |
| `pipeFill`, `pipeOpacity` | CSS color, number | Fill color and opacity for the parent pipe. |
| `pipeBorderColor`, `pipeBorderWidth` | CSS color, number | Outer pipe border styling. |
| `controlPointStepSize` | number | Distance between same-endpoint `bezier` edge control points. This follows Cytoscape's bundled Bezier edge model. |
| `controlPointDistance` | number | Manual Bezier control-point distance for one edge. Same values intentionally overlap. |
| `controlPointWeight` | number | Control-point weight from source to target. Defaults to `0.5`. |
| `edgeDistances` | `intersection`, `nodePosition`, `endpoints` | Cytoscape-compatible edge distance hint for control-point calculations. |
| `laneWidth`, `laneGap` | number | Child link/path lane width and spacing when it is carried by a parent link or parent path. |
| `lineStyle` | `solid`, `dashed`, `dotted` | Convenience dash style. Defaults to `solid`. Use `lineDashPattern` when you need exact dash/gap lengths. |
| `lineDashPattern` | string or number list | Explicit SVG dash pattern in pixels. Values alternate painted length and gap length: `14 6` means paint 14px, skip 6px, repeat. Equivalent forms are `14 6`, `"14 6"`, or `[14, 6]`. Longer patterns are allowed, for example `16 4 3 4`. |
| `lineDashOffset` | number | Pixel phase shift for `lineDashPattern`. `0` starts the pattern at the edge path start; `10` shifts the same pattern 10px along the path, useful for making parallel or opposite-direction dashed links visibly distinct. |
| `lineCap` | `butt`, `round`, `square` | SVG stroke cap. |
| `lineOpacity` | number | Edge line opacity without changing label opacity. |
| `lineOutlineWidth` | number | Draws an outline behind the edge line. |
| `lineOutlineColor` | CSS color | Edge line outline color. |
| `targetArrowShape`, `sourceArrowShape` | `none`, `triangle`, `vee`, `tee`, `circle`, `diamond` | Directional arrow marker shape. Defaults to `none`. |
| `arrowColor` | CSS color | Shared marker color fallback. Defaults to line color. |
| `sourceArrowColor`, `targetArrowColor` | CSS color | Directional marker colors. |
| `sourceArrowSize`, `targetArrowSize` | number | Directional marker sizes. When omitted, each marker size defaults to the rendered `lineWidth` for that link, path, or `linkDirection` stroke. |
| `sourceArrowOffset`, `targetArrowOffset` | number | Pixel arrowhead offset. Defaults to `0`, which places the arrow tip on the computed stroke endpoint. Directional strokes trim the visible line before the marker body so the line does not paint underneath the arrowhead; positive values inset the arrowhead from the computed endpoint. |
| `sourceDistanceFromNode`, `targetDistanceFromNode` | number | Moves the rendered endpoint inward from the node boundary. Short edges are clamped so the path does not collapse. |
| `directionalStrokes` | boolean | On links with `directions`, render source-to-target and target-to-source as opposing styled strokes on one physical link corridor. Defaults to `false`, but links that declare directions render directional strokes unless explicitly disabled. |
| `directionCenterGap` | number | Gap between opposing direction arrowheads near the link center. Defaults to `48`. |
| `directionStartGap` | number | Inset between the node boundary and each visible directional stroke. Defaults to `14`. |
| `directionLabelPlacement` | `center`, `source`, `target`, `outside` | Placement for directional labels. Defaults to `center`. |
| `directionLabelOffset` | number | Pixel offset for directional labels relative to their stroke. |
| `segmentDistances`, `segmentWeights` | number, number list, or string | Explicit bend controls for `curveStyle: segments`. Distances offset from the source-target line; weights place bends between source `0` and target `1`. |
| `taxiDirection` | `auto`, `vertical`, `downward`, `upward`, `horizontal`, `rightward`, `leftward` | Primary direction for `curveStyle: taxi`. |
| `taxiTurn`, `taxiTurnMinDistance` | number or percentage string, number | Taxi turn placement and minimum edge length before custom taxi routing applies. |
| `lineFill` | `solid`, `linearGradient` | Stroke fill model. Defaults to `solid`. |
| `lineGradientStopColors`, `lineGradientStopPositions` | string list or array | Linear gradient stops when `lineFill: linearGradient`. Positions are optional but must match the number of colors when provided. |
| `label` | string | Fallback edge label. |
| `labelXOffset`, `labelYOffset` | number | Pixel offsets for the center edge label relative to the computed midpoint. Defaults to automatic collision-avoidance on directional links and `(0, 0)` on normal links; explicit `0` pins the label to the midpoint. |
| `sourceLabel` | string | Label rendered at the source endpoint. |
| `targetLabel` | string | Label rendered at the target endpoint. |
| `sourceLabelXOffset`, `sourceLabelYOffset` | number | Pixel offsets applied to the source endpoint label. |
| `targetLabelXOffset`, `targetLabelYOffset` | number | Pixel offsets applied to the target endpoint label. |
| `labelColor`, `labelFontSize`, `labelFontWeight`, `labelFontStyle` | CSS values | Edge label typography. |
| `labelBorderColor`, `labelBorderWidth` | CSS color, number | Shared edge label border. |
| `labelZIndex` | number | Draw order for the center edge label. Also acts as fallback draw order for endpoint labels. Use `zIndex` for the edge line. |
| `sourceLabelColor`, `targetLabelColor` | CSS color | Endpoint label color overrides. |
| `sourceLabelBackgroundColor`, `targetLabelBackgroundColor` | CSS color | Endpoint label background overrides. |
| `sourceLabelBorderColor`, `targetLabelBorderColor` | CSS color | Endpoint label border color overrides. |
| `sourceLabelBorderWidth`, `targetLabelBorderWidth` | number | Endpoint label border width overrides. |
| `sourceLabelFontSize`, `targetLabelFontSize` | CSS value | Endpoint label font-size overrides. |
| `sourceLabelFontWeight`, `targetLabelFontWeight` | CSS value | Endpoint label font-weight overrides. |
| `sourceLabelFontStyle`, `targetLabelFontStyle` | CSS value | Endpoint label font-style overrides. |
| `sourceLabelZIndex`, `targetLabelZIndex` | number | Draw order for endpoint labels. Overrides `labelZIndex` for that endpoint. |
| `textBackgroundColor`, `textBackgroundOpacity` | CSS color, number | Edge label backing. |
| `animated` | boolean | Enables React Flow edge animation. |
| `interactionWidth` | number | Pointer hit area. Defaults to at least `12`. |
| `interactive` | boolean | Set `false` to render the edge without edge click handling. |
| `labelInteractive` | boolean | Set `false` to prevent edge labels from receiving pointer events. |
| `opacity` | number | Edge opacity. |
| `zIndex` | number | Draw order. Defaults to `6`. |
| `display` | `element`, `none` | Hide object with `none`; default is `element`. |

This is a practical TopoViewer subset rather than full Cytoscape edge parity. Self-loop controls, haystack radius, overlay/underlay, ghost effects, radial gradients, and broad transition controls are intentionally not part of the declarative edge surface yet.

### Region Style Keys

| Key | Values | Use |
|---|---|---|
| `backgroundColor` | CSS color | Region fill. Defaults to `rgba(76, 201, 240, 0.12)`. |
| `borderColor` | CSS color | Region border. Defaults to `rgba(76, 201, 240, 0.62)`. |
| `borderWidth` | number | Region border width. Defaults to `1`. |
| `shape` | `roundRectangle`, `rectangle`, `ellipse` | Region hull shape. Defaults to `roundRectangle`. |
| `labelColor`, `labelBackgroundColor` | CSS values | Region label treatment. |
| `labelPosition` | `topLeft`, `topCenter`, `topRight`, `rightTop`, `rightCenter`, `rightBottom`, `bottomRight`, `bottomCenter`, `bottomLeft`, `leftTop`, `leftCenter`, `leftBottom` | Region label anchor. Defaults to `topLeft`. |
| `labelMargin` | number | Region label margin in pixels from the selected region edge. Defaults to `12`. |
| `labelZIndex` | number | Draw order for the region label only. Use `zIndex` for the region hull. |
| `draggable` | boolean | Regions are draggable only when explicitly true. |
| `selectable` | boolean | Regions are selectable only when explicitly true. |
| `opacity` | number | Region opacity. |
| `zIndex` | number | Draw order. Defaults to `-20`, behind nodes. |

`labelMargin` moves the label relative to the region border; it does not resize the hull. Use region sizing fields such as `headerPadding`, `paddingX`, and `paddingY` when the label needs reserved interior space away from member nodes.

### Shape Style Keys

Shapes are geometry-only diagram primitives under `diagram.shapes`. Use callouts for labels, rich text, links, and images.

| Key | Values | Use |
|---|---|---|
| `shape` | Geometry type | Overrides the shape type declared on the object. Defaults through object `type`, then `rectangle`. |
| `width`, `height` | number | Default size when the shape does not declare `size`. Defaults to `180` x `72`. |
| `fill` or `backgroundColor` | CSS color | Shape fill. Defaults to `rgba(38, 54, 72, 0.82)`. |
| `stroke` or `borderColor`, `strokeWidth` or `borderWidth` | CSS color, number | Shape outline. Defaults to `rgba(148, 163, 184, 0.64)` and width `2`. |
| `rotation` or `rotate` | number | Rotates the geometry in degrees around the shape center. Defaults through object `rotation`, then `0`. |
| `boxShadow` | CSS shadow | Presentation depth for the shape container. |
| `opacity` | number | Shape opacity. |
| `labelZIndex` | number | Independent draw order for a shape label where rendered. |
| `zIndex` | number | Draw order. Defaults to `-10`. |
| `display` | `element`, `none` | Hide object with `none`; default is `element`. |
| `draggable`, `selectable` | boolean | Interactive behavior unless the shape is `locked`. |

Supported 2D geometry types are `circle`, `triangle`, `square`, `rectangle`, `pentagon`, `hexagon`, `octagon`, `ellipse`, `semicircle`, `trapezoid`, `parallelogram`, `rhombus`, `kite`, and `star`.

Supported 3D geometry types are `cube`, `cuboid`, `sphere`, `cone`, `cylinder`, `pyramid`, and `prism`.

### Callout Style Keys

Callouts are markdown text boxes and line-only relationships under `diagram.callouts`.

| Key | Values | Use |
|---|---|---|
| `backgroundColor` | CSS color | Callout body fill. |
| `borderColor`, `borderWidth`, `borderRadius` | CSS values | Callout border treatment. |
| `color` | CSS color | Shared callout text color. |
| `titleBackgroundColor`, `titleColor`, `titleFontSize`, `titleFontWeight` | CSS values | Header treatment. |
| `bodyColor`, `bodyFontSize`, `bodyFontWeight`, `bodyLineHeight` | CSS values | Markdown body treatment. |
| `textAlign` or `align` | `left`, `center`, `right` | Markdown alignment. Defaults to `left`. |
| `width`, `height` | number | Default size when the callout does not declare `size`. Defaults to `320` x `120`. |
| `boxShadow` | CSS shadow | Slide-friendly emphasis. |
| `opacity` | number | Callout opacity. |
| `labelZIndex` | number | Independent draw order for a callout label where rendered. |
| `zIndex` | number | Draw order. Defaults to `30`. |
| `display` | `element`, `none` | Hide object with `none`; default is `element`. |
| `draggable`, `selectable` | boolean | Interactive behavior unless the callout is `locked`. |

Callouts that define `source`/`target`, `sourcePosition`, or `targetPosition` use the link/path edge keys above for their line styling.

## Related Examples

- [Arrows, dashes, and labels](reference/edges/arrows-dashes-labels/index.md)
- [Directional link strokes](reference/edges/directional-link-strokes/index.md)
- [Icon fit and badges](reference/nodes/icon-fit-and-badges/index.md)
- [Region label placement](reference/regions/region-label-placement/index.md)
