# Attention Link Grouping fields

[Field lookup](../object-attributes.md) · [YAML field contracts](../reference-model.md) · [Validate YAML](../../author/validate-yaml.md)

Applies to the development document contract. Check [documentation versions](../../start/documentation-versions.md) against your installed package.

## by

The `by` field accepts array of endpoints | layer. Its complete constraints are in the [public schema](https://github.com/asadarafat/topoviewer/blob/development/packages/topoviewer/schemas/topoviewer-mkdocs-block.schema.json).

**Type:** array of endpoints \| layer. **Optional.** Defaults to `endpoints,layer`.

**Validation:** minItems 1.

## enabled

The `enabled` field accepts boolean. Its complete constraints are in the [public schema](https://github.com/asadarafat/topoviewer/blob/development/packages/topoviewer/schemas/topoviewer-mkdocs-block.schema.json).

**Type:** boolean. **Optional.** Defaults to `true`.

## expandOnClick

The `expandOnClick` field accepts boolean. Its complete constraints are in the [public schema](https://github.com/asadarafat/topoviewer/blob/development/packages/topoviewer/schemas/topoviewer-mkdocs-block.schema.json).

**Type:** boolean. **Optional.** Defaults to `true`.

## expandedGroupIds

Groups initially shown as individual members rather than collapsed summaries.

**Type:** string List. **Optional.** Optional; no schema default.

## selector

Optional link selector limiting which links are eligible for grouping.

**Type:** string. **Optional.** Optional; no schema default.

**Validation:** minLength 1.

## threshold

Minimum relationship count that activates the configured grouping behavior.

**Type:** integer. **Optional.** Defaults to `2`.

**Values:** Number >= 2.

## viewport

The `viewport` field accepts link Grouping Viewport. Its complete constraints are in the [public schema](https://github.com/asadarafat/topoviewer/blob/development/packages/topoviewer/schemas/topoviewer-mkdocs-block.schema.json).

**Type:** link Grouping Viewport. **Optional.** Optional; no schema default.

[link Grouping Viewport fields](linkGroupingViewport.md)
