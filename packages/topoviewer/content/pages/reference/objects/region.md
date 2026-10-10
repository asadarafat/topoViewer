# Region fields

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

## members

Object IDs enclosed by a region.

**Type:** array of string. **Optional.** Optional; no schema default.

**Validation:** semantic reference checks apply.

## parent

Parent region ID establishing nested membership. Cyclic containment is rejected.

**Type:** string. **Optional.** Optional; no schema default.

**Validation:** semantic reference checks apply.

## position

Authored position in TopoViewer coordinate space.

**Type:** position. **Optional.** Optional; no schema default.
