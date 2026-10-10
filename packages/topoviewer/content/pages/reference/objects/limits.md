# Renderer Limits fields

[Field lookup](../object-attributes.md) · [YAML field contracts](../reference-model.md) · [Validate YAML](../../author/validate-yaml.md)

Applies to the development document contract. Check [documentation versions](../../start/documentation-versions.md) against your installed package.

## maxCallouts

The `maxCallouts` field accepts integer. Its complete constraints are in the [public schema](https://github.com/asadarafat/topoviewer/blob/development/packages/topoviewer/schemas/topoviewer.schema.json).

**Type:** integer. **Optional.** Optional; no schema default.

**Values:** Number >= 1.

## maxEdges

Maximum compiled edge count accepted for rendering.

**Type:** integer. **Optional.** Optional; no schema default.

**Values:** Number >= 1.

## maxImageBytes

Maximum embedded image payload size accepted by renderer validation.

**Type:** integer. **Optional.** Optional; no schema default.

**Values:** Number >= 1.

## maxLabels

The `maxLabels` field accepts integer. Its complete constraints are in the [public schema](https://github.com/asadarafat/topoviewer/blob/development/packages/topoviewer/schemas/topoviewer.schema.json).

**Type:** integer. **Optional.** Optional; no schema default.

**Values:** Number >= 1.

## maxNodes

Maximum node count accepted for rendering. Increase only within a measured host capacity.

**Type:** integer. **Optional.** Optional; no schema default.

**Values:** Number >= 1.

## maxPathSegments

Maximum compiled path segment count accepted for rendering.

**Type:** integer. **Optional.** Optional; no schema default.

**Values:** Number >= 1.

## maxPins

Maximum pin count; development-only relative to the 0.5.0 schema.

**Type:** integer. **Optional.** Optional; no schema default.

**Values:** Number >= 1.

## maxRegions

Maximum region count; development-only relative to the 0.5.0 schema.

**Type:** integer. **Optional.** Optional; no schema default.

**Values:** Number >= 1.

## maxShapes

The `maxShapes` field accepts integer. Its complete constraints are in the [public schema](https://github.com/asadarafat/topoviewer/blob/development/packages/topoviewer/schemas/topoviewer.schema.json).

**Type:** integer. **Optional.** Optional; no schema default.

**Values:** Number >= 1.

## maxTexts

The `maxTexts` field accepts integer. Its complete constraints are in the [public schema](https://github.com/asadarafat/topoviewer/blob/development/packages/topoviewer/schemas/topoviewer.schema.json).

**Type:** integer. **Optional.** Optional; no schema default.

**Values:** Number >= 1.
