# Attention Root fields

[Field lookup](../object-attributes.md) · [YAML field contracts](../reference-model.md) · [Validate YAML](../../author/validate-yaml.md)

Applies to the development document contract. Check [documentation versions](../../start/documentation-versions.md) against your installed package.

## aggregate

The `aggregate` field accepts aggregate. Its complete constraints are in the [public schema](https://github.com/asadarafat/topoviewer/blob/development/packages/topoviewer/schemas/topoviewer-mkdocs-block.schema.json).

**Type:** aggregate. **Optional.** Optional; no schema default.

[aggregate fields](aggregate.md)

## clickMode

The `clickMode` field accepts highlight | dim-context | hide-context. Its complete constraints are in the [public schema](https://github.com/asadarafat/topoviewer/blob/development/packages/topoviewer/schemas/topoviewer-mkdocs-block.schema.json).

**Type:** highlight \| dim-context \| hide-context. **Optional.** Optional; no schema default.

**Values:** `highlight`, `dim-context`, `hide-context`

**Validation:** enum checked.

## interactive

The `interactive` field accepts boolean. Its complete constraints are in the [public schema](https://github.com/asadarafat/topoviewer/blob/development/packages/topoviewer/schemas/topoviewer-mkdocs-block.schema.json).

**Type:** boolean. **Optional.** Defaults to `false`.

## links

Direct relationships with two endpoints. Their domain meaning is supplied by the author.

**Type:** attention Links. **Optional.** Optional; no schema default.

[attention Links fields](attentionLinks.md)

## query

Criteria selecting the focused objects. Combine only criteria that express the intended focus set.

**Type:** focus Query. **Optional.** Optional; no schema default.

[focus Query fields](focusQuery.md)
