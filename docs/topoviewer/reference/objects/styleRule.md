# Stylesheet Rule fields

[Field lookup](../object-attributes.md) · [YAML field contracts](../reference-model.md) · [Validate YAML](../../author/validate-yaml.md)

Applies to the development document contract. Check [documentation versions](../../start/documentation-versions.md) against your installed package.

## selector

Selector expression that determines which objects a rule affects.

**Type:** string. **Required.** Required; no default.

**Validation:** required; minLength 1.

## style

Visual properties applied to objects matched by this stylesheet rule.

**Type:** style. **Optional.** Absent means stylesheet rules and runtime defaults determine presentation.
