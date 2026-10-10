# Pin fields

[Field lookup](../object-attributes.md) · [YAML field contracts](../reference-model.md) · [Validate YAML](../../author/validate-yaml.md)

Applies to the development document contract. Check [documentation versions](../../start/documentation-versions.md) against your installed package.

## id

Stable identifier used by references, selectors, mapper joins, and diagnostics.

**Type:** string. **Required.** Required; no default.

**Validation:** required; minLength 1.

Selectable as `[id = "..."]` where the object kind supports selectors.

## position

Authored position in TopoViewer coordinate space.

**Type:** position. **Optional.** Optional; no schema default.

## x

The `x` field accepts number. Its complete constraints are in the [public schema](https://github.com/asadarafat/topoviewer/blob/development/packages/topoviewer/schemas/topoviewer.schema.json).

**Type:** number. **Optional.** Optional; no schema default.

## y

The `y` field accepts number. Its complete constraints are in the [public schema](https://github.com/asadarafat/topoviewer/blob/development/packages/topoviewer/schemas/topoviewer.schema.json).

**Type:** number. **Optional.** Optional; no schema default.
