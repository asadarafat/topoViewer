# Document Root fields

[Field lookup](../object-attributes.md) · [YAML field contracts](../reference-model.md) · [Validate YAML](../../author/validate-yaml.md)

Applies to the development document contract. Check [documentation versions](../../start/documentation-versions.md) against your installed package.

## $schema

Optional editor/schema hint.

**Type:** string. **Optional.** Optional; no schema default.

## attention

Initial focus, context, aggregation, and parallel-link grouping policy.

**Type:** topoviewer-mkdocs-block.schema.json#/definitions/attention. **Optional.** Optional; no schema default.

## diagram

Explanatory shapes, text, callouts, and connectors. These do not create graph connectivity.

**Type:** diagram. **Optional.** Optional; no schema default.

[diagram fields](diagram.md)

## graph

Semantic objects and relationships: declared layers, nodes, links, paths, and regions.

**Type:** graph. **Optional.** Optional; no schema default.

[graph fields](graph.md)

## icons

Named reusable glyphs, safe image references, or sanitized inline SVG definitions.

**Type:** object of icon. **Optional.** Optional; no schema default.

## labelFields

Ordered source fields to use for visible names when no style rule supplies a label.

**Type:** array of string. **Optional.** Optional; no schema default.

## layout

Layout policy; manual uses source positions, while force, CLOS, and tree compute positions.

**Type:** layout. **Optional.** Optional; no schema default.

[layout fields](layout.md)

## limits

Object and image guardrails checked before the renderer mounts a graph.

**Type:** limits. **Optional.** Optional; no schema default.

[limits fields](limits.md)

## stylesheet

Ordered selector rules assigning presentation to matching topology or diagram objects.

**Type:** array of style Rule. **Optional.** Optional; no schema default.

## toggles

Named display switches with initial reader-visible values.

**Type:** array of toggle. **Optional.** Optional; no schema default.

## version

Document contract version. Canonical topology and stylesheet bundles use 0.2; mapper rules have their own version contract.

**Type:** string. **Optional.** Optional; no schema default.
