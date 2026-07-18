## Why

TopoViewer currently exposes both `id` and `name` as ordinary topology object
fields. Studio edits `name` as visible text while graph relationships continue
to reference `id`, so authors cannot reliably trace a visible object through
topology YAML. The same entity contract also accepts inline `style` and `icon`
values, allowing presentation policy to leak into `*.topo.tv.yaml`.

## What Changes

- Make `id` the required, user-editable canonical object key and the default
  rendered label for every addressable topology or diagram object.
- Use optional `labels.name` as a non-unique visible alias when two objects need
  the same displayed text.
- Remove generic object `name` and generic object `label` from the canonical
  topology contract while preserving object-specific content such as text,
  callout titles, endpoint labels, and link-direction values.
- Make an ID change a semantic bundle refactor that updates every schema-defined
  reference in topology, stylesheet, mapper, attention, Studio selection, and
  history state before validating and committing once.
- Reject persistent inline object appearance in topology documents. Move object
  `style`, `icon`, and callout leader appearance into exact-ID stylesheet rules.
- Define selector precedence so exact-ID rules retain the override behavior that
  inline style previously provided.
- Provide a loss-aware migration for existing TopoViewer documents and migrate
  repository-owned examples, fixtures, and documentation.

## Capabilities

### New Capabilities

- `canonical-object-identity`: Canonical editable object IDs, optional visible
  aliases, bundle-wide semantic rename, and strict topology/style ownership.

### Modified Capabilities

- `studio-product-contract`: Studio edits canonical IDs through atomic semantic
  refactors and exposes `labels.name` as an optional alias rather than a second
  competing name field.
- `studio-spec-driven-authoring`: Studio selectors and YAML assistance expose
  exact-ID and `labels.name` selectors while keeping visual policy in the
  stylesheet document.

## Impact

- Core TypeScript types, validation, migration, compiler labels, selector
  precedence, semantic lint, and authoring APIs change.
- Studio command dispatch, document sessions, inspector editing, diagnostics,
  selection, presets, and code editing change.
- Repository topology YAML and generated documentation require migration.
- External telemetry, inventory systems, URLs, and third-party files containing
  an old ID are outside the transaction boundary and must be reported as rename
  risks rather than silently claimed as updated.
