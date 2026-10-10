# Attention Aggregate Group fields

[Field lookup](../object-attributes.md) · [YAML field contracts](../reference-model.md) · [Validate YAML](../../author/validate-yaml.md)

Applies to the development document contract. Check [documentation versions](../../start/documentation-versions.md) against your installed package.

## by

The `by` field accepts region | parent | label. Its complete constraints are in the [public schema](https://github.com/asadarafat/topoviewer/blob/development/packages/topoviewer/schemas/topoviewer-mkdocs-block.schema.json).

**Type:** region \| parent \| label. **Required.** Required; no default.

**Values:** `region`, `parent`, `label`

**Validation:** required; enum checked.

## id

Stable identifier used by references, selectors, mapper joins, and diagnostics.

**Type:** string. **Required.** Required; no default.

**Validation:** required; minLength 1.

Selectable as `[id = "..."]` where the object kind supports selectors.

## key

The `key` field accepts string. Its complete constraints are in the [public schema](https://github.com/asadarafat/topoviewer/blob/development/packages/topoviewer/schemas/topoviewer-mkdocs-block.schema.json).

**Type:** string. **Optional.** Optional; no schema default.

**Validation:** minLength 1.

## label

Fallback display label.

**Type:** string. **Optional.** Optional; no schema default.

## parentId

The `parentId` field accepts string. Its complete constraints are in the [public schema](https://github.com/asadarafat/topoviewer/blob/development/packages/topoviewer/schemas/topoviewer-mkdocs-block.schema.json).

**Type:** string. **Optional.** Optional; no schema default.

**Validation:** minLength 1.

## regionId

The `regionId` field accepts string. Its complete constraints are in the [public schema](https://github.com/asadarafat/topoviewer/blob/development/packages/topoviewer/schemas/topoviewer-mkdocs-block.schema.json).

**Type:** string. **Optional.** Optional; no schema default.

**Validation:** minLength 1.

## value

Telemetry value extraction or semantic value type.

**Type:** scalar. **Optional.** Optional; no schema default.
