# Node Style Keys

[Style key lookup](../stylesheet-reference.md) · [Stylesheet recipes](../topoviewer-stylesheet.md)

Use the `node` selector subject. Appearance belongs in stylesheet rules; stable IDs and relationships belong in topology YAML.

## `backgroundColor`

Node body fill.

**Type:** color. **Values:** Any CSS color or supported theme variable.

**Default:** Falls back to the selected icon fill. Fallback: `#6ea8fe`.

## `badgeBackgroundColor`

Compact node badge background color.

**Type:** color. **Values:** Any CSS color or supported theme variable.

**Default:** No TopoViewer default; authored only.

## `badgeBorderColor`

Compact node badge border color.

**Type:** color. **Values:** Any CSS color or supported theme variable.

**Default:** No TopoViewer default; authored only.

## `badgeBorderWidth`

Compact node badge border width.

**Type:** integer. **Values:** Finite integer >= 0.

**Default:** Falls back to the compact badge CSS border width. Fallback: `1`.

## `badgeColor`

Compact node badge text color.

**Type:** color. **Values:** Any CSS color or supported theme variable.

**Default:** No TopoViewer default; authored only.

## `badgeFontSize`

Compact node badge font size.

**Type:** integer. **Values:** Finite integer >= 0.

**Default:** Falls back to the compact badge CSS font size. Fallback: `9`.

## `badgeFontWeight`

Compact node badge font weight.

**Type:** text. **Values:** String value.

**Default:** Falls back to the compact badge CSS font weight. Fallback: `850`.

## `badgeLabel`

Compact node badge label.

**Type:** text. **Values:** String value.

**Default:** Aggregate nodes can derive badge text from hidden member count.

## `badgeMinHeight`

Compact node badge minimum height.

**Type:** integer. **Values:** Finite integer >= 0.

**Default:** Falls back to the compact badge CSS minimum height. Fallback: `16`.

## `badgeMinWidth`

Compact node badge minimum width.

**Type:** integer. **Values:** Finite integer >= 0.

**Default:** Falls back to the compact badge CSS minimum width. Fallback: `16`.

## `badgeOffset`

Corner offset used for positioned node badges.

**Type:** integer. **Values:** Finite integer >= 0.

**Default:** Falls back to the compact badge CSS corner offset. Fallback: `7`.

## `badgePadding`

Compact node badge padding.

**Type:** integer. **Values:** Finite integer >= 0.

**Default:** Falls back to the compact badge CSS padding. Fallback: `2`.

## `badgePosition`

Compact node badge placement.

**Type:** enum. **Values:** `topLeft`, `topRight`, `bottomLeft`, `bottomRight`

**Default:** Defaults to `topRight`.

## `borderColor`

Node body border color.

**Type:** color. **Values:** Any CSS color or supported theme variable.

**Default:** Falls back to the selected icon stroke. Fallback: `#d8e8ff`.

## `borderDashPattern`

Explicit SVG dash pattern for the node body border.

**Type:** numberList. **Values:** Space-separated string, comma-separated string, number, or number array.

**Default:** No TopoViewer default; authored only.

## `borderOpacity`

Node body border opacity.

**Type:** number. **Values:** Finite number from 0 to 1, inclusive.

**Default:** No TopoViewer default; authored only.

## `borderStyle`

Node body border pattern.

**Type:** enum. **Values:** `solid`, `dashed`, `dotted`

**Default:** Defaults to `solid`.

## `borderWidth`

Node body border width.

**Type:** integer. **Values:** Finite integer number.

**Default:** Defaults to `4`.

## `display`

Set none to hide the node.

**Type:** enum. **Values:** `element`, `none`

**Default:** Defaults to `element`.

## `draggable`

Whether the node can be dragged.

**Type:** boolean. **Values:** `true`, `false`

**Default:** Defaults to `true`.

## `height`

Visible node body height.

**Type:** integer. **Values:** Finite integer number.

**Default:** Defaults to `60`.

## `icon`

Icon key selected from icons.

**Type:** text. **Values:** String value.

**Default:** Falls back to router.generic when no icon is selected. Fallback: `router.generic`.

## `iconBackgroundColor`

Background behind icon content inside the node body.

