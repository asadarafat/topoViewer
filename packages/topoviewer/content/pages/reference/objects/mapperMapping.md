# Mapper Canonical Mapping fields

[Field lookup](../object-attributes.md) · [YAML field contracts](../reference-model.md) · [Validate YAML](../../author/validate-yaml.md)

**Support status:** Experimental

## conditions

Conditional runtime style rules evaluated after the base overlay. Use this for selector-like dynamic style changes from telemetry values.

**Type:** array of conditional Style. **Optional.** Optional; no schema default.

## id

Stable mapping rule identifier.

**Type:** string. **Required.** Required; no default.

**Validation:** required.

Selectable as `[id = "..."]` where the object kind supports selectors.

## metric

Grafana data-frame metric name to match.

**Type:** string. **Required.** Required; no default.

**Validation:** required.

## overlay

Runtime-only style, badge, or metric presentation derived from telemetry.

**Type:** overlay. **Optional.** Optional; no schema default.

## target

Target endpoint object ID.

**Type:** target. **Required.** Required; no default.

**Validation:** required; semantic reference checks apply.

Useful for link/path endpoint selectors and mapper endpoint joins.

## thresholds

The `thresholds` field accepts thresholds. Its complete constraints are in the [public schema](https://github.com/asadarafat/topoviewer/blob/development/packages/topoviewer/schemas/topoviewer-mapper.schema.json).

**Type:** thresholds. **Optional.** Optional; no schema default.

## value

Telemetry value extraction or semantic value type.

**Type:** value. **Optional.** Optional; no schema default.
