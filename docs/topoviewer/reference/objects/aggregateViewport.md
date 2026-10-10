# Attention Aggregate Viewport fields

[Field lookup](../object-attributes.md) · [YAML field contracts](../reference-model.md) · [Validate YAML](../../author/validate-yaml.md)

Applies to the development document contract. Check [documentation versions](../../start/documentation-versions.md) against your installed package.

## collapseBelowZoom

Lower zoom threshold for switching a configured group into a summary.

**Type:** number. **Optional.** Optional; no schema default.

## expandAboveZoom

Upper zoom threshold for returning a configured group to its members.

**Type:** number. **Optional.** Optional; no schema default.

## groupIds

The `groupIds` field accepts string List. Its complete constraints are in the [public schema](https://github.com/asadarafat/topoviewer/blob/development/packages/topoviewer/schemas/topoviewer-mkdocs-block.schema.json).

**Type:** string List. **Optional.** Optional; no schema default.

## hysteresis

The `hysteresis` field accepts number. Its complete constraints are in the [public schema](https://github.com/asadarafat/topoviewer/blob/development/packages/topoviewer/schemas/topoviewer-mkdocs-block.schema.json).

**Type:** number. **Optional.** Defaults to `0`.

**Values:** Number >= 0.
