# Design

## Style Metadata

The harness owns a practical style metadata table close to the Inspect UI. This
keeps the editor independent from public renderer schema shape while still using
the canonical camelCase style keys already exposed by the harness.

The metadata resolves a style key to one of:

- `enum`
- `boolean`
- `integer`
- `number`
- `color`
- `text`

Some keys need object-kind context. For example `shape` means TopoViewer node
shape for graph nodes, region shape for regions, and diagram shape for diagram
objects. `labelPosition` also uses different value lists for regions.

## Rendering Rules

- `enum` and `boolean` render as Material UI `Select` controls.
- `integer` and `number` render as `TextField type="number"`.
- `color` renders as `TextField type="color"`.
- `text` renders as a normal `TextField`.

Rows remain side-by-side with `Style key`, `Style value`, and `Remove`.
Color values that are not valid browser color-input hex values, such as CSS
variables or `rgba(...)`, remain editable as exact text so Inspect does not show
a misleading fallback color.

## Effective Style Hydration

The Inspect panel hydrates style rows from the same effective style resolution
used by the renderer: matching stylesheet rules are merged first and inline
object style is applied last. This means Inspect reflects what the canvas is
actually rendering, not only the `style` block already present on the selected
object.

When the user applies the style rows, the harness writes the visible row values
as explicit inline object style in topology YAML. That materializes the edited
canvas state into YAML and lets the renderer, YAML editor, and Inspect converge
on the same effective values.

## YAML Value Coercion

When applying styles:

- booleans are written as booleans;
- integers are rounded and written as numbers;
- numbers are written as numbers;
- colors/enums/text remain strings.

This preserves authored YAML type quality without hiding the raw YAML from users.
