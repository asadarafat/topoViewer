# Mapper Compact Rule fields

[Field lookup](../object-attributes.md) · [YAML field contracts](../reference-model.md) · [Validate YAML](../../author/validate-yaml.md)

**Support status:** Experimental

## id

Stable mapper rule identifier.

**Type:** string. **Required.** Required; no default.

**Validation:** required.

Selectable as `[id = "..."]` where the object kind supports selectors.

## join

Telemetry label carrying the selected object's ID, or a linkDirection join object with link and direction labels. Omit for selector-wide rules.

**Type:** string or link Direction Join. **Optional.** Optional; no schema default.

**Values:** Any valid value of the documented type. or See `link Direction Join`.

## metric

Grafana data-frame metric name to match.

**Type:** string. **Required.** Required; no default.

**Validation:** required.

## select

TopoViewer selector or object kind, such as link, linkDirection, node, node\[labels.role = "pe"\], path, region, layer, or graph.

**Type:** string. **Required.** Required; no default.

**Validation:** required.

## states

State names mapped to simple value expressions. Examples: down: "==0", busy: ">=70", saturated: ">=90".

**Type:** object of string. **Optional.** Optional; no schema default.

## style

Runtime style by state. style.default applies first; style.<state> overrides when the matching states.<state> expression is true.

**Type:** object of object. **Optional.** Absent means stylesheet rules and runtime defaults determine presentation.

## value

Short value semantic. Supported values include percent, utilizationPercent, up, errorsTotal, latencyMs, lossPercent, capacityPercent, bps, and health.

**Type:** percent \| utilization \| utilizationPercent \| up \| errors \| errorsTotal \| latency \| latencyMs \| loss \| lossPercent \| capacity \| capacityPercent \| bps \| health. **Optional.** Optional; no schema default.

**Values:** `percent`, `utilization`, `utilizationPercent`, `up`, `errors`, `errorsTotal`, `latency`, `latencyMs`, `loss`, `lossPercent`, `capacity`, `capacityPercent`, `bps`, `health`

**Validation:** enum checked.
