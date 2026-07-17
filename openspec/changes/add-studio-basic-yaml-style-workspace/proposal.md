## Why

Studio baseline `f8071f9` exposes an object-only
Attribute/Value panel and writes edits directly into inline topology styles,
while raw stylesheet YAML lives in a separate drawer with a different draft
lifecycle. Authors cannot move predictably between visual controls and YAML, and
the UI does not yet provide one coherent stylesheet-authoring workflow.

## What Changes

- Replace separate Properties and Style destinations with one contextual Edit
  workspace using `Visual` and `Code` representations.
- Keep topology facts and stylesheet policy separate underneath: Visual presents
  both in one workflow, while Code provides actual `topology.yaml`,
  `stylesheet.yaml`, and available `mapper.yaml` file tabs.
- Make both representations edit one loss-aware candidate `stylesheet.yaml`
  source and render the last valid candidate without creating a second visual model.
- Generate Visual controls, contextual YAML completion, hover help, and value
  validation from canonical `topoviewer` style authoring metadata.
- Represent new selected-object styling as exact-ID stylesheet rules. Preserve
  existing inline topology styles and require an explicit atomic migration when
  an author chooses to move one into the stylesheet.
- Keep Visual selection-scoped: it edits the selected objects through exact-ID
  rules and does not expose selector construction or YAML navigation controls.
  Reusable selector authoring remains in Code through `stylesheet.yaml`.
- Preserve comments, ordering, scalar style, unknown fields, selection, and
  viewport state across edits, mode switches, Apply, and Revert.
- Add target-aware YAML completion, value completion, diagnostics, Code-owned
  source navigation, and context-safe `?` discovery without changing selector
  grammar.
- Support same-kind multi-selection with mixed-value reporting and one atomic
  transaction of exact-ID stylesheet edits; reject mixed-kind Visual editing.
- Define draft behavior for Save, workspace close, project switch, external
  source changes, undo, recovery, and invalid YAML.
- Retire the duplicate global source workspace. Topology and stylesheet source
  belong to `Edit > Code`; mapper source belongs to `Mapper > Code`.
  Normalization confirmation remains a focused review dialog.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `studio-spec-driven-authoring`: Specify a metadata-driven Visual/Code workspace
  backed by one candidate stylesheet and retire stale matrix requirements that
  are not part of baseline `f8071f9`.
- `studio-product-contract`: Extend project state with explicit candidate style
  preview, Apply/Revert, Save, recovery, and external-change behavior.
- `studio-production-readiness`: Add contextual editor, source-preservation,
  accessibility, performance, browser, and host-parity gates for style authoring.

## Impact

- Primary implementation owner: `packages/topoviewer-studio` session, command,
  Style workspace, Monaco integration, and browser tests.
- Shared pure contracts: `packages/topoviewer` authoring metadata, selectors,
  provenance, and tests. The renderer and public YAML schema remain compatible.
- Existing inline `style` fields remain supported and retain current precedence.
- No new runtime dependency is planned; Studio already owns `yaml`, Monaco, MUI,
  and React Flow dependencies.
- MkDocs, Zensical, React, static embed, and Grafana remain read-only consumers
  of the same exported stylesheet and require no destination-specific authoring
  model.
- This change modifies requirements introduced by the active
  `build-topoviewer-studio` change and must remain active until that parent change
  establishes the baseline Studio specifications.
