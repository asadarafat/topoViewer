# Link fields

[Field lookup](../object-attributes.md) · [YAML field contracts](../reference-model.md) · [Validate YAML](../../author/validate-yaml.md)

Applies to the development document contract. Check [documentation versions](../../start/documentation-versions.md) against your installed package.

## data

Arbitrary facts for domain metadata, selectors, mappers, and host applications.

**Type:** data. **Optional.** Defaults to an empty object when absent.

Selector namespace for stable facts: `[data.<key> = "..."]`.

## directions

Independent source-to-target and target-to-source channels on one relationship.

**Type:** link Directions. **Optional.** Optional; no schema default.

## id

Stable identifier used by references, selectors, mapper joins, and diagnostics.

**Type:** string. **Required.** Required; no default.

**Validation:** required; minLength 1.

Selectable as `[id = "..."]` where the object kind supports selectors.

## labels

Low-cardinality classification data for selectors, filters, and mapper joins.

**Type:** labels. **Optional.** Defaults to an empty object when absent.

Primary selector namespace: `[labels.<key> = "..."]`.

## layers

Visibility layer IDs that include this object.

**Type:** array of string. **Optional.** Absent or empty means hidden. Select at least one declared member layer.

**Validation:** semantic reference checks apply.

## parent

Parent link that visually carries this child lane. The child keeps its real source and target IDs.

**Type:** string. **Optional.** Optional; no schema default.

**Validation:** semantic reference checks apply.

## source

Source endpoint object ID.

**Type:** string. **Required.** Required; no default.

**Validation:** required; minLength 1; semantic reference checks apply.

Useful for link/path endpoint selectors and mapper endpoint joins.

## sourceHandle

Optional source node handle ID. Use this to attach a link to a specific source-side port or interface anchor.

**Type:** string. **Optional.** Optional; no schema default.

**Validation:** minLength 1; semantic reference checks apply.

## sourceLabel

The `sourceLabel` field accepts string. Its complete constraints are in the [public schema](https://github.com/asadarafat/topoviewer/blob/development/packages/topoviewer/schemas/topoviewer.schema.json).

**Type:** string. **Optional.** Optional; no schema default.

**Validation:** minLength 1.

## target

Target endpoint object ID.

**Type:** string. **Required.** Required; no default.

**Validation:** required; minLength 1; semantic reference checks apply.

Useful for link/path endpoint selectors and mapper endpoint joins.

## targetHandle

Optional target node handle ID. Use this to attach a link to a specific target-side port or interface anchor.

**Type:** string. **Optional.** Optional; no schema default.

**Validation:** minLength 1; semantic reference checks apply.

## targetLabel

The `targetLabel` field accepts string. Its complete constraints are in the [public schema](https://github.com/asadarafat/topoviewer/blob/development/packages/topoviewer/schemas/topoviewer.schema.json).

**Type:** string. **Optional.** Optional; no schema default.

**Validation:** minLength 1.