**Type:** color. **Values:** Any CSS color or supported theme variable.

**Default:** No TopoViewer default; authored only.

## `iconColor`

Text glyph color.

**Type:** color. **Values:** Any CSS color or supported theme variable.

**Default:** No TopoViewer default; authored only.

## `iconFit`

Object-fit behavior for SVG/image icons.

**Type:** enum. **Values:** `contain`, `cover`, `fill`

**Default:** Falls back to the stylesheet image default. Fallback: `contain`.

## `iconHeight`

Accepted for compatibility; the current renderer fits icons to the node body. Prefer iconPadding.

**Type:** integer. **Values:** Finite integer number.

**Default:** No TopoViewer default; authored only.

## `iconOpacity`

Icon glyph/image opacity.

**Type:** number. **Values:** Finite number from 0 to 1, inclusive.

**Default:** No TopoViewer default; authored only.

## `iconPadding`

Insets icon content inside the node body.

**Type:** integer. **Values:** Finite integer >= 0.

**Default:** No TopoViewer default; authored only.

## `iconSize`

Accepted for compatibility; the current renderer fits icons to the node body. Prefer iconPadding.

**Type:** integer. **Values:** Finite integer number.

**Default:** No TopoViewer default; authored only.

## `iconWidth`

Accepted for compatibility; the current renderer fits icons to the node body. Prefer iconPadding.

**Type:** integer. **Values:** Finite integer number.

**Default:** No TopoViewer default; authored only.

## `labelBackgroundColor`

Node label background color.

**Type:** color. **Values:** Any CSS color or supported theme variable.

**Default:** No TopoViewer default; authored only.

## `labelBackgroundOpacity`

Node label background opacity.

**Type:** number. **Values:** Finite number from 0 to 1, inclusive.

**Default:** No TopoViewer default; authored only.

## `labelBorderColor`

Node label border color.

**Type:** color. **Values:** Any CSS color or supported theme variable.

**Default:** No TopoViewer default; authored only.

## `labelBorderWidth`

Node label border width.

**Type:** integer. **Values:** Finite integer >= 0.

**Default:** Falls back to the node label CSS border width. Fallback: `0`.

## `labelCollisionPolicy`

How node labels and metadata behave when automatic placement cannot avoid overlap.

**Type:** enum. **Values:** `none`, `avoid`, `fade`, `hide`

**Default:** Defaults to `avoid`.

## `labelColor`

Node label color.

**Type:** color. **Values:** Any CSS color or supported theme variable.

**Default:** Falls back to --topoviewer-fg-strong.

## `labelFontSize`

Node label font size.

**Type:** integer. **Values:** Finite integer number.

**Default:** Falls back to the node label CSS font size. Fallback: `10`.

## `labelFontWeight`

Node label font weight.

**Type:** text. **Values:** String value.

**Default:** Falls back to the node label CSS font weight. Fallback: `620`.

## `labelOpacity`

Node label opacity.

**Type:** number. **Values:** Finite number from 0 to 1, inclusive.

**Default:** No TopoViewer default; authored only.

## `labelPadding`

Node label padding.

**Type:** integer. **Values:** Finite integer >= 0.

**Default:** No TopoViewer default; authored only.

## `labelPosition`

Node label placement.

**Type:** enum. **Values:** `top`, `right`, `bottom`, `left`, `center`

**Default:** Defaults to `bottom`.

## `labelTextAlign`

Node label text alignment.

**Type:** enum. **Values:** `left`, `center`, `right`

**Default:** Falls back to centered node label text. Fallback: `center`.

## `labelTextMaxWidth`

Node label maximum width.

**Type:** integer. **Values:** Finite integer >= 0.

**Default:** No TopoViewer default; authored only.

## `labelTextOverflow`

Node label overflow behavior.

**Type:** enum. **Values:** `clip`, `ellipsis`

**Default:** No TopoViewer default; authored only.

## `labelTextWrap`

Node label wrapping behavior.

**Type:** enum. **Values:** `none`, `wrap`

**Default:** No TopoViewer default; authored only.

## `labelXOffset`

Pixel X offset after node label placement.

**Type:** integer. **Values:** Finite integer number.

**Default:** Defaults to `0`.

