# TopoViewer Stylesheet

TopoViewer uses a selector stylesheet inspired by Cytoscape, then compiles matched rules into React Flow nodes and edges. Do not author React Flow internals directly in topology YAML. Keep graph facts in topology and presentation policy in the stylesheet.

## Top-Level Shape

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

## Selectors

Supported subject kinds:

- `node`
- `link`
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
| `path[labels.protocol ~= "sr-te"]` | List or whitespace-token contains value. |
| `region[id = "as65000"]` | Match direct entity field. |
| `shape[labels.shape = "sap"]` | Style diagram shapes. |
| `callout[labels.callout = "subscriber-subnet"]` | Style rich callout boxes. |
| `callout[labels.callout = "srrp"]` | Style line-only callout relationships. |
| `link[data.metric = "20"]` | Match nested data value. |

Rules are applied in order. Later matching rules override earlier rules. Per-object `style` overrides matched stylesheet values last.

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

`manual` uses supplied positions as-is. `force` treats supplied positions as deterministic seeds and computes a readable layout.

## Node Style Keys

Node `name` and `label` values are rendered as safe inline markdown. Supported label markup is `**bold**`, `*italic*`, `++underline++`, `~~strike~~`, inline code with backticks, links, and images. Raw HTML is escaped.

In MkDocs, prefer theme-aware CSS variables for label colors:

```yaml
stylesheet:
  - selector: node
    style:
      labelColor: var(--topoviewer-fg-strong)
```

Hardcoded pale labels such as `#e5e7eb` look good in dark mode but disappear in light mode because `labelColor` is compiled into an inline style and overrides the theme fallback.

| Key | Values | Use |
|---|---|---|
| `icon` | `string` icon key in `icons` | Selects an icon from `icons`. |
| `iconSize` | `number` (px) | Sets equal icon width and height. |
| `iconWidth`, `iconHeight` | `number` (px), independent axes allowed | Sets asymmetric icon size. |
| `width`, `height` | `number` (px) | Node body size. |
| `shape` | `ellipse`, `triangle`, `rectangle`, `roundRectangle`, `bottomRoundRectangle`, `cutRectangle`, `barrel`, `rhomboid`, `diamond`, `pentagon`, `hexagon`, `concaveHexagon`, `heptagon`, `octagon`, `star`, `tag`, `vee`, `polygon` | Node body shape. |
| `shapePolygonPoints` | `number[]` or string of numbers (`x y x y ...`), even length >= 6, each value `-1..1` | Custom polygon points when `shape: polygon` is used. |
| `backgroundColor` | CSS color | Icon fill/background. |
| `borderColor` | CSS color | Icon border. |
| `borderWidth` | `number` (px, >=0) | Icon border width. |
| `borderStyle` | `solid`, `dashed`, `dotted` | Node body border pattern. |
| `borderDashPattern` | `number`, `number[]`, or space/comma-separated string | Explicit SVG dash pattern for node body border. |
| `borderOpacity` | `number` `0..1` | Node body border opacity. |
| `outlineColor`, `outlineWidth`, `outlineOpacity` | CSS color, `number` (px, >=0), `number` `0..1` | Visual outline around the node body. Does not change geometry. |
| `underlayColor`, `underlayPadding`, `underlayOpacity` | CSS color, `number` (px, >=0), `number` `0..1` | Visual underlay behind the node body. Does not change geometry. |
| `iconColor` | CSS color | Glyph color. |
| `iconOpacity` | `number` `0..1` | Glyph or image opacity. |
| `iconPadding` | `number` (px, >=0) | Insets icon content inside the icon box. |
| `iconFit` | `contain`, `cover`, `fill` | Object-fit behavior for SVG/image icons. |
| `iconBackgroundColor` | CSS color | Background behind icon content inside the node body. |
| `labelColor`, `labelFontSize`, `labelFontWeight` | CSS color, CSS font size, CSS font weight | Node label typography. Use markdown in the node `name` or `label` for bold/italic/underline/strikethrough. |
| `labelPosition` | `top`, `right`, `bottom`, `left`, `center`, plus all region positions | Places the node label. Defaults to `bottom`. |
| `labelXOffset`, `labelYOffset` | `number` (px, can be negative) | Pixel offsets applied after label placement. |
| `labelTextWrap`, `labelTextMaxWidth`, `labelTextOverflow`, `labelTextAlign` | `none`, `wrap`, `number` (px, >=0), `clip`, `ellipsis`, CSS text align | Label wrapping and overflow controls. |
| `labelBackgroundColor`, `labelBackgroundOpacity` | CSS color, `number` `0..1` | Label backing for contrast. |
| `labelBorderColor`, `labelBorderWidth`, `labelPadding`, `labelOpacity` | CSS color, `number` (px), `number` (px), `number` `0..1` | Label box border, padding, and opacity. |
| `minZoomedLabelFontSize` | `number` (px, >=0) | Hide label when effective font is too small at the current zoom. |
| `metaColor`, `metaFontSize`, `metaFontWeight` | CSS color, CSS font size, CSS font weight | Node metadata typography. |
| `badgeLabel`, `badgeColor`, `badgeBackgroundColor`, `badgeBorderColor`, `badgePosition` | `string`/`number` label, CSS colors, `topLeft`, `topRight`, `bottomLeft`, `bottomRight` | Compact node badge. |
| `statusColor`, `statusPlacement`, `statusSize` | CSS color, `topLeft`, `topRight`, `bottomLeft`, `bottomRight`, `center`, `number` (px, >0) | Compact node status marker. |
| `opacity` | `number` `0..1` | Node opacity. |
| `zIndex` | `number` (integer preferred) | Draw order. |
| `display` | `none` | Hide object. |
| `draggable` | `boolean` | Defaults to true. |
| `selectable` | `boolean` | Defaults to true. |

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

