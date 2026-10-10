# Graph fields

[Field lookup](../object-attributes.md) · [YAML field contracts](../reference-model.md) · [Validate YAML](../../author/validate-yaml.md)

Applies to the development document contract. Check [documentation versions](../../start/documentation-versions.md) against your installed package.

## data

Arbitrary facts for domain metadata, selectors, mappers, and host applications.

**Type:** data. **Optional.** Defaults to an empty object when absent.

Selector namespace for stable facts: `[data.<key> = "..."]`.

## id

Stable identifier used by references, selectors, mapper joins, and diagnostics.

**Type:** string. **Optional.** Optional; no schema default.

Selectable as `[id = "..."]` where the object kind supports selectors.

## labels

Low-cardinality classification data for selectors, filters, and mapper joins.

**Type:** labels. **Optional.** Defaults to an empty object when absent.

Primary selector namespace: `[labels.<key> = "..."]`.

## layers

Available visibility layers. Each object references these declared IDs in its layers list.

**Type:** array of layer. **Optional.** Declare the available visibility layers; objects reference these IDs.

**Validation:** semantic reference checks apply.

## links

Direct relationships with two endpoints. Their domain meaning is supplied by the author.

**Type:** array of link. **Optional.** Optional; no schema default.

## nodes

Identified entities such as routers, services, workloads, or interfaces.

**Type:** array of node. **Optional.** Optional; no schema default.

## paths

Identified ordered routes or carried service paths; these do not calculate routing.

**Type:** array of path. **Optional.** Optional; no schema default.

## regions

Membership or containment boundaries around identified objects.

**Type:** array of region. **Optional.** Optional; no schema default.
