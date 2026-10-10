# Mapper Condition fields

[Field lookup](../object-attributes.md) · [YAML field contracts](../reference-model.md) · [Validate YAML](../../author/validate-yaml.md)

**Support status:** Experimental

## field

The `field` field accepts keyed Condition. Its complete constraints are in the [public schema](https://github.com/asadarafat/topoviewer/blob/development/packages/topoviewer/schemas/topoviewer-mapper.schema.json).

**Type:** keyed Condition. **Optional.** Optional; no schema default.

## label

Fallback display label.

**Type:** keyed Condition. **Optional.** Optional; no schema default.

## severity

Required resolved severity for this condition to match.

**Type:** none \| success \| info \| warning \| error. **Optional.** Optional; no schema default.

**Values:** `none`, `success`, `info`, `warning`, `error`

**Validation:** enum checked.

## value

Telemetry value extraction or semantic value type.

**Type:** scalar Condition. **Optional.** Optional; no schema default.