## Link and Path Style Keys

Links, paths, and callout lines share the same edge style keys.
Edge labels, including source and target endpoint labels, render when the `showEdgeLabels` toggle is enabled.
TopoViewer style keys are canonical `camelCase` in both TypeScript and Stylesheet YAML.

| Key | Values | Use |
|---|---|---|
| `curveStyle` | `straight`, `haystack`, `segments`, `roundSegments`, `taxi`, `roundTaxi`, `smoothTaxi`, `smoothstep`, `simpleBezier`, `unbundledBezier`, `bezier` (case-insensitive aliases allowed) | Edge route shape. `bezier` separates same-endpoint parallel edges by varying control-point curvature. |
| `anchor` | `floating`, `fixed` | `floating` is default and attaches edges to the visible node icon. |
| `lineColor` | CSS color | Stroke color. |
| `lineWidth` | `number` (px, >=0) | Stroke width. Defaults to 1. |
| `pipe` | `boolean` | Renders a parent link/path as a pipe/corridor. Automatically enabled for links/paths with visible children. |
| `pipeWidth` | `number` (px, >=0) | Width of the parent pipe fill. |
| `pipeFill`, `pipeOpacity` | CSS color, `number` `0..1` | Fill color and opacity for the parent pipe. |
| `pipeBorderColor`, `pipeBorderWidth` | CSS color, `number` (px, >=0) | Outer pipe border styling. |
| `controlPointStepSize` | `number` | Distance between same-endpoint `bezier` edge control points. |
| `controlPointDistance` | `number` | Manual Bezier control-point distance for one edge. |
| `controlPointWeight` | `number` (typically `0..1`) | Control-point weight from source to target. Defaults to `0.5`. |
| `laneWidth`, `laneGap` | `number` (px) | Child link/path lane width and spacing for a parent link/path. |
| `lineStyle` | `solid`, `dashed`, `dotted` | Convenience dash style. |
| `lineDashPattern` | `string`, `number`, or `number[]` | Explicit dash pattern for the edge path, for example `3 6` or `[3, 6]`. |
| `lineDashOffset` | `number` | Dash offset for animated or phase-shifted dashed edges. |
| `lineCap` | `butt`, `round`, `square` | SVG stroke cap style. |
| `lineOpacity` | `number` `0..1` | Edge line opacity without changing label opacity. |
| `lineOutlineWidth` | `number` (px, >=0) | Draws an outline behind the edge line. |
| `lineOutlineColor` | CSS color | Edge line outline color. |
| `targetArrowShape`, `sourceArrowShape` | `none`, `triangle`, `vee`, `tee`, `circle`, `diamond` | Directional arrow marker shape. |
| `arrowColor` | CSS color | Shared marker color fallback. Defaults to line color. |
| `sourceArrowColor`, `targetArrowColor` | CSS color | Directional marker colors. |
| `sourceArrowSize`, `targetArrowSize` | `number` (px, >=0) | Directional marker sizes. |
| `sourceDistanceFromNode`, `targetDistanceFromNode` | `number` (px, >=0) | Moves endpoints inward from node boundary; short edges are clamped. |
| `edgeDistances` | `auto`, `intersection`, `node-position`, `endpoints` | Endpoint anchoring model for React Flow edge types. |
| `segmentDistances`, `segmentWeights` | `number`, `number[]`, or space/comma-separated string | Explicit bend controls for `curveStyle: segments`/`roundSegments`. |
| `taxiDirection` | `auto`, `vertical`, `downward`, `upward`, `horizontal`, `rightward`, `leftward` | Primary direction for `curveStyle: taxi`. |
| `taxiTurn`, `taxiTurnMinDistance` | `number` or percentage string, `number` (px, >=0) | Taxi turn placement and minimum edge length before custom taxi routing applies. |
| `lineFill` | `solid`, `linearGradient` | Stroke fill model. |
| `lineGradientStopColors`, `lineGradientStopPositions` | string list (array/string), percentage list optional | Linear gradient stops when `lineFill: linearGradient`. Positions must match stops count if set. |
| `label` | string | Fallback edge label. |
| `sourceLabel` | string | Label rendered at the source endpoint. |
| `targetLabel` | string | Label rendered at the target endpoint. |
| `sourceLabelXOffset`, `sourceLabelYOffset` | `number` (px) | Pixel offsets applied to source endpoint label. |
| `targetLabelXOffset`, `targetLabelYOffset` | `number` (px) | Pixel offsets applied to target endpoint label. |
| `labelColor`, `labelFontSize`, `labelFontWeight`, `labelFontStyle` | CSS color, font-size, font-weight, font-style | Edge label typography. |
| `labelBorderColor`, `labelBorderWidth` | CSS color, `number` (px) | Shared edge label border. |
| `sourceLabelColor`, `targetLabelColor` | CSS color | Endpoint label color overrides. |
| `sourceLabelBackgroundColor`, `targetLabelBackgroundColor` | CSS color | Endpoint label background overrides. |
| `sourceLabelBorderColor`, `targetLabelBorderColor` | CSS color | Endpoint label border color overrides. |
| `sourceLabelBorderWidth`, `targetLabelBorderWidth` | `number` (px) | Endpoint label border width overrides. |
| `sourceLabelFontSize`, `targetLabelFontSize` | CSS font size | Endpoint label font-size overrides. |
| `sourceLabelFontWeight`, `targetLabelFontWeight` | CSS font weight | Endpoint label font-weight overrides. |
| `sourceLabelFontStyle`, `targetLabelFontStyle` | CSS font style | Endpoint label font-style overrides. |
| `textBackgroundColor`, `textBackgroundOpacity` | CSS color, `number` `0..1` | Edge label backing. |
| `animated` | `boolean` | Enables edge animation. |
| `interactionWidth` | `number` (px, >=12 typical) | Pointer hit area. |
| `interactive` | `boolean` | Set `false` to disable edge click/hover handling. |
| `labelInteractive` | `boolean` | Set `false` to disable pointer events on edge labels. |
| `opacity` | `number` `0..1` | Edge opacity. |
| `zIndex` | `number` (integer preferred) | Draw order. |
| `display` | `none` | Hide object. |

