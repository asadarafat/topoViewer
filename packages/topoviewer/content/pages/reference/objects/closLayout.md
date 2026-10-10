# CLOS Layout Options fields

[Field lookup](../object-attributes.md) · [YAML field contracts](../reference-model.md) · [Validate YAML](../../author/validate-yaml.md)

Applies to the development document contract. Check [documentation versions](../../start/documentation-versions.md) against your installed package.

## direction

The `direction` field accepts topToBottom | bottomToTop | leftToRight | rightToLeft. Its complete constraints are in the [public schema](https://github.com/asadarafat/topoviewer/blob/development/packages/topoviewer/schemas/topoviewer.schema.json).

**Type:** topToBottom \| bottomToTop \| leftToRight \| rightToLeft. **Optional.** Optional; no schema default.

**Values:** `topToBottom`, `bottomToTop`, `leftToRight`, `rightToLeft`

**Validation:** enum checked.

## groupGap

The `groupGap` field accepts number. Its complete constraints are in the [public schema](https://github.com/asadarafat/topoviewer/blob/development/packages/topoviewer/schemas/topoviewer.schema.json).

**Type:** number. **Optional.** Optional; no schema default.

## groupKey

The `groupKey` field accepts string. Its complete constraints are in the [public schema](https://github.com/asadarafat/topoviewer/blob/development/packages/topoviewer/schemas/topoviewer.schema.json).

**Type:** string. **Optional.** Optional; no schema default.

## inferLabelRole

The `inferLabelRole` field accepts infer Label Role. Its complete constraints are in the [public schema](https://github.com/asadarafat/topoviewer/blob/development/packages/topoviewer/schemas/topoviewer.schema.json).

**Type:** infer Label Role. **Optional.** Optional; no schema default.

## maxStages

The `maxStages` field accepts number. Its complete constraints are in the [public schema](https://github.com/asadarafat/topoviewer/blob/development/packages/topoviewer/schemas/topoviewer.schema.json).

**Type:** number. **Optional.** Optional; no schema default.

**Values:** Number >= 1.

## nodeGap

The `nodeGap` field accepts number. Its complete constraints are in the [public schema](https://github.com/asadarafat/topoviewer/blob/development/packages/topoviewer/schemas/topoviewer.schema.json).

**Type:** number. **Optional.** Optional; no schema default.

## pinnedNodeIds

The `pinnedNodeIds` field accepts array of string. Its complete constraints are in the [public schema](https://github.com/asadarafat/topoviewer/blob/development/packages/topoviewer/schemas/topoviewer.schema.json).

**Type:** array of string. **Optional.** Optional; no schema default.

## preservePinned

The `preservePinned` field accepts boolean. Its complete constraints are in the [public schema](https://github.com/asadarafat/topoviewer/blob/development/packages/topoviewer/schemas/topoviewer.schema.json).

**Type:** boolean. **Optional.** Optional; no schema default.

## stageCount

The `stageCount` field accepts number or const auto. Its complete constraints are in the [public schema](https://github.com/asadarafat/topoviewer/blob/development/packages/topoviewer/schemas/topoviewer.schema.json).

**Type:** number or const auto. **Optional.** Optional; no schema default.

**Values:** Number >= 1. or `auto`

## stageGap

The `stageGap` field accepts number. Its complete constraints are in the [public schema](https://github.com/asadarafat/topoviewer/blob/development/packages/topoviewer/schemas/topoviewer.schema.json).

**Type:** number. **Optional.** Optional; no schema default.

## stageKey

The `stageKey` field accepts string. Its complete constraints are in the [public schema](https://github.com/asadarafat/topoviewer/blob/development/packages/topoviewer/schemas/topoviewer.schema.json).

**Type:** string. **Optional.** Optional; no schema default.

## stageOrder

The `stageOrder` field accepts array of string. Its complete constraints are in the [public schema](https://github.com/asadarafat/topoviewer/blob/development/packages/topoviewer/schemas/topoviewer.schema.json).

**Type:** array of string. **Optional.** Optional; no schema default.
