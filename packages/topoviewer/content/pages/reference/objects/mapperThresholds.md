# Mapper Thresholds fields

[Field lookup](../object-attributes.md) · [YAML field contracts](../reference-model.md) · [Validate YAML](../../author/validate-yaml.md)

**Support status:** Experimental

## direction

Whether severity increases above or below each threshold.

**Type:** above \| below. **Optional.** Defaults to `above`.

**Values:** `above`, `below`

**Validation:** enum checked.

## error

Value at which error severity begins.

**Type:** number. **Optional.** Optional; no schema default.

## info

Value at which informational severity begins.

**Type:** number. **Optional.** Optional; no schema default.

## warning

Value at which warning severity begins.

**Type:** number. **Optional.** Optional; no schema default.
