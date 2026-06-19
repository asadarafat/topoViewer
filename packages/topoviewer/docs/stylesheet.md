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
| `icon` | icon key | Selects an icon from `icons`. |
| `iconSize` | number | Sets equal icon width and height. |
| `iconWidth`, `iconHeight` | number | Sets asymmetric icon size. |
| `width`, `height` | number | Node body size. |
| `shape` | node shape name | Node body shape. |
| `shapePolygonPoints` | number array or string | Custom polygon points when `shape: polygon` is used. |
| `backgroundColor` | CSS color | Icon fill/background. |
| `borderColor` | CSS color | Icon border. |
| `borderWidth` | number | Icon border width. |
| `iconColor` | CSS color | Glyph color. |
| `labelColor`, `labelFontSize`, `labelFontWeight` | CSS values | Node label typography. Use markdown in the node `name` or `label` for bold, italic, underline, and strikethrough spans. |
| `metaColor`, `metaFontSize`, `metaFontWeight` | CSS values | Node metadata typography. |
| `opacity` | number | Node opacity. |
| `zIndex` | number | Draw order. |
| `display` | `none` | Hide object. |
| `draggable` | boolean | Defaults to true. |
| `selectable` | boolean | Defaults to true. |

Supported node body shapes are `ellipse`, `triangle`, `rectangle`, `roundRectangle`, `bottomRoundRectangle`, `cutRectangle`, `barrel`, `rhomboid`, `diamond`, `pentagon`, `hexagon`, `concaveHexagon`, `heptagon`, `octagon`, `star`, `tag`, `vee`, and `polygon`.

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

## Link and Path Style Keys

Links, paths, and callout lines share the same edge style keys.
Edge labels, including source and target endpoint labels, render when the `showEdgeLabels` toggle is enabled.
TopoViewer style keys are canonical `camelCase` in both TypeScript and Stylesheet YAML.

| Key | Values | Use |
|---|---|---|
| `curveStyle` | `straight`, `haystack`, `segments`, `taxi`, `smooth-taxi`, `smoothstep`, `simplebezier`, `unbundled-bezier`, `bezier` | Edge route shape. `bezier` separates same-endpoint parallel edges by varying control-point curvature. |
| `anchor` | `floating`, `fixed` | `floating` is default and attaches edges to the visible node icon. |
| `lineColor` | CSS color | Stroke color. |
| `lineWidth` | number | Stroke width. Defaults to 1. |
| `pipe` | boolean | Renders a parent link/path as a pipe/corridor. Automatically enabled when the object has visible child links or child paths. |
| `pipeWidth` | number | Width of the parent pipe fill. |
| `pipeFill`, `pipeOpacity` | CSS color, number | Fill color and opacity for the parent pipe. |
| `pipeBorderColor`, `pipeBorderWidth` | CSS color, number | Outer pipe border styling. |
| `controlPointStepSize` | number | Distance between same-endpoint `bezier` edge control points. This follows Cytoscape's bundled Bezier edge model. |
| `controlPointDistance` | number | Manual Bezier control-point distance for one edge. Same values intentionally overlap. |
| `controlPointWeight` | number | Control-point weight from source to target. Defaults to `0.5`. |
| `laneWidth`, `laneGap` | number | Child link/path lane width and spacing when it is carried by a parent link or parent path. |
| `lineStyle` | `solid`, `dashed`, `dotted` | Convenience dash style. |
| `lineDashPattern` | string or number list | Explicit SVG dash pattern, for example `3 6` or `[3, 6]`. |
| `lineDashOffset` | number | Dash offset for animated or phase-shifted dashed edges. |
| `lineCap` | `butt`, `round`, `square` | SVG stroke cap. |
| `lineOpacity` | number | Edge line opacity without changing label opacity. |
| `lineOutlineWidth` | number | Draws an outline behind the edge line. |
| `lineOutlineColor` | CSS color | Edge line outline color. |
| `targetArrowShape`, `sourceArrowShape` | `none`, `triangle` | Arrow marker. Any non-none value renders an arrow. |
| `arrowColor` | CSS color | Marker color. Defaults to line color. |
| `label` | string | Fallback edge label. |
| `sourceLabel` | string | Label rendered at the source endpoint. |
| `targetLabel` | string | Label rendered at the target endpoint. |
| `sourceLabelXOffset`, `sourceLabelYOffset` | number | Pixel offsets applied to the source endpoint label. |
| `targetLabelXOffset`, `targetLabelYOffset` | number | Pixel offsets applied to the target endpoint label. |
| `labelColor`, `labelFontSize`, `labelFontWeight` | CSS values | Edge label typography. |
| `textBackgroundColor`, `textBackgroundOpacity` | CSS color, number | Edge label backing. |
| `animated` | boolean | Enables React Flow edge animation. |
| `interactionWidth` | number | Pointer hit area. Defaults to at least 12. |
| `opacity` | number | Edge opacity. |
| `zIndex` | number | Draw order. |
| `display` | `none` | Hide object. |

