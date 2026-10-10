# Text Style Keys

[Style key lookup](../stylesheet-reference.md) · [Stylesheet recipes](../topoviewer-stylesheet.md)

Use the `text` selector subject. Appearance belongs in stylesheet rules; stable IDs and relationships belong in topology YAML.

## `backgroundColor`

Optional text-box background color.

**Type:** color. **Values:** Any CSS color or supported theme variable.

**Default:** Defaults to `transparent`.

## `borderColor`

Optional text-box border color.

**Type:** color. **Values:** Any CSS color or supported theme variable.

**Default:** Defaults to `transparent`.

## `borderRadius`

Text-box corner radius.

**Type:** integer. **Values:** Finite integer number.

**Default:** Defaults to `0`.

## `borderWidth`

Text-box border width.

**Type:** integer. **Values:** Finite integer number.

**Default:** Defaults to `0`.

## `color`

Standalone text color.

**Type:** color. **Values:** Any CSS color or supported theme variable.

**Default:** Defaults to `#172033`.

## `display`

Set none to hide the text object.

**Type:** enum. **Values:** `element`, `none`

**Default:** Defaults to `element`.

## `draggable`

Whether the text object can be dragged unless locked.

**Type:** boolean. **Values:** `true`, `false`

**Default:** Defaults to `true`.

## `fontFamily`

Standalone text font family.

**Type:** text. **Values:** String value.

**Default:** Falls back to the host sans-serif stack.

## `fontSize`

Standalone text font size.

**Type:** integer. **Values:** Finite integer number.

**Default:** Defaults to `18`.

## `fontStyle`

Standalone text font style.

**Type:** enum. **Values:** `normal`, `italic`, `oblique`

**Default:** Defaults to `normal`.

## `fontWeight`

Standalone text font weight.

**Type:** text. **Values:** String value.

**Default:** Defaults to `500`.

## `height`

Optional fixed text-box height; unset text auto-fits its content.

**Type:** integer. **Values:** Finite integer number.

**Default:** Auto-fits content until a height is set.

## `lineHeight`

Standalone text line-height multiplier.

**Type:** number. **Values:** Finite number.

**Default:** Defaults to `1.25`.

## `opacity`

Text-object opacity.

**Type:** number. **Values:** Finite number.

**Default:** No TopoViewer default; authored only.

## `padding`

Text-box inner padding.

**Type:** integer. **Values:** Finite integer number.

**Default:** Defaults to `4`.

## `rotation`

Text-box rotation in degrees.

**Type:** integer. **Values:** Finite integer number.

**Default:** Defaults to `0`.

## `selectable`

Whether the text object can be selected unless locked.

**Type:** boolean. **Values:** `true`, `false`

**Default:** Defaults to `true`.

## `textAlign`

Horizontal alignment inside the text box.

**Type:** enum. **Values:** `left`, `center`, `right`

**Default:** Defaults to `left`.

## `verticalAlign`

Vertical alignment inside the text box.

**Type:** enum. **Values:** `top`, `middle`, `bottom`

**Default:** Defaults to `top`.

## `width`

Optional fixed text-box width; unset text auto-fits its content.

**Type:** integer. **Values:** Finite integer number.

**Default:** Auto-fits content until a width is set.

## `zIndex`

Draw order for the text object.

**Type:** integer. **Values:** Finite integer number.

**Default:** Defaults to `20`.
