# Attention Aggregate fields

[Field lookup](../object-attributes.md) · [YAML field contracts](../reference-model.md) · [Validate YAML](../../author/validate-yaml.md)

Applies to the development document contract. Check [documentation versions](../../start/documentation-versions.md) against your installed package.

## expandOnClick

The `expandOnClick` field accepts boolean. Its complete constraints are in the [public schema](https://github.com/asadarafat/topoviewer/blob/development/packages/topoviewer/schemas/topoviewer-mkdocs-block.schema.json).

**Type:** boolean. **Optional.** Defaults to `true`.

## expandedGroupIds

Groups initially shown as individual members rather than collapsed summaries.

**Type:** string List. **Optional.** Optional; no schema default.

## groups

Explicit groups of identified members that may appear as aggregate summaries.

**Type:** array of aggregate Group. **Required.** Required; no default.

**Validation:** required; minItems 1.

## viewport

The `viewport` field accepts aggregate Viewport. Its complete constraints are in the [public schema](https://github.com/asadarafat/topoviewer/blob/development/packages/topoviewer/schemas/topoviewer-mkdocs-block.schema.json).

**Type:** aggregate Viewport. **Optional.** Optional; no schema default.

[aggregate Viewport fields](aggregateViewport.md)
