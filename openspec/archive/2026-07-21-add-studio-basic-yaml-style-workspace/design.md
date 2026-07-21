## Context

Studio baseline `f8071f9` has three related but inconsistent paths:

1. the object-only Attribute/Value Style panel resolves effective values but
   writes selected-object edits to inline `style` fields in `topology.yaml`;
2. stylesheet rule commands mutate the applied project session immediately;
3. the advanced source workspace duplicates topology, stylesheet, and mapper
   editors behind a second draft and navigation surface.

The runtime style order is defaults, ordered stylesheet rules, inline object
style, then runtime contribution. Inline style is public and cannot be removed
or silently reinterpreted. The core package already owns style metadata,
selector matching, provenance, validation, and the rendering contract. Studio
already owns loss-aware YAML mutation, valid projection isolation, command
history, Monaco, persistence, and host adapters.

The implementation must preserve extensive uncommitted Studio UI work and must
not fork authoring according to MkDocs, Zensical, React, Grafana, or export
destinations.

## Goals / Non-Goals

**Goals:**

- Give Edit exactly two representations, Visual and Code.
- Merge Properties and Style into one contextual Edit workspace without merging
  their YAML documents or runtime ownership.
- Make one candidate stylesheet source the authority for both representations.
- Preview the latest valid candidate while retaining invalid YAML text.
- Generate controls and editor intelligence from canonical core metadata.
- Keep selected-object styling in stylesheet policy by default.
- Preserve existing inline style behavior and offer only explicit migration.
- Preserve comments, order, unknown fields, selection, and viewport state.
- Keep Monaco lazy and keep candidate processing bounded on dense projects.

**Non-Goals:**

- Changing the public stylesheet schema, selector grammar, or style precedence.
- Removing inline object styles from imported topology documents.
- Removing parser, diagnostics, recovery, normalization review, or document
  session services when retiring the duplicate global source workspace.
- Implementing a visual Boolean selector builder or automatic semantic grouping
  beyond one selector-compatible scalar attribute.
- Adding destination-specific Studio modes or runtime dependencies.
- Exposing all advanced style fields in Visual.

## Decisions

### One framework-independent candidate owner

Add a Studio-owned candidate stylesheet service whose state contains:

- applied source text and source revision;
- current candidate text;
- current diagnostics;
- latest valid candidate text and composed projection;
- dirty state and monotonic validation generation;
- candidate source ranges and selected mode.

Visual controls and Monaco receive projections of this service. Neither owns a
separate style object. The existing project session remains the applied project
authority. Candidate state is temporary authoring state, not a second saved
document model.

Alternative considered: keep Visual inline edits and Code stylesheet edits as
separate paths. Rejected because switching representations would not expose the same edit
and would retain the current ownership ambiguity.

### Candidate evaluation reuses document-session contracts

Extract a pure candidate-evaluation boundary from the existing projection and
YAML-source code. It parses candidate stylesheet text, composes it with current
topology, runs schema, semantic, and security validation, and returns either a
valid projection or source-mapped diagnostics. It does not mutate the applied
session.

Validation is generation-guarded and debounced for free typing. Visual control
commits evaluate immediately. Stale asynchronous/debounced results are ignored.
The canvas receives only the latest valid candidate projection.

Alternative considered: clone a complete `StudioDocumentSession` after every
keystroke. This is useful as a test oracle but rejected as the primary runtime
because it duplicates project/session setup and obscures candidate ownership.

### Apply and Save semantics

Apply dispatches one undoable `replace-source` command for `stylesheet.yaml` and
then rebases the candidate to the resulting applied source revision. Revert
restores the candidate to the current applied stylesheet without changing the
project.

Project Save with a valid dirty candidate first applies that candidate and then
persists the resulting project as one user operation. Save is blocked for an
invalid candidate and focuses the Style diagnostics. Closing the Style panel
preserves candidate state for the current project. Switching projects or
accepting an external stylesheet change requires Apply, Revert, or explicit
discard; Studio never silently rebases dirty candidate text.

Global undo operates on applied project commands. Before Apply, Revert is the
Visual rollback path and Monaco retains its native editor undo stack. Apply
creates one global undo item rather than one item per candidate keystroke.

### Exact-ID rules are the new object-specific stylesheet representation

For a selected target, a Visual edit resolves to the canonical exact-ID selector
already supported by the runtime, for example:

```yaml
stylesheet:
  - selector: node[id = "router-1"]
    style:
      borderWidth: 2
```

Studio updates the last exact-ID rule for the object or appends one after
reusable rules. Rule order remains authoritative. No rule `id` field is added.
Source indicators use the selector and source position rather than a synthetic
rule name.

Existing inline styles remain the final authored winner. When any supported
inline style blocks exact-ID stylesheet values, Visual shows one object-level
notice and does not pretend the stylesheet edit can win. An explicit `Move all`
command atomically creates or updates the exact-ID rule and removes the
supported inline style mapping from topology. Visual does not expose source or
YAML navigation actions; detailed source inspection remains in Code. The
migration command is separate from ordinary candidate editing because it
crosses two source documents.

### Same-kind multi-selection uses deterministic per-object rules

