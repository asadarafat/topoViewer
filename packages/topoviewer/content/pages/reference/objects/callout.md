# Callout fields

[Field lookup](../object-attributes.md) · [YAML field contracts](../reference-model.md) · [Validate YAML](../../author/validate-yaml.md)

Applies to the development document contract. Check [documentation versions](../../start/documentation-versions.md) against your installed package.

## body

The `body` field accepts body. Its complete constraints are in the [public schema](https://github.com/asadarafat/topoviewer/blob/development/packages/topoviewer/schemas/topoviewer.schema.json).

**Type:** body. **Optional.** Optional; no schema default.

## data

Arbitrary facts for domain metadata, selectors, mappers, and host applications.

**Type:** data. **Optional.** Defaults to an empty object when absent.

Selector namespace for stable facts: `[data.<key> = "..."]`.

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

## locked

The `locked` field accepts boolean. Its complete constraints are in the [public schema](https://github.com/asadarafat/topoviewer/blob/development/packages/topoviewer/schemas/topoviewer.schema.json).

**Type:** boolean. **Optional.** Optional; no schema default.

## markdown

Callout body with supported Markdown formatting. Unsafe HTML and image payloads are sanitized.

**Type:** body. **Optional.** Optional; no schema default.

## pins

Named attachment points on an owner for precise explanatory leader endpoints.

**Type:** array of pin. **Optional.** Optional; no schema default.

## position

Authored position in TopoViewer coordinate space.

**Type:** position. **Optional.** Optional; no schema default.

## source

Source endpoint object ID.

**Type:** string. **Optional.** Optional; no schema default.

**Validation:** semantic reference checks apply.

Useful for link/path endpoint selectors and mapper endpoint joins.

## sourcePin

The `sourcePin` field accepts string. Its complete constraints are in the [public schema](https://github.com/asadarafat/topoviewer/blob/development/packages/topoviewer/schemas/topoviewer.schema.json).

**Type:** string. **Optional.** Optional; no schema default.

## sourcePosition

The `sourcePosition` field accepts position. Its complete constraints are in the [public schema](https://github.com/asadarafat/topoviewer/blob/development/packages/topoviewer/schemas/topoviewer.schema.json).

**Type:** position. **Optional.** Optional; no schema default.

## target

Target endpoint object ID.

**Type:** string. **Optional.** Optional; no schema default.

**Validation:** semantic reference checks apply.

Useful for link/path endpoint selectors and mapper endpoint joins.

## targetPin

The `targetPin` field accepts string. Its complete constraints are in the [public schema](https://github.com/asadarafat/topoviewer/blob/development/packages/topoviewer/schemas/topoviewer.schema.json).

**Type:** string. **Optional.** Optional; no schema default.

## targetPosition

The `targetPosition` field accepts position. Its complete constraints are in the [public schema](https://github.com/asadarafat/topoviewer/blob/development/packages/topoviewer/schemas/topoviewer.schema.json).

**Type:** position. **Optional.** Optional; no schema default.

## title

Short heading displayed in the callout or configured annotation.

**Type:** string. **Optional.** Optional; no schema default.
