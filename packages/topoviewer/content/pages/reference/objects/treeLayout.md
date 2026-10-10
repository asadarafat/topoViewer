# Tree Layout Options fields

[Field lookup](../object-attributes.md) · [YAML field contracts](../reference-model.md) · [Validate YAML](../../author/validate-yaml.md)

Applies to the development document contract. Check [documentation versions](../../start/documentation-versions.md) against your installed package.

## componentGap

The `componentGap` field accepts number. Its complete constraints are in the [public schema](https://github.com/asadarafat/topoviewer/blob/development/packages/topoviewer/schemas/topoviewer.schema.json).

**Type:** number. **Optional.** Optional; no schema default.

**Values:** Number >= 40. Maximum: 1600.

## direction

The `direction` field accepts topToBottom | bottomToTop | leftToRight | rightToLeft. Its complete constraints are in the [public schema](https://github.com/asadarafat/topoviewer/blob/development/packages/topoviewer/schemas/topoviewer.schema.json).

**Type:** topToBottom \| bottomToTop \| leftToRight \| rightToLeft. **Optional.** Optional; no schema default.

**Values:** `topToBottom`, `bottomToTop`, `leftToRight`, `rightToLeft`

**Validation:** enum checked.

## levelGap

The `levelGap` field accepts number. Its complete constraints are in the [public schema](https://github.com/asadarafat/topoviewer/blob/development/packages/topoviewer/schemas/topoviewer.schema.json).

**Type:** number. **Optional.** Optional; no schema default.

**Values:** Number >= 40. Maximum: 1000.

## nodeGap

The `nodeGap` field accepts number. Its complete constraints are in the [public schema](https://github.com/asadarafat/topoviewer/blob/development/packages/topoviewer/schemas/topoviewer.schema.json).

**Type:** number. **Optional.** Optional; no schema default.

**Values:** Number >= 40. Maximum: 800.
