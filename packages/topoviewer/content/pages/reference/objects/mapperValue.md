# Mapper Value Selector fields

[Field lookup](../object-attributes.md) · [YAML field contracts](../reference-model.md) · [Validate YAML](../../author/validate-yaml.md)

**Support status:** Experimental

## as

Semantic interpretation of the metric value.

**Type:** up \| utilizationPercent \| errorsTotal \| latencyMs \| lossPercent \| capacityPercent \| bps \| health. **Optional.** Optional; no schema default.

**Values:** `up`, `utilizationPercent`, `errorsTotal`, `latencyMs`, `lossPercent`, `capacityPercent`, `bps`, `health`

**Validation:** enum checked.

## field

Data-frame field to read. Defaults to the sample value.

**Type:** string. **Optional.** Optional; no schema default.