This is a practical TopoViewer subset rather than full Cytoscape edge parity. Self-loop controls, haystack radius, overlay/underlay, ghost effects, radial gradients, and broad transition controls are intentionally not part of the declarative edge surface yet.

## Region Style Keys

| Key | Values | Use |
|---|---|---|
| `backgroundColor` | CSS color | Region fill. |
| `borderColor` | CSS color | Region border. |
| `borderWidth` | `number` (px, >=0) | Region border width. |
| `shape` | `roundrectangle`, `rectangle`, `ellipse` | Region hull shape. |
| `labelColor`, `labelBackgroundColor` | CSS color | Region label treatment. |
| `labelPosition` | `topLeft`, `topCenter`, `topRight`, `rightTop`, `rightCenter`, `rightBottom`, `bottomRight`, `bottomCenter`, `bottomLeft`, `leftTop`, `leftCenter`, `leftBottom` | Region label anchor. Defaults to `topLeft`. |
| `labelMargin` | `number` (px, >=0) | Region label margin from the selected edge. |
| `draggable` | `boolean` | Regions are draggable only when explicitly true. |
| `selectable` | `boolean` | Regions are selectable only when explicitly true. |
| `opacity` | `number` `0..1` | Region opacity. |
| `zIndex` | `number` | Draw order. Defaults behind nodes. |

