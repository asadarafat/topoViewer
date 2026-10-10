# Region Style Keys

[Style key lookup](../stylesheet-reference.md) · [Stylesheet recipes](../topoviewer-stylesheet.md)

Use the `region` selector subject. Appearance belongs in stylesheet rules; stable IDs and relationships belong in topology YAML.

## `backgroundColor`

Region fill.

**Type:** color. **Values:** Any CSS color or supported theme variable.

**Default:** Defaults to `rgba(76, 201, 240, 0.12)`.

## `borderColor`

Region border color.

**Type:** color. **Values:** Any CSS color or supported theme variable.

**Default:** Defaults to `rgba(76, 201, 240, 0.62)`.

## `borderWidth`

Region border width.

**Type:** integer. **Values:** Finite integer number.

**Default:** Defaults to `1`.

## `draggable`

Whether the region hull can be dragged.

**Type:** boolean. **Values:** `true`, `false`

**Default:** Defaults to `false`.

## `headerPadding`

Extra auto-fit space above members for the region label or nested content.

**Type:** integer. **Values:** Finite integer number.

**Default:** Defaults to 88 for an auto-fit region with child regions and 0 otherwise. Fallback: `0`.

## `height`

Explicit region height. Author both width and height to replace member-derived auto-fit geometry.

**Type:** integer. **Values:** Finite integer number.

**Default:** No TopoViewer default; authored only.

## `labelBackgroundColor`

Region label background.

**Type:** color. **Values:** Any CSS color or supported theme variable.

**Default:** No TopoViewer default; authored only.

## `labelCollisionPolicy`

How the region label behaves when automatic placement cannot avoid overlap.

**Type:** enum. **Values:** `none`, `avoid`, `fade`, `hide`

**Default:** Defaults to `avoid`.

## `labelColor`

Region label color.

**Type:** color. **Values:** Any CSS color or supported theme variable.

**Default:** Falls back to region label CSS/theme styling.

## `labelFontSize`

Region label font size.

**Type:** integer. **Values:** Finite integer number.

**Default:** No TopoViewer default; authored only.

## `labelFontWeight`

Region label font weight.

**Type:** text. **Values:** String value.

**Default:** No TopoViewer default; authored only.

## `labelMargin`

Region label margin from the selected region edge.

**Type:** integer. **Values:** Finite integer >= 0.

**Default:** Defaults to `12`.

## `labelPosition`

Region label anchor.

**Type:** enum. **Values:** `topLeft`, `topCenter`, `topRight`, `rightTop`, `rightCenter`, `rightBottom`, `bottomRight`, `bottomCenter`, `bottomLeft`, `leftTop`, `leftCenter`, `leftBottom`

**Default:** Defaults to `topLeft`.

## `labelZIndex`

Independent draw order for the region label.

**Type:** integer. **Values:** Finite integer number.

**Default:** No TopoViewer default; authored only.

## `minHeight`

Minimum height of a member-derived region hull.

**Type:** integer. **Values:** Finite integer number.

**Default:** Defaults to `120`.

## `minWidth`

Minimum width of a member-derived region hull.

**Type:** integer. **Values:** Finite integer number.

**Default:** Defaults to `180`.

## `nodeHeight`

Fallback member height used only when auto-fitting a region cannot read a rendered node height.

**Type:** integer. **Values:** Finite integer number.

**Default:** Defaults to `74`.

## `nodeWidth`

Fallback member width used only when auto-fitting a region cannot read a rendered node width.

**Type:** integer. **Values:** Finite integer number.

**Default:** Defaults to `88`.

## `opacity`

Region opacity.

**Type:** number. **Values:** Finite number.

**Default:** No TopoViewer default; authored only.

## `padding`

Shared auto-fit space around region members.

**Type:** integer. **Values:** Finite integer number.

**Default:** Defaults to `88`.

## `paddingX`

Horizontal auto-fit space around region members.

**Type:** integer. **Values:** Finite integer number.

**Default:** Falls back to hull padding. Fallback: `88`.

## `paddingY`

Vertical auto-fit space around region members.

**Type:** integer. **Values:** Finite integer number.

**Default:** Falls back to hull padding. Fallback: `88`.

## `parentPadding`

Shared auto-fit space around child regions.

**Type:** integer. **Values:** Finite integer number.

**Default:** Defaults to `42`.

## `parentPaddingX`

Horizontal auto-fit space around child regions.

**Type:** integer. **Values:** Finite integer number.

**Default:** Falls back to nested region padding. Fallback: `42`.

## `parentPaddingY`

Vertical auto-fit space around child regions.

**Type:** integer. **Values:** Finite integer number.

**Default:** Falls back to nested region padding. Fallback: `42`.

## `selectable`

Whether the region hull can be selected.

**Type:** boolean. **Values:** `true`, `false`

**Default:** Defaults to `false`.

## `shape`

Region hull shape.

**Type:** enum. **Values:** `roundRectangle`, `rectangle`, `ellipse`

**Default:** Defaults to `roundRectangle`.

## `width`

Explicit region width. Author both width and height to replace member-derived auto-fit geometry.

**Type:** integer. **Values:** Finite integer number.

**Default:** No TopoViewer default; authored only.

## `zIndex`

Draw order for the region hull.

**Type:** integer. **Values:** Finite integer number.

**Default:** Defaults to `-20`.
