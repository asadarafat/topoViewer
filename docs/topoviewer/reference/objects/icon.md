# Icon fields

[Field lookup](../object-attributes.md) · [YAML field contracts](../reference-model.md) · [Validate YAML](../../author/validate-yaml.md)

Applies to the development document contract. Check [documentation versions](../../start/documentation-versions.md) against your installed package.

## alt

Text alternative describing the icon or image meaning.

**Type:** string. **Optional.** Optional; no schema default.

## fill

Icon body fill color, distinct from graph node body styling.

**Type:** string. **Optional.** Optional; no schema default.

## glyph

Compact fallback text shown when using a glyph-based icon.

**Type:** string. **Optional.** Optional; no schema default.

## src

Safe image URL. Allowed schemes and sanitization are enforced by the renderer.

**Type:** string. **Optional.** Optional; no schema default.

## stroke

Icon outline color, distinct from relationship stroke styling.

**Type:** string. **Optional.** Optional; no schema default.

## svg

Inline SVG sanitized before display. Keep meaningful icon alternatives in alt.

**Type:** string. **Optional.** Optional; no schema default.