`labelMargin` moves the label relative to the region border; it does not resize the hull. Use region sizing fields such as `headerPadding`, `paddingX`, and `paddingY` when the label needs reserved interior space away from member nodes.

## Shape Style Keys

Shapes are geometry-only diagram primitives under `diagram.shapes`. Use callouts for labels, rich text, links, and images.

| Key | Values | Use |
|---|---|---|
| `shape` | `circle`, `triangle`, `square`, `rectangle`, `pentagon`, `hexagon`, `octagon`, `ellipse`, `semicircle`, `trapezoid`, `parallelogram`, `rhombus`, `kite`, `star`, `cube`, `cuboid`, `sphere`, `cone`, `cylinder`, `pyramid`, `prism` | Overrides the shape type declared on the object. |
| `width`, `height` | `number` (px) | Default size when the shape does not declare `size`. |
| `fill`, `backgroundColor` | CSS color | Shape fill. |
| `stroke`, `borderColor`, `borderWidth` | CSS color, CSS color, `number` (px, >=0) | Shape outline. |
| `rotation`, `rotate` | `number` (degrees) | Rotates the geometry in degrees around center. |
| `boxShadow` | CSS `box-shadow` | Presentation depth for the shape container. |
| `opacity` | `number` `0..1` | Shape opacity. |
| `zIndex` | `number` | Draw order. |
| `draggable`, `selectable` | `boolean` | Interactive behavior unless the shape is `locked`. |

Supported 2D geometry types are `circle`, `triangle`, `square`, `rectangle`, `pentagon`, `hexagon`, `octagon`, `ellipse`, `semicircle`, `trapezoid`, `parallelogram`, `rhombus`, `kite`, and `star`.

Supported 3D geometry types are `cube`, `cuboid`, `sphere`, `cone`, `cylinder`, `pyramid`, and `prism`.

## Callout Style Keys

Callouts are markdown text boxes and line-only relationships under `diagram.callouts`.

| Key | Values | Use |
|---|---|---|
| `backgroundColor` | CSS color | Callout body fill. |
| `borderColor`, `borderWidth`, `borderRadius` | CSS color, `number` (px), `number` (px) | Callout border treatment. |
| `titleBackgroundColor`, `titleColor`, `titleFontSize`, `titleFontWeight` | CSS color, CSS color, CSS font size, CSS font weight | Header treatment. |
| `bodyColor`, `bodyFontSize`, `bodyFontWeight`, `bodyLineHeight` | CSS color, CSS font size, CSS font weight, CSS line-height | Markdown body treatment. |
| `textAlign`, `align` | `left`, `center`, `right` | Markdown alignment. |
| `boxShadow` | CSS `box-shadow` | Emphasis layer behind the callout. |
| `opacity` | `number` `0..1` | Callout opacity. |
| `zIndex` | `number` | Draw order. |
| `draggable`, `selectable` | `boolean` | Interactive behavior unless the callout is `locked`. |

Callouts that define `source`/`target`, `sourcePosition`, or `targetPosition` use the link/path edge keys above for their line styling.

## Practical Pattern

Use broad defaults first, then classify with labels.

```yaml
stylesheet:
  - selector: node
    style:
      icon: router.generic
      width: 82
      height: 60
  - selector: node[labels.vendor = "nokia"]
    style:
      icon: router.nokia
  - selector: link[labels.protocol = "pcep"]
    style:
      label: PCEP
      curveStyle: unbundled-bezier
      lineColor: '#ffd166'
      lineDashPattern: 3 6
      targetArrowShape: triangle
  - selector: path[labels.protocol = "sr-te"]
    style:
      label: Transport path
      curveStyle: smooth-taxi
      lineColor: '#ff6b9a'
      lineWidth: 3
      animated: true
```
