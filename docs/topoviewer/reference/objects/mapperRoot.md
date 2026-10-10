# Mapper Root fields

[Field lookup](../object-attributes.md) · [YAML field contracts](../reference-model.md) · [Validate YAML](../../author/validate-yaml.md)

**Support status:** Experimental

## $schema

Optional URI of the mapper JSON Schema used by editors and validation tools.

**Type:** string. **Optional.** Optional; no schema default.

## identity

The `identity` field accepts identity. Its complete constraints are in the [public schema](https://github.com/asadarafat/topoviewer/blob/development/packages/topoviewer/schemas/topoviewer-mapper.schema.json).

**Type:** identity. **Optional.** Optional; no schema default.

## mappings

Canonical metric-to-object mapping rules. Prefer rules for hand-authored mapper YAML unless the advanced shape is needed.

**Type:** array of mapping. **Optional.** Optional; no schema default.

## palette

The `palette` field accepts severity Palette. Its complete constraints are in the [public schema](https://github.com/asadarafat/topoviewer/blob/development/packages/topoviewer/schemas/topoviewer-mapper.schema.json).

**Type:** severity Palette. **Optional.** Optional; no schema default.

## rules

Human-friendly mapper authoring rules. Rules compile to canonical mappings at runtime.

**Type:** array of authoring Rule. **Optional.** Optional; no schema default.

## version

Mapper schema version.

**Type:** const 1. **Required.** Required; no default.

**Values:** `1`

**Validation:** required; const checked.
