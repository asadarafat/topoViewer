# Mapper Target fields

[Field lookup](../object-attributes.md) · [YAML field contracts](../reference-model.md) · [Validate YAML](../../author/validate-yaml.md)

**Support status:** Experimental

## kind

TopoViewer object kind affected by the metric.

**Type:** node \| link \| linkDirection \| path \| region \| layer \| graph. **Required.** Required; no default.

**Values:** `node`, `link`, `linkDirection`, `path`, `region`, `layer`, `graph`

**Validation:** required; enum checked.

## resolve

Rule defining how telemetry identities join to a known topology object.

**Type:** resolver. **Required.** Required; no default.

**Validation:** required.
