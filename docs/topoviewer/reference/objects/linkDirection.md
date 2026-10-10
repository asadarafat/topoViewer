# Link Direction fields

[Field lookup](../object-attributes.md) · [YAML field contracts](../reference-model.md) · [Validate YAML](../../author/validate-yaml.md)

Applies to the development document contract. Check [documentation versions](../../start/documentation-versions.md) against your installed package.

## data

Arbitrary facts for domain metadata, selectors, mappers, and host applications.

**Type:** data. **Optional.** Defaults to an empty object when absent.

Selector namespace for stable facts: `[data.<key> = "..."]`.

## id

Stable identifier used by references, selectors, mapper joins, and diagnostics.

**Type:** string. **Optional.** Optional; no schema default.

**Validation:** minLength 1.

Selectable as `[id = "..."]` where the object kind supports selectors.

## label

Fallback display label.

**Type:** string. **Optional.** Optional; no schema default.

## labels

Low-cardinality classification data for selectors, filters, and mapper joins.

**Type:** labels. **Optional.** Defaults to an empty object when absent.

Primary selector namespace: `[labels.<key> = "..."]`.
