# Layout fields

[Field lookup](../object-attributes.md) · [YAML field contracts](../reference-model.md) · [Validate YAML](../../author/validate-yaml.md)

Applies to the development document contract. Check [documentation versions](../../start/documentation-versions.md) against your installed package.

## centerStrength

The `centerStrength` field accepts number. Its complete constraints are in the [public schema](https://github.com/asadarafat/topoviewer/blob/development/packages/topoviewer/schemas/topoviewer.schema.json).

**Type:** number. **Optional.** Optional; no schema default.

## chargeStrength

The `chargeStrength` field accepts number. Its complete constraints are in the [public schema](https://github.com/asadarafat/topoviewer/blob/development/packages/topoviewer/schemas/topoviewer.schema.json).

**Type:** number. **Optional.** Optional; no schema default.

## clos

The `clos` field accepts clos Layout. Its complete constraints are in the [public schema](https://github.com/asadarafat/topoviewer/blob/development/packages/topoviewer/schemas/topoviewer.schema.json).

**Type:** clos Layout. **Optional.** Optional; no schema default.

[clos Layout fields](closLayout.md)

## collideRadius

The `collideRadius` field accepts number. Its complete constraints are in the [public schema](https://github.com/asadarafat/topoviewer/blob/development/packages/topoviewer/schemas/topoviewer.schema.json).

**Type:** number. **Optional.** Optional; no schema default.

## height

The `height` field accepts number. Its complete constraints are in the [public schema](https://github.com/asadarafat/topoviewer/blob/development/packages/topoviewer/schemas/topoviewer.schema.json).

**Type:** number. **Optional.** Optional; no schema default.

## inferLabelRole

The `inferLabelRole` field accepts infer Label Role. Its complete constraints are in the [public schema](https://github.com/asadarafat/topoviewer/blob/development/packages/topoviewer/schemas/topoviewer.schema.json).

**Type:** infer Label Role. **Optional.** Optional; no schema default.

## iterations

The `iterations` field accepts integer. Its complete constraints are in the [public schema](https://github.com/asadarafat/topoviewer/blob/development/packages/topoviewer/schemas/topoviewer.schema.json).

**Type:** integer. **Optional.** Optional; no schema default.

**Values:** Number >= 1. Maximum: 1000.

## linkDistance

The `linkDistance` field accepts number. Its complete constraints are in the [public schema](https://github.com/asadarafat/topoviewer/blob/development/packages/topoviewer/schemas/topoviewer.schema.json).

**Type:** number. **Optional.** Optional; no schema default.

## mode

Mode selecting the behavior of this object; use the values below and its related workflow guide.

**Type:** manual \| force \| clos \| tree. **Optional.** Optional; no schema default.

**Values:** `manual`, `force`, `clos`, `tree`

**Validation:** enum checked.

## tree

The `tree` field accepts tree Layout. Its complete constraints are in the [public schema](https://github.com/asadarafat/topoviewer/blob/development/packages/topoviewer/schemas/topoviewer.schema.json).

**Type:** tree Layout. **Optional.** Optional; no schema default.

[tree Layout fields](treeLayout.md)

## width

The `width` field accepts number. Its complete constraints are in the [public schema](https://github.com/asadarafat/topoviewer/blob/development/packages/topoviewer/schemas/topoviewer.schema.json).

**Type:** number. **Optional.** Optional; no schema default.
