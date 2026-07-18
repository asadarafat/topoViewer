# Edit Workspace

**Support status:** Experimental

Studio puts topology properties and appearance controls in one contextual
workspace without merging their source documents. Select an object and Studio
opens **Edit > Visual**. Select empty canvas and Studio opens **Viewport**.

The ownership boundary remains explicit:

- topology fields write to `topology.yaml`;
- appearance fields write to a candidate `stylesheet.yaml`;
- the Mapper workspace owns both visual mapper authoring and `mapper.yaml` code.

This keeps the common workflow short while preserving portable TopoViewer YAML.

## Visual Editing

Visual keeps the selected object's ID, optional display alias, position, layers, and common
appearance controls in one compact property workspace. The selection strip
identifies the active object, and the property area is the only vertical scroll
owner in the panel. Labels stay in the left column and their Material UI controls
stay in the right column at both the default quarter-width panel and the supported
half-width panel.

Visual contains two collapsible sections.

**Topology** edits object facts such as its canonical ID, `labels.name` alias,
and position. These controls
commit through the project document session and remain undoable. ID and layer
membership are visible without opening a secondary Advanced form. Switch to
**Code** when the object needs fields that are not exposed as a visual control.

**Appearance** exposes typed Material UI controls generated from the core style
metadata. It supports nodes, links, link directions, paths, regions, shapes,
callouts, and text objects. Controls include colors with opacity, switches,
bounded numbers, enumerated values, icons, text, and supported nested styles.

Search covers labels, canonical property names, descriptions, groups, and
aliases. Visual starts with eight common, non-nested fields derived from the core
style metadata. Descriptions remain available as accessible label help without
adding a paragraph below every field. Choose **View more** to reveal applicable
less-common and nested fields in the same list; there is no separate Advanced
mode.

## Selected Object Appearance

Visual appearance controls create or update exact-ID rules for the current
selection in the candidate stylesheet:

```yaml
stylesheet:
  - selector: 'node[id = "core-1"]'
    style:
      backgroundColor: "#1565c0"
```

It does not add an inline `style` to `topology.yaml`. Reset removes only that
candidate field so the object inherits from other matching rules again.

Visual does not expose selector construction or YAML navigation. It stays scoped
to direct visual editing of the selected object. Author reusable selector policy
in **Code > stylesheet.yaml**:

```yaml
stylesheet:
  - selector: 'node[labels.role = "router"]'
    style:
      backgroundColor: "#1565c0"
```

Code provides selector and style completion derived from topology IDs, labels,
and data. Studio does not infer compound Boolean selectors or silently tag
objects.

Same-kind multi-selection remains available in Visual. Mixed values are
identified explicitly and one candidate transaction updates the selected
exact-ID rules. Mixed-kind selection remains Code-only.

## Code Editing

**Visual** and **Code** are two representations of the same project. Choose
**Code** to open the source editor, then select an actual project file:

- `topology.yaml` for graph and diagram facts;
- `stylesheet.yaml` for reusable visual policy.

Monaco loads only when Code is activated. Switching files preserves each
file's unapplied draft, so inspecting another document does not discard work.

`topology.yaml` reveals the selected object when a source range is available.
Changes apply through the topology document session. Invalid text remains in
the editor with diagnostics while the canvas keeps the last valid topology.

`stylesheet.yaml` edits the same candidate used by Appearance. It provides
source-mapped diagnostics, hover help, target-compatible property and value
completion, project icon completion, and selectors derived from topology IDs,
labels, and data. The toolbar can search, reveal a matching rule, or format
after an explicit warning.

Structural completion covers stylesheet root fields and the supported nested
contracts under `layout`, `layout.clos`, `limits`, `toggles`, icons, and
`nodeLayout`. A standalone `?` in a supported property or value position opens
contextual discovery. Comments, quoted strings, block scalars, URLs, and SVG
source remain unchanged.

## Candidate Lifecycle

Appearance and `stylesheet.yaml` write only to the stylesheet candidate until
**Apply** is selected. The footer reports whether the candidate is applied,
being checked, valid and dirty, or invalid and dirty.

An applied candidate uses a compact status-only footer. **Apply** and **Revert**
appear when candidate work exists, so the clean state does not reserve action
space that cannot be used.

The canvas previews the latest valid candidate. If a newer stylesheet edit is
invalid, Studio retains that raw text and its diagnostics while rendering the
last valid candidate. **Revert** restores the applied stylesheet. **Apply**
replaces `stylesheet.yaml` as one undoable command.

Save and export apply a valid dirty stylesheet candidate first. An invalid
candidate blocks those operations. Project switching and external changes
require an explicit apply, revert, discard, or reload decision when candidate
work would otherwise be lost.

## Canonical Source Ownership

Studio-created objects write identity and structure to `topology.yaml` and
generated appearance to exact-ID stylesheet rules. Canonical `0.2` topology
therefore has no inline visual owner competing with the stylesheet.

Use the explicit repository migration command for a version `0.1` or unversioned
bundle that still has generic names or inline appearance. Studio does not expose
an object-level **Move all** control because migration must consider the complete
topology and stylesheet together. See [Identity And Source Ownership](../identity-and-source-ownership.md)
for the canonical contract, semantic rename behavior, and migration command.

Structured edits preserve comments, blank lines, scalar style, aliases, unknown
keys, line endings, and rule order when a safe local mutation exists. Operations
that require broader normalization require explicit review.

Open **Mapper > Code** to edit `mapper.yaml`. Keeping mapper source with its
visual rule builder gives telemetry binding one clear owner.
