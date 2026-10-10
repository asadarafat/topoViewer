# Path fields

[Field lookup](../object-attributes.md) · [YAML field contracts](../reference-model.md) · [Validate YAML](../../author/validate-yaml.md)

Applies to the development document contract. Check [documentation versions](../../start/documentation-versions.md) against your installed package.

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

## parent

Parent path that carries this child route. The child retains its own endpoints and uses the parent sequence.

**Type:** string. **Optional.** Optional; no schema default.

**Validation:** semantic reference checks apply.

## sequence

Ordered node IDs visited by the path. Consecutive entries become rendered path segments.

**Type:** array of string. **Optional.** Optional; no schema default.

**Validation:** minItems 2; semantic reference checks apply.

## source

Source endpoint object ID.

**Type:** string. **Optional.** Optional; no schema default.

**Validation:** minLength 1; semantic reference checks apply.

Useful for link/path endpoint selectors and mapper endpoint joins.

## target

Target endpoint object ID.

**Type:** string. **Optional.** Optional; no schema default.

**Validation:** minLength 1; semantic reference checks apply.

Useful for link/path endpoint selectors and mapper endpoint joins.
