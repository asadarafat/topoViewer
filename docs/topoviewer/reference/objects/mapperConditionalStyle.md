# Mapper Conditional Style fields

[Field lookup](../object-attributes.md) · [YAML field contracts](../reference-model.md) · [Validate YAML](../../author/validate-yaml.md)

**Support status:** Experimental

## id

Optional stable condition identifier for diagnostics and reviews.

**Type:** string. **Optional.** Optional; no schema default.

Selectable as `[id = "..."]` where the object kind supports selectors.

## style

TopoViewer style patch applied when the condition matches. String values may use mapper templates such as {{ value }}, {{ value | round }}, {{ value | bps }}, {{ severity }}, {{ metric }}, {{ target.id }}, {{ label.name }}, and {{ field.name }}.

**Type:** object. **Required.** Required; no default.

**Validation:** required.

## when

The `when` field accepts condition. Its complete constraints are in the [public schema](https://github.com/asadarafat/topoviewer/blob/development/packages/topoviewer/schemas/topoviewer-mapper.schema.json).

**Type:** condition. **Optional.** Optional; no schema default.