## Region Style Keys

| Key | Values | Use |
|---|---|---|
| `backgroundColor` | CSS color | Region fill. |
| `borderColor` | CSS color | Region border. |
| `borderWidth` | number | Region border width. |
| `shape` | `roundrectangle`, `rectangle`, `ellipse` | Region hull shape. |
| `labelColor`, `labelBackgroundColor` | CSS values | Region label treatment. |
| `draggable` | boolean | Regions are draggable only when explicitly true. |
| `selectable` | boolean | Regions are selectable only when explicitly true. |
| `opacity` | number | Region opacity. |
| `zIndex` | number | Draw order. Defaults behind nodes. |

## Shape Style Keys

Shapes are geometry-only diagram primitives under `diagram.shapes`. Use callouts for labels, rich text, links, and images.

| Key | Values | Use |
|---|---|---|
| `shape` | Geometry type | Overrides the shape type declared on the object. |
| `width`, `height` | number | Default size when the shape does not declare `size`. |
| `fill` or `backgroundColor` | CSS color | Shape fill. |
| `stroke` or `borderColor`, `borderWidth` | CSS color, number | Shape outline. |
| `rotation` or `rotate` | number | Rotates the geometry in degrees around the shape center. |
| `boxShadow` | CSS shadow | Presentation depth for the shape container. |
| `opacity` | number | Shape opacity. |
| `zIndex` | number | Draw order. |
| `draggable`, `selectable` | boolean | Interactive behavior unless the shape is `locked`. |

Supported 2D geometry types are `circle`, `triangle`, `square`, `rectangle`, `pentagon`, `hexagon`, `octagon`, `ellipse`, `semicircle`, `trapezoid`, `parallelogram`, `rhombus`, `kite`, and `star`.

Supported 3D geometry types are `cube`, `cuboid`, `sphere`, `cone`, `cylinder`, `pyramid`, and `prism`.

## Callout Style Keys

Callouts are markdown text boxes and line-only relationships under `diagram.callouts`.

| Key | Values | Use |
|---|---|---|
| `backgroundColor` | CSS color | Callout body fill. |
| `borderColor`, `borderWidth`, `borderRadius` | CSS values | Callout border treatment. |
| `titleBackgroundColor`, `titleColor`, `titleFontSize`, `titleFontWeight` | CSS values | Header treatment. |
| `bodyColor`, `bodyFontSize`, `bodyFontWeight`, `bodyLineHeight` | CSS values | Markdown body treatment. |
| `textAlign` or `align` | `left`, `center`, `right` | Markdown alignment. |
| `boxShadow` | CSS shadow | Slide-friendly emphasis. |
| `opacity` | number | Callout opacity. |
| `zIndex` | number | Draw order. |
| `draggable`, `selectable` | boolean | Interactive behavior unless the callout is `locked`. |

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
