# Mapper Overlay fields

[Field lookup](../object-attributes.md) · [YAML field contracts](../reference-model.md) · [Validate YAML](../../author/validate-yaml.md)

**Support status:** Experimental

## backgroundColorBySeverity

Color compatible object backgrounds using the resolved severity palette.

**Type:** boolean. **Optional.** Optional; no schema default.

## badgeLabel

Badge label template rendered on compatible target objects.

**Type:** string. **Optional.** Optional; no schema default.

## borderColorBySeverity

Color compatible object borders using the resolved severity palette.

**Type:** boolean. **Optional.** Optional; no schema default.

## label

Runtime label template rendered for the resolved target.

**Type:** string. **Optional.** Optional; no schema default.

## lineColorBySeverity

Color link or path lines using the resolved severity palette.

**Type:** boolean. **Optional.** Optional; no schema default.

## lineWidthBySeverity

Increase link or path line width according to resolved severity.

**Type:** boolean. **Optional.** Optional; no schema default.

## outlineBySeverity

Apply a severity-colored outline to compatible topology objects.

**Type:** boolean. **Optional.** Optional; no schema default.

## propagateToLayerMembers

Apply a layer-targeted overlay to the objects that belong to the resolved layer.

**Type:** boolean. **Optional.** Optional; no schema default.

## sourceArrowColorBySeverity

Color source arrow markers using the resolved severity palette.

**Type:** boolean. **Optional.** Optional; no schema default.

## statusMarker

Display a compact status marker using the resolved severity color.

**Type:** boolean. **Optional.** Optional; no schema default.

## style

Explicit TopoViewer style patch applied to every object resolved by the mapping.

**Type:** object. **Optional.** Absent means stylesheet rules and runtime defaults determine presentation.

## targetArrowColorBySeverity

Color target arrow markers using the resolved severity palette.

**Type:** boolean. **Optional.** Optional; no schema default.
