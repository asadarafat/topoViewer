# Shape Style Keys

[Style key lookup](../stylesheet-reference.md) · [Stylesheet recipes](../topoviewer-stylesheet.md)

Use the `shape` selector subject. Appearance belongs in stylesheet rules; stable IDs and relationships belong in topology YAML.

## `backgroundColor`

Alias-style fill input for shape fill.

**Type:** color. **Values:** Any CSS color or supported theme variable.

**Default:** Falls back to fill when authored.

## `borderColor`

Alias-style stroke input for shape stroke.

**Type:** color. **Values:** Any CSS color or supported theme variable.

**Default:** Falls back to stroke when authored.

## `borderWidth`

Alias-style stroke width input for shape stroke width.

**Type:** integer. **Values:** Finite integer number.

**Default:** Falls back to strokeWidth when authored.

## `boxShadow`

Presentation depth for the shape container.

**Type:** text. **Values:** String value.

**Default:** No TopoViewer default; authored only.

## `display`

Set none to hide the shape.

**Type:** enum. **Values:** `element`, `none`

**Default:** Defaults to `element`.

## `draggable`

Whether the shape can be dragged unless locked.

**Type:** boolean. **Values:** `true`, `false`

**Default:** Defaults to `true`.

## `fill`

Shape fill.

**Type:** color. **Values:** Any CSS color or supported theme variable.

**Default:** Defaults to `rgba(38, 54, 72, 0.82)`.

## `height`

Diagram shape height.

**Type:** integer. **Values:** Finite integer number.

**Default:** Defaults to `72`.

## `labelZIndex`

Independent draw order for a shape label where rendered.

**Type:** integer. **Values:** Finite integer number.

**Default:** No TopoViewer default; authored only.

## `opacity`

Shape opacity.

**Type:** number. **Values:** Finite number.

**Default:** No TopoViewer default; authored only.

## `rotation`

Geometry rotation in degrees.

**Type:** integer. **Values:** Finite integer number.

**Default:** Defaults to `0`.

## `selectable`

Whether the shape can be selected unless locked.

**Type:** boolean. **Values:** `true`, `false`

**Default:** Defaults to `false`.

## `shape`

Diagram shape geometry.

**Type:** enum. **Values:** `circle`, `triangle`, `square`, `rectangle`, `pentagon`, `hexagon`, `octagon`, `ellipse`, `semicircle`, `trapezoid`, `parallelogram`, `rhombus`, `kite`, `star`, `cube`, `cuboid`, `sphere`, `cone`, `cylinder`, `pyramid`, `prism`

**Default:** Defaults to `rectangle`.

## `stroke`

Shape stroke.

**Type:** color. **Values:** Any CSS color or supported theme variable.

**Default:** Defaults to `rgba(148, 163, 184, 0.64)`.

## `strokeWidth`

Shape stroke width.

**Type:** integer. **Values:** Finite integer number.

**Default:** Defaults to `2`.

## `width`

Diagram shape width.

**Type:** integer. **Values:** Finite integer number.

**Default:** Defaults to `180`.

## `zIndex`

Draw order for the shape.

**Type:** integer. **Values:** Finite integer number.

**Default:** Defaults to `-10`.
