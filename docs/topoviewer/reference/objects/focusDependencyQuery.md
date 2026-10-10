# Attention Dependency Query fields

[Field lookup](../object-attributes.md) · [YAML field contracts](../reference-model.md) · [Validate YAML](../../author/validate-yaml.md)

Applies to the development document contract. Check [documentation versions](../../start/documentation-versions.md) against your installed package.

## depth

Maximum traversal distance from focus seeds in the dependency graph.

**Type:** integer. **Required.** Required; no default.

**Values:** Number >= 0.

**Validation:** required.

## direction

The `direction` field accepts upstream | downstream | both. Its complete constraints are in the [public schema](https://github.com/asadarafat/topoviewer/blob/development/packages/topoviewer/schemas/topoviewer-mkdocs-block.schema.json).

**Type:** upstream \| downstream \| both. **Required.** Required; no default.

**Values:** `upstream`, `downstream`, `both`

**Validation:** required; enum checked.

## from

The `from` field accepts string List. Its complete constraints are in the [public schema](https://github.com/asadarafat/topoviewer/blob/development/packages/topoviewer/schemas/topoviewer-mkdocs-block.schema.json).

**Type:** string List. **Required.** Required; no default.

**Validation:** required.
