# Callout Style Keys

[Style key lookup](../stylesheet-reference.md) · [Stylesheet recipes](../topoviewer-stylesheet.md)

Use the `callout` selector subject. Appearance belongs in stylesheet rules; stable IDs and relationships belong in topology YAML.

## `backgroundColor`

Callout body fill.

**Type:** color. **Values:** Any CSS color or supported theme variable.

**Default:** No TopoViewer default; authored only.

## `bodyColor`

Callout body text color.

**Type:** color. **Values:** Any CSS color or supported theme variable.

**Default:** Falls back to shared text color.

## `bodyFontSize`

Callout body font size.

**Type:** integer. **Values:** Finite integer number.

**Default:** No TopoViewer default; authored only.

## `bodyFontWeight`

Callout body font weight.

**Type:** text. **Values:** String value.

**Default:** No TopoViewer default; authored only.

## `bodyLineHeight`

Callout body line height.

**Type:** number. **Values:** Finite number.

**Default:** No TopoViewer default; authored only.

## `borderColor`

Callout border color.

**Type:** color. **Values:** Any CSS color or supported theme variable.

**Default:** No TopoViewer default; authored only.

## `borderRadius`

Callout border radius.

**Type:** integer. **Values:** Finite integer number.

**Default:** No TopoViewer default; authored only.

## `borderWidth`

Callout border width.

**Type:** integer. **Values:** Finite integer number.

**Default:** No TopoViewer default; authored only.

## `boxShadow`

Presentation depth for the callout box.

**Type:** text. **Values:** String value.

**Default:** No TopoViewer default; authored only.

## `color`

Shared callout text color.

**Type:** color. **Values:** Any CSS color or supported theme variable.

**Default:** No TopoViewer default; authored only.

## `display`

Set none to hide the callout.

**Type:** enum. **Values:** `element`, `none`

**Default:** Defaults to `element`.

## `draggable`

Whether the callout can be dragged unless locked.

**Type:** boolean. **Values:** `true`, `false`

**Default:** Defaults to `true`.

## `height`

Callout height.

**Type:** integer. **Values:** Finite integer number.

**Default:** Defaults to `120`.

## `labelZIndex`

Independent draw order for a callout label where rendered.

**Type:** integer. **Values:** Finite integer number.

**Default:** No TopoViewer default; authored only.

## `opacity`

Callout opacity.

**Type:** number. **Values:** Finite number.

**Default:** No TopoViewer default; authored only.

## `selectable`

Whether the callout can be selected unless locked.

**Type:** boolean. **Values:** `true`, `false`

**Default:** Defaults to `false`.

## `textAlign`

Callout markdown text alignment.

**Type:** enum. **Values:** `left`, `center`, `right`

**Default:** Defaults to `left`.

## `titleBackgroundColor`

Callout title background.

**Type:** color. **Values:** Any CSS color or supported theme variable.

**Default:** No TopoViewer default; authored only.

## `titleColor`

Callout title color.

**Type:** color. **Values:** Any CSS color or supported theme variable.

**Default:** Falls back to shared text color.

## `titleFontSize`

Callout title font size.

**Type:** integer. **Values:** Finite integer number.

**Default:** No TopoViewer default; authored only.

## `titleFontWeight`

Callout title font weight.

**Type:** text. **Values:** String value.

**Default:** No TopoViewer default; authored only.

## `width`

Callout width.

**Type:** integer. **Values:** Finite integer number.

**Default:** Defaults to `320`.

## `zIndex`

Draw order for the callout.

**Type:** integer. **Values:** Finite integer number.

**Default:** Defaults to `30`.
