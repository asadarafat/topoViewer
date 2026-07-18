## Ownership

`packages/topoviewer` owns canonical entity identity, display-label resolution,
selector semantics, topology/style validation, migration, reference indexing,
and semantic rename planning. Host applications consume those contracts.

`packages/topoviewer-studio` owns rename confirmation, source-preserving YAML
application, one-step undo/redo, diagnostics, and reporting external integration
risks. Studio MUST NOT reimplement the reference registry.

## Canonical Entity Contract

Every addressable topology or diagram object has one required unique `id`.
The renderer uses `labels.name` when present and otherwise renders `id`.
`labels.name` is display content and may be duplicated; it is not a reference
and is not rewritten during an ID rename.

Specialized content remains distinct: diagram text uses `text`, callouts use
`title` and `body`, link endpoints use `sourceLabel` and `targetLabel`, and
link-direction runtime values use the direction `label` field.

## Topology And Style Boundary

Topology entities contain identity, semantic labels and data, relationships,
geometry, authored content, and structural interaction declarations. Persistent
visual policy belongs to `*.style.tv.yaml`. Canonical topology source rejects
generic `style`, `icon`, and callout `leader` style declarations.

Migration converts entity appearance to exact-ID stylesheet rules. Callout
leader appearance becomes a rule for the generated leader link selector rather
than remaining nested in the callout object. Mapper runtime overlay style remains
valid in `*.mapper.tv.yaml`; it is runtime state, not persistent topology style.

## Style Precedence

To preserve intentional per-object overrides after inline styles are removed,
the renderer applies rules by specificity and then source order:

1. object-kind rules;
2. semantic label/data rules;
3. exact-ID rules;
4. runtime mapper overlays.

Rules with equal specificity retain source order. Provenance reports the same
ordering used by the compiler.

## Semantic Rename

The core reference index records typed references, not arbitrary matching
strings. A rename plan updates the entity declaration and references including
link endpoints, parents, path members, region members, diagram attachments,
attention IDs, exact-ID selectors, and mapper static object IDs or selectors.

Studio applies the complete topology/stylesheet/mapper mutation set to cloned
sources, validates the final bundle once, and commits all sources or none. One
rename produces one history entry and selects the new ID.

Metric samples, external inventory, host URLs, and selectors embedded in unknown
extension fields are not rewritten. The rename impact report identifies those
boundaries where detectable.

## Compatibility And Migration

The canonical schema version advances from `0.1` to `0.2`. Runtime migration
accepts version `0.1` or unversioned documents, maps `name` or generic `label` to
`labels.name`, and lifts inline appearance into stylesheet rules before strict
validation. Canonical exports always emit `0.2` documents.

Repository-owned sources are migrated rather than relying on runtime migration.
Conflicts such as both `name` and a different `labels.name` are reported and
require an explicit choice; migration never drops either value silently.

## Performance

Reference indexing and rename planning are linear in bundle size. The index is
pure and reusable. A representative 1,000-node project must remain within the
existing Studio command and projection interaction budgets.
