## Context

The topology schema and core renderer already support one optional top-level
`attention` policy containing focus queries, interactive click behavior,
aggregate groups, and parallel-link grouping. Studio renders that policy from
its valid semantic projection, but Project Source currently treats Attention as
an ordinary source-range link. A palette helper can create one narrow
`attention.links.grouping` fragment, yet there is no shared visual controller
for inspecting or changing the complete singleton policy.

The topology document remains authoritative. Studio commands operate against
the latest valid session snapshot, patch source through the existing command
dispatcher, preserve invalid drafts, and provide undo/redo. Browser and Wails
mount the same Studio application; host adapters do not own topology semantics.

## Goals / Non-Goals

**Goals:**

- Make Attention discoverable as a project-level view policy without adding
  another workspace tab or canvas toolbar control.
- Cover the common operator workflows: focus stable object IDs, configure
  presentation and click focus, aggregate a selected region or parent, and
  configure parallel-link grouping.
- Preserve every attention clause not explicitly changed by a visual action.
- Commit one source command per action and keep source, preview, history,
  selection, diagnostics, and recovery coherent.
- Keep optional UI out of the initial Studio bundle and preserve browser/Wails
  parity.

**Non-Goals:**

- Replace schema-aware YAML editing for label, data, selector, dependency,
  change, or viewport-threshold queries.
- Change the topology schema, attention runtime, renderer, aggregate geometry,
  mapper contract, or host persistence API.
- Add automatic query inference, telemetry-driven rule generation, or a second
  attention document.
- Make diagram annotations valid attention focus targets when the core
  attention index does not support them.

## Decisions

### Core owns bounded attention actions

`topoviewer/authoring/attention` will expose a pure reducer accepting the
current valid document and a discriminated attention action. The granular
entry keeps this optional workflow out of consumers that use the broad
`topoviewer/authoring` surface. It returns a new attention policy or `undefined`
when the policy is removed. The reducer validates object references,
presentation modes, group sources, unique group IDs, grouping thresholds, and
non-empty grouping keys, and never mutates its input.

The action contract covers:

- interactive enablement and click mode;
- focus IDs, focus mode, and clearing the focus query;
- creating/removing region or parent aggregate groups, initial expanded state,
  and click expansion;
- link-grouping enablement, threshold, keys, selector, and click expansion; and
- removing the complete attention policy.

The reducer updates only the owned field for each action and structurally
preserves advanced query and viewport clauses. A compact summary projection
provides configured-feature counts and advanced-clause indicators to Studio.

Alternative rejected: implement nested object spreading independently in the
React panel. That would make Studio a second owner of attention invariants and
would be easy to diverge from the public schema.

### Studio commits the singleton policy through one source mutation

A Studio attention capability calls the core reducer against the latest valid
session snapshot, then executes one `upsert-value` or `remove-value` mutation at
`attention`. This intentionally replaces only the attention block while
preserving the rest of the topology source, selection, and unknown project
fields. The command dispatcher remains the owner of history, recovery,
normalization, and error presentation.

Alternative rejected: emit many field-level commands from the panel. That
would complicate cleanup of now-empty nested objects and permit partial
attention state if one step failed.

### Attention is a project-level singleton, not an outline object

Project Source will render a dedicated View policies section containing one
Attention row with configuration status and a separate disclosure affordance.
Attention does not appear in Topology Outline because it is a policy over the
graph rather than a graph, diagram, or collection object. Expanding the row
lazy-loads one MUI manager. An unconfigured policy offers direct actions to
enable click focus or focus the current compatible selection; it does not
display an Add button that would imply multiple attention documents.

The visual manager contains bounded Focus, Aggregation, and Parallel links
sections plus View YAML and Remove Attention actions. It visibly reports when
advanced YAML clauses remain active. Unsupported clauses are inspected but not
round-tripped through independent form state.

Alternative rejected: move the complete Attention manager into selection
Properties. The policy owns graph-wide focus, aggregation, and dense-link
behavior, so presenting it as object state would misrepresent ownership and
encourage divergent per-object policy editors.

### Properties exposes contextual commands, not a second policy editor

When a compatible canvas selection exists, Properties will expose bounded
Attention shortcuts next to that object's topology and appearance controls.
Those shortcuts may replace, extend, or reduce the policy's focused IDs; add a
valid region or parent aggregate; or reveal the project-level Attention
manager. Properties will not expose global modes, link grouping, policy
removal, or independent Attention form state.

One Studio-owned pure projection maps the current selection and core attention
index into focus IDs and an optional aggregate candidate. Both the full manager
and Properties consume that projection, while every mutation still goes
through the same controller capability and pure core reducer.

Alternative rejected: duplicate compatible-selection logic in each panel.
That would allow the manager and Properties to disagree about valid focus or
aggregate targets.

### Selection drives low-click authoring

The focus control uses the core attention index as its object option source.
The shared Studio selection projection can populate supported node, link,
link-direction, path, and region IDs. Region selection can create a region
aggregate; a selected node with children can create a parent aggregate.
Unsupported items are excluded, mixed selections report their compatible
subset, and an empty compatible selection does not emit a command.

### Invalid drafts and advanced YAML are protected

When any invalid topology draft makes visual authoring unavailable, every
source-mutating attention control is disabled. Disclosure, summary, selection
inspection, and View YAML remain available. Visual controls always derive from
the last valid projection and therefore never overwrite an invalid draft.

When advanced query or viewport fields are present, compatible visual changes
preserve them. Removing the full policy uses an explicit confirmation dialog.

### Performance and rendering boundaries

The manager is lazy-loaded after Project Source and does not join the initial
Studio chunk. Object options and summary data are memoized from the current
semantic projection. The core reducer is linear only where it validates an ID
or derives a group source and does not compile or render the graph. No command
is emitted per pointer move or per render.

## Risks / Trade-offs

- **Visual coverage is intentionally incomplete** → Advanced criteria are
  identified, preserved, and linked to YAML instead of being represented by
  misleading partial forms.
- **Replacing the attention block may normalize its internal formatting** →
  The mutation is limited to the owning top-level block; unrelated topology
  source remains byte-preserved and source editing remains available when
  exact attention formatting matters.
- **Large ID option sets could make autocomplete expensive** → Options are
  memoized, MUI limits visible tags, and dense-project performance and bundle
  gates remain required.
- **A selected node may not be a useful aggregate parent** → The core reducer
  rejects parent groups with no children and the UI enables the action only for
  valid candidates.
- **Existing policies may contain future fields** → Runtime parsing remains
  schema-owned; visual actions clone and preserve fields they do not own.

## Migration Plan

This is an additive package and Studio change with no serialized migration.
Existing topology files continue to render unchanged. Rollback removes the
visual manager and additive authoring exports; authored `attention` YAML remains
valid for previous renderer versions that already support the contract.

## Open Questions

None blocking. Broader visual builders for selector, dependency, change, and
viewport policies should be separate evidence-backed changes if source editing
proves insufficient after this workflow ships.