## `labelYOffset`

Pixel Y offset after node label placement.

**Type:** integer. **Values:** Finite integer number.

**Default:** Defaults to `0`.

## `labelZIndex`

Independent draw order for the node label.

**Type:** integer. **Values:** Finite integer number.

**Default:** No TopoViewer default; authored only.

## `metaColor`

Node metadata color.

**Type:** color. **Values:** Any CSS color or supported theme variable.

**Default:** No TopoViewer default; authored only.

## `metaFontSize`

Node metadata font size.

**Type:** integer. **Values:** Finite integer number.

**Default:** No TopoViewer default; authored only.

## `metaFontWeight`

Node metadata font weight.

**Type:** text. **Values:** String value.

**Default:** No TopoViewer default; authored only.

## `metaZIndex`

Independent draw order for node metadata when rendered as a collision-managed overlay.

**Type:** integer. **Values:** Finite integer number.

**Default:** No TopoViewer default; authored only.

## `minZoomedLabelFontSize`

Hide label below this effective zoomed font size.

**Type:** integer. **Values:** Finite integer >= 0.

**Default:** No TopoViewer default; authored only.

## `nodeLayout`

Nested node content layout. Use type standard for the normal node body or type card with explicit shape: roundRectangle. Supported values are type standard or card, horizontal direction, left icon placement, and left, center, or right content alignment.

**Type:** object. **Values:** Any valid value for the documented data type.

**Default:** No TopoViewer default; authored only.

## `opacity`

Node opacity.

**Type:** number. **Values:** Finite number.

**Default:** No TopoViewer default; authored only.

## `outlineColor`

Visual outline color around the node body.

**Type:** color. **Values:** Any CSS color or supported theme variable.

**Default:** No TopoViewer default; authored only.

## `outlineOpacity`

Visual outline opacity around the node body.

**Type:** number. **Values:** Finite number from 0 to 1, inclusive.

**Default:** No TopoViewer default; authored only.

## `outlineWidth`

Visual outline width around the node body.

**Type:** integer. **Values:** Finite integer >= 0.

**Default:** No TopoViewer default; authored only.

## `selectable`

Whether the node can be selected.

**Type:** boolean. **Values:** `true`, `false`

**Default:** Defaults to `true`.

## `shape`

Node body shape.

**Type:** enum. **Values:** `rectangle`, `square`, `circle`, `ellipse`, `triangle`, `roundRectangle`, `bottomRoundRectangle`, `cutRectangle`, `barrel`, `rhomboid`, `diamond`, `pentagon`, `hexagon`, `concaveHexagon`, `heptagon`, `octagon`, `star`, `tag`, `vee`, `polygon`

**Default:** Defaults to `rectangle`.

## `shapePolygonPoints`

Custom polygon points when shape is polygon.

**Type:** text. **Values:** String value.

**Default:** No TopoViewer default; authored only.

## `statusColor`

Compact status marker color.

**Type:** color. **Values:** Any CSS color or supported theme variable.

**Default:** Falls back to the semantic severity resolved from status, severity, or legacy health fields.

## `statusPlacement`

Compact status marker placement.

**Type:** enum. **Values:** `topLeft`, `topRight`, `bottomLeft`, `bottomRight`, `center`

**Default:** Defaults to `bottomRight`.

## `statusSize`

Compact status marker size.

**Type:** integer. **Values:** Finite integer >= 0.

**Default:** No TopoViewer default; authored only.

## `underlayColor`

Visual underlay fill behind the node body.

**Type:** color. **Values:** Any CSS color or supported theme variable.

**Default:** No TopoViewer default; authored only.

## `underlayOpacity`

Visual underlay opacity.

**Type:** number. **Values:** Finite number from 0 to 1, inclusive.

**Default:** No TopoViewer default; authored only.

## `underlayPadding`

Visual underlay padding around the node body.

**Type:** integer. **Values:** Finite integer >= 0.

**Default:** No TopoViewer default; authored only.

## `width`

Visible node body width.

**Type:** integer. **Values:** Finite integer number.

**Default:** Defaults to `82`.

## `zIndex`

Draw order for the node body.

**Type:** integer. **Values:** Finite integer number.

**Default:** Defaults to `10`.
