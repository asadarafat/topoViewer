# Attention Focus Query fields

[Field lookup](../object-attributes.md) · [YAML field contracts](../reference-model.md) · [Validate YAML](../../author/validate-yaml.md)

Applies to the development document contract. Check [documentation versions](../../start/documentation-versions.md) against your installed package.

## changes

The `changes` field accepts focus Change Query. Its complete constraints are in the [public schema](https://github.com/asadarafat/topoviewer/blob/development/packages/topoviewer/schemas/topoviewer-mkdocs-block.schema.json).

**Type:** focus Change Query. **Optional.** Optional; no schema default.

[focus Change Query fields](focusChangeQuery.md)

## data

Arbitrary facts for domain metadata, selectors, mappers, and host applications.

**Type:** object. **Optional.** Defaults to an empty object when absent.

Selector namespace for stable facts: `[data.<key> = "..."]`.

## dependency

The `dependency` field accepts focus Dependency Query. Its complete constraints are in the [public schema](https://github.com/asadarafat/topoviewer/blob/development/packages/topoviewer/schemas/topoviewer-mkdocs-block.schema.json).

**Type:** focus Dependency Query. **Optional.** Optional; no schema default.

[focus Dependency Query fields](focusDependencyQuery.md)

## ids

The `ids` field accepts string List. Its complete constraints are in the [public schema](https://github.com/asadarafat/topoviewer/blob/development/packages/topoviewer/schemas/topoviewer-mkdocs-block.schema.json).

**Type:** string List. **Optional.** Optional; no schema default.

## labels

Low-cardinality classification data for selectors, filters, and mapper joins.

**Type:** object of scalar Value Or List. **Optional.** Defaults to an empty object when absent.

Primary selector namespace: `[labels.<key> = "..."]`.

## mode

Mode selecting the behavior of this object; use the values below and its related workflow guide.

**Type:** highlight \| dim-context \| hide-context. **Optional.** Optional; no schema default.

**Values:** `highlight`, `dim-context`, `hide-context`

**Validation:** enum checked.

## pathIds

The `pathIds` field accepts string List. Its complete constraints are in the [public schema](https://github.com/asadarafat/topoviewer/blob/development/packages/topoviewer/schemas/topoviewer-mkdocs-block.schema.json).

**Type:** string List. **Optional.** Optional; no schema default.

## regionIds

The `regionIds` field accepts string List. Its complete constraints are in the [public schema](https://github.com/asadarafat/topoviewer/blob/development/packages/topoviewer/schemas/topoviewer-mkdocs-block.schema.json).

**Type:** string List. **Optional.** Optional; no schema default.

## selectors

The `selectors` field accepts string List. Its complete constraints are in the [public schema](https://github.com/asadarafat/topoviewer/blob/development/packages/topoviewer/schemas/topoviewer-mkdocs-block.schema.json).

**Type:** string List. **Optional.** Optional; no schema default.
