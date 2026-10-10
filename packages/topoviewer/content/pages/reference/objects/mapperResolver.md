# Mapper Resolver fields

[Field lookup](../object-attributes.md) · [YAML field contracts](../reference-model.md) · [Validate YAML](../../author/validate-yaml.md)

**Support status:** Experimental

## by

How telemetry labels resolve to TopoViewer objects.

**Type:** id \| label \| data \| endpoint \| selector \| aggregate \| staticObjectIds. **Required.** Required; no default.

**Values:** `id`, `label`, `data`, `endpoint`, `selector`, `aggregate`, `staticObjectIds`

**Validation:** required; enum checked.

## directionMetricLabel

Telemetry label carrying sourceToTarget or targetToSource for linkDirection joins.

**Type:** string. **Optional.** Optional; no schema default.

## key

TopoViewer label or data key used by label/data resolvers.

**Type:** string. **Optional.** Optional; no schema default.

## linkMetricLabel

Telemetry label carrying the parent link ID for linkDirection joins.

**Type:** string. **Optional.** Optional; no schema default.

## metricLabel

Telemetry label used as the primary join value.

**Type:** string. **Optional.** Optional; no schema default.

## objectIds

Explicit TopoViewer object IDs for static object matching.

**Type:** array of string. **Optional.** Optional; no schema default.

## selector

TopoViewer selector used by selector resolver.

**Type:** string. **Optional.** Optional; no schema default.

## sourceLabel

Telemetry label carrying source node ID for endpoint matching.

**Type:** string. **Optional.** Optional; no schema default.

## targetLabel

Telemetry label carrying target node ID for endpoint matching.

**Type:** string. **Optional.** Optional; no schema default.