Visual compares effective candidate values across selected objects. Equal
values render normally; different values render `Mixed`. A committed value
updates or creates one exact-ID rule per selected object through one candidate
mutation transaction. Studio does not infer a shared selector. Mixed target
kinds do not expose Visual controls.

### Loss-aware candidate mutations

Candidate mutations reuse the existing parsed YAML/CST representation and
path-targeted scalar and scoped-value operations. Editing an existing scalar
changes only its range. Inserting a property or exact-ID rule preserves comments,
blank lines, order, scalar style, and unknown keys where the YAML library can do
so. An operation that requires broader normalization returns a review result;
Visual does not normalize silently.

### Contextual Monaco assistance

Monaco remains dynamically imported. The completion provider derives context
from the cursor's YAML path and nearest stylesheet rule:

- inside `style`, infer target from that rule's selector and exclude existing
  keys;
- at a style value, offer metadata enum/boolean/icon values compatible with the
  key;
- at `selector`, offer only the existing selector grammar plus topology label,
  data, and ID facts;
- outside a recognized context, provide structural stylesheet keys only.

Hover and diagnostics use the same metadata. `?` discovery is implemented by a
small Monaco controller that activates only when the unquoted token at a valid
key or value position is exactly `?`. It removes that helper token and invokes
Monaco suggestions. It never modifies comments, quoted strings, block scalars,
or URLs.

### Style workspace composition

Replace the separate Properties and Style rail destinations with a contextual
`EditWorkspace` composed of:

- a MUI segmented `Visual | Code` representation switch;
- Visual `Topology` and `Appearance` sections;
- selection-scoped appearance controls that write exact-ID rules;
- grouped, collapsible, metadata-driven fields and inline `View more` expansion;
- lazy topology, stylesheet, and mapper Monaco editors with tabs labelled by
  their actual project document paths;
- fixed candidate status and Apply/Revert footer.

Visual topology controls mutate topology source through the document session.
Visual appearance controls mutate exact-ID rules in the one candidate
stylesheet. Visual intentionally contains no selector builder, match preview,
or YAML/source buttons. Reusable selectors and all YAML navigation live in Code,
which uses the shared Studio Monaco/theme/error boundary. Normalization uses a
focused review dialog rather than another source editor.

### Dense Visual composition

Visual uses one scroll owner below the representation switch. Selection context
is a compact sticky row. Topology and Appearance use MUI-owned disclosure
headers without nested cards. A shared property-row primitive aligns labels and
controls in two columns and exposes descriptions through accessible tooltips.

The default appearance list is derived from compatible basic metadata, excludes
nested editors from the first eight rows, and remains fully searchable. `View
more` reveals the remaining compatible metadata without introducing another
mode. Routine inherited provenance does not reserve a second row; mixed,
explicit, inline, and runtime provenance remains visible when it affects the
author's decision.

The candidate footer always announces status. Clean state hides its disabled
actions visually, while dirty, invalid, and validating states reveal actions in
the same fixed footer row. Code retains its document-specific editor actions.

### Performance, accessibility, and security

- Candidate typing validation is debounced between 200 and 350 ms.
- Monaco remains outside the initial bundle.
- Visual sliders and steppers update local control state during pointer movement
  and mutate candidate YAML only at a transaction boundary.
- Candidate preview must not reset React Flow selection, pan, zoom, or layout.
- Completion, diagnostics, tabs, fields, and actions retain MUI/Monaco keyboard
  semantics and WCAG 2.2 AA targets.
- Candidate YAML passes the same parser limits, schema, semantic lint, content
  security, SVG/image, and renderer limits as applied project YAML.

## Risks / Trade-offs

- **Two levels of dirty state can confuse authors** -> Distinguish `Style draft`
  from project `Modified`, make Save apply a valid candidate, and keep one fixed
  candidate footer.
- **Inline styles can block stylesheet edits** -> Report the winning inline
  source and require an explicit atomic migration.
- **Repeated exact-ID rules can grow the stylesheet** -> Reuse existing exact-ID
  rules, remove empty rules, and make bulk creation visible in the candidate diff.
- **YAML insertion may require normalization** -> Reuse normalization review and
  never perform broad formatting from Visual controls silently.
- **Validation can stall large canvases** -> Debounce typing, guard stale work,
  measure 1,000-node behavior, and retain the last valid projection.
- **Multiple source editors create ambiguous ownership** -> Retire the global
  source workspace and keep each document with its owning Code representation.
  Preserve shared Monaco, assist, diagnostics, recovery, and source services.
- **Current dirty UI changes overlap the same files** -> Add new boundaries
  first and migrate incrementally without reverting unrelated work.

## Migration Plan

1. Land candidate and mutation services behind unit tests without changing UI.
2. Add the new Style workspace while retaining the current object-only
   Attribute/Value panel as a temporary rollback component.
3. Migrate Visual editing, candidate preview, and Apply/Revert.
4. Add embedded Code and contextual assistance.
5. Add multi-selection, inline migration, accessibility, and performance gates.
6. Remove the superseded matrix only after browser and source-preservation tests
   pass.

Rollback restores the old Style component while leaving the candidate services
unused. Public YAML remains compatible throughout.

## Open Questions

- None blocking. Rule labels use selector text/source position because the
  current public rule contract has no `id`.
