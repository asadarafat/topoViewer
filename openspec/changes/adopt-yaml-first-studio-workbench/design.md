## Context

Studio already has production-shaped domain boundaries:

| Owner | Existing responsibility |
| --- | --- |
| `topoviewer` | YAML schemas, semantic validation, authoring metadata, compiler, style resolution, provenance, and React Flow rendering |
| `topoviewer-studio/session` | one authoritative project, valid projection, applied-invalid drafts, transient source drafts, selection, history, recovery, and stylesheet candidate |
| Studio capabilities | commands for canvas, palette, properties, styles, mapper, project lifecycle, viewport, and export |
| `StudioHost` | typed project, preference, asset, clipboard, export, recovery, watch, and reporting ports |
| Browser/Wails hosts | persistence and platform operations behind `StudioHost` |

The current shell composes those capabilities through a canvas-first layout with
a right-side rail and one dock for Add, Properties, Mapper, or Project. Monaco
is present but nested inside Properties Code and Mapper Code. That presentation
contradicts the product's topology-as-code positioning and makes source
ownership difficult to discover.

The approved HTML wireframe is an executable interaction specification, not
production code. Its visual hierarchy and workflows are authoritative; its
regular-expression YAML edits, independent preview DOM, global mutable state,
and custom controls are explicitly not implementation inputs.

## Goals / Non-Goals

**Goals:**

- Make topology, stylesheet, mapper, and assets visible as one portable project.
- Keep one schema-aware Monaco editor continuously reachable.
- Render the authoritative projection with the existing `CanvasSurface`.
- Make source and visual edits converge through the existing session and
  command dispatcher.
- Preserve every supported semantic selection and direct-manipulation workflow.
- Keep visual Properties, Add, canvas settings, and Mapper close to preview
  context without displacing source.
- Preserve browser and Wails parity, lossless YAML behavior, recovery, and
  performance budgets.
- Use Material UI and existing Studio tokens as the complete application UI
  system.

**Non-Goals:**

- Change topology, stylesheet, mapper, archive, or asset schemas.
- Add a second document store, renderer, selector engine, mapper engine, or
  persistence API.
- Copy wireframe JavaScript or introduce regex-based YAML mutation.
- Add a destination-specific workflow for MkDocs, Zensical, React, or Grafana.
- Replace Monaco, React Flow, MUI, the command dispatcher, or `StudioHost`.
- Promote Studio support status or redesign TopoViewer-rendered topology.

## Decisions

### One shell state machine owns presentation only

`StudioWorkspace` will retain the controller and all capability wiring. A
small workbench state model will own only:

```ts
type StudioWorkbenchLayout = 'source' | 'split' | 'preview';
type StudioContextDrawer = 'add' | 'properties' | 'mapper' | undefined;

interface StudioWorkbenchPreferences {
  activeDocument: 'topology' | 'stylesheet' | 'mapper';
  activeDock: 'problems' | 'changes' | 'selection' | 'history' | 'host';
  authoringOpen: boolean;
  contextDrawer?: StudioContextDrawer;
  dockCollapsed: boolean;
  layout: StudioWorkbenchLayout;
  navigatorOpen: boolean;
  sourceFraction: number;
}
```

Project documents, drafts, selection, history, validation, and persistence do
not enter this state. The state is stored through the versioned host preference
boundary and normalized when a mapper document does not exist or a narrow
layout cannot display Split.

Keeping the old shell in parallel was rejected because two shells would double
visual regression, preference, and workflow ownership. Adding source as
another rail destination was rejected because YAML would remain hidden behind
the abstraction that caused the problem.

### The project-source navigator is default-visible and toggleable

The left navigator owns project identity, project search, source documents,
asset summary, layers, diagnostics summary, and bounded project actions. It
selects documents and invokes existing lifecycle/capability actions; it never
parses or mutates YAML.

The navigator may be hidden explicitly on desktop or become a temporary drawer
on constrained viewports. Its visibility is presentation state persisted
through `StudioHost`; changing it never mutates project or document state. Its
logical order is Workspace project/files/assets, Authoring entry points,
Topology outline/layers, then Problems. Workspace, Authoring, and Topology
outline remain one navigator, but MUI dividers establish visible section
boundaries so their headings do not read as one undifferentiated list. Document
indicators derive from session/candidate state:

- topology and mapper use canonical/invalid-draft state;
- stylesheet uses applied/candidate state;
- missing mapper is represented as an optional source, not an empty file
  silently added to the bundle;
- optional-document state is trailing metadata on the same document row so all
  source rows keep one height;
- an empty asset collection does not render an inert navigator control, while
  a populated collection uses an explicit disclosure affordance and preserves
  on-demand preview ownership;
- authoring and asset rows do not add local borders that compete with the
  dividers between navigator sections.

Navigator and Authoring previews share one semantic icon vocabulary. The
Object drawer uses Material UI's vertical split metaphor, Regions and Shapes
reuse the exact icons shown by their corresponding palette templates, and the
outline uses the user-facing graph terms Edges and Shapes while retaining the
canonical `graph.links` and `diagram` source paths. The Project Source toggle
mirrors the sidebar icon across its vertical axis so its geometry points toward
the left-owned navigator. These are presentation semantics only and do not
rename YAML keys or introduce a second object taxonomy.

### One shared source editor adapts the three document lifecycles

`StudioSourceWorkspace` will expose a common MUI/Monaco frame while delegating
document-specific state:

| Document | Display value | Apply | Revert |
| --- | --- | --- | --- |
| topology | invalid draft or canonical source | `applySourceDraft` | discard invalid/local draft |
| stylesheet | candidate source | `replaceStylesheetCandidateRaw` then `applyStylesheetCandidate` | `revertStylesheetCandidate` |
| mapper | invalid draft or canonical source | `applySourceDraft` | discard invalid/local draft |

The adapter provides actual file path, diagnostics, dirty/invalid/candidate
state, context help, search, source navigation, and Apply/Revert semantics. It
reuses `MonacoYamlEditor`, `YamlEditorBoundary`, `createStudioYamlAssist`, and
source ranges. Monaco remains lazy.

The compact command toolbar and status row use the same MUI surface token.
Their placement communicates command versus status ownership; a second fill
color does not imply another editor mode.

The source frame separates commands from status. Search, context help,
selection-aware source navigation, and formatting occupy a compact MUI toolbar
above Monaco. Validation state, dirty resolution actions, and cursor position
remain in the status row below Monaco. The toolbar invokes the existing editor
handle and candidate/source-draft commands; it owns no editor or document
state.

Topology and mapper text typed before Apply is owned by one session-level
external-store source-draft controller. The controller is independent from
React component lifetime, restores from recovery, and notifies only draft
consumers so Monaco typing does not rebuild the shell or canvas. Applying a
valid draft transfers ownership to the canonical document session; applying an
invalid draft transfers ownership to the session's invalid-draft state. Revert
clears the transient or applied-invalid owner as applicable. The Monaco
component owns no document buffer.

A component-local text buffer was rejected because project switching, recovery,
saved-state presentation, and external-change handling could not observe it.
Putting transient text directly in the main session snapshot was rejected
because each keystroke would invalidate the shell and renderer boundary. Using
three independent editors was rejected because it would duplicate toolbar,
failure, accessibility, and navigation behavior.

### The preview is the existing renderer and command surface

`CanvasSurface` remains the only preview. It receives the current valid
projection, latest valid stylesheet candidate, mapper overlay state, viewport
preferences, hidden layers, and stable canvas actions exactly as today.

Source edits that validate publish through the session and update preview.
Invalid source remains visible in Monaco while preview keeps the last valid
projection. Direct manipulation continues to update transient renderer state
and commits one source command on gesture completion. Selection is shared
between preview, navigator, source navigation, Properties, and Mapper.

An HTML/SVG preview matching the wireframe was rejected because it would differ
from MkDocs, Zensical, React, and Grafana and violate renderer parity.

The preview-local row owns Edit/Inspect interaction intent, object search, and
source-linked object counts. Edit permits existing direct-manipulation
commands. Inspect preserves selection, navigation, attention, and viewport
interaction while disabling source-mutating canvas gestures. Search resolves
against the authoritative projection and changes selection; it does not create
a filtered preview model.

### Visual authoring uses independent desktop drawer lanes

The preview owns one explicit Authoring lane and one contextual inspection
lane on desktop:

| Lane | Drawer | Existing owner reused |
| --- | --- | --- |
| Left | Authoring | `ObjectPalette` and palette capability |
| Right | Properties | Visual portion of `PropertiesWorkspace`, Inspector, style metadata, viewport properties, and candidate footer |
| Right | Mapper | Visual portion of `MapperWorkspace`, analysis worker, proposals, rules, fields, and coverage |

Opening Authoring sets an explicit `authoringOpen` presentation preference. It
stays open until the author closes it. Selecting an object opens Properties in
the independent right lane unless Mapper owns the current context. Selecting
empty canvas follows the same rule. Creation selects the result and opens
Properties without dismissing Authoring, so repeated palette authoring remains
available while the result is inspected. Mapper preserves its target context
across selection changes. No drawer embeds a second Monaco editor; every "view
source" operation selects the owning document and sends a range request to the
shared source editor.

Properties uses the generated authoring metadata to render compact MUI form
controls. Text, numeric, select, autocomplete, color, and validation
presentations keep one control-owned visible label instead of duplicating a
property label beside an editor. Specialized controls retain their semantic
MUI label and reset action. This changes presentation density only; field
metadata, coercion, candidate ownership, and commit commands remain
authoritative in their existing owners. Appearance filtering uses the same
labeled, outlined MUI field geometry and horizontal gutter as the generated
form controls while retaining search semantics and Escape-to-clear behavior.

The drawer overlays the preview at wide sizes and becomes a modal MUI drawer on
narrow layouts. Fit calculations use the unobscured preview rectangle so nodes
are not hidden behind the drawer or preview toolbar. Preview-local floating
controls consume the same drawer insets, keeping every control visible and
clickable while Add, Properties, or Mapper is open.

Authoring enters from the preview's left edge. Properties and Mapper enter from
the right edge, where opening one replaces the other. Authoring and the right
context drawer close independently, and neither changes the source/preview
split. On narrow layouts all three destinations serialize through one temporary
MUI drawer because preserving two overlays would leave an unusable preview.
The shell does not render permanent Add/Properties/Mapper buttons as a second
workspace navigation system: the project navigator, preview toolbar, selection,
and command search invoke the same presentation state.

### The session dock exposes derived evidence, not another state owner

The bottom dock is a presentation of existing state:

| Dock view | Authoritative owner |
| --- | --- |
| Problems | projection, invalid drafts, and stylesheet candidate diagnostics |
| Changes | command-dispatcher history and current dirty state |
| Selection | session selection and source ranges |
| History | command-dispatcher undo/redo entries |
| Host | `StudioHost`, project revision, watch, recovery, and persistence state |

The dock owns only selected-view and collapsed presentation preferences. It
does not keep independent diagnostics, change, selection, history, or host
records.

### Source and visual operations remain explicit transactions

All visual mutations continue through the existing capability methods and
command dispatcher. The workbench adds no object mutation functions.

- topology facts write only topology source;
- appearance writes stylesheet candidate rules;
- mapper Visual writes mapper source;
- viewport preferences write host preferences;
- direct manipulation commits one command at gesture completion;
- identity rename and deletion cleanup remain atomic cross-document operations;
- normalization requires the existing review flow;
- save/export applies a valid candidate and rejects invalid candidate state.

### Every semantic selection remains representable

The drawer and source navigation must support graph, layer, node, link,
linkDirection, path, region, shape, callout, text, and compatible
multi-selection. Unsupported or mixed edits render an explicit bounded state;
they never coerce object kinds or silently drop fields.

Properties controls remain generated from canonical authoring metadata where
available. Unknown fields stay in source and are preserved by unrelated Visual
edits.

### Project, asset, validation, export, and recovery contracts stay visible

The header and navigator retain:

- project create/open/folder/archive/duplicate/rename/delete;
- host label, saved/modified/saving/invalid/conflict/recovery states;
- undo, redo, search/commands, validate, save, appearance, presentation, and
  feedback;
- asset choose/read/preview and self-contained template insertion;
- diagnostics navigation;
- export formats, progress, typed failures, and result locations;
- external-change review, normalization review, candidate resolution, recovery,
  and retry dialogs.

These operations remain lazy where they are lazy today. Project and host errors
remain typed at the boundary and become actionable MUI alerts; the shell does
not infer filesystem behavior.

### MUI owns chrome; TopoViewer owns diagram rendering

All normal Studio surfaces and controls use MUI components, semantic palette
tokens, typography, spacing, and interaction states. Custom CSS is limited to
Monaco/React Flow integration and renderer-generated DOM. Existing Material,
theme, spacing, typography, and boundary checks remain mandatory.

The repository logo directory is the canonical Studio brand source. Studio
uses the compact mark in the product header and browser favicon, while the
Wails shell derives its application icon from the supplied application artwork.
Brand assets are not copied into independent hand-maintained variants, and the
compact header does not embed the full wordmark or add decorative logo
placements that compete with project identity.

The target follows the approved wireframe hierarchy in both native light and
dark schemes without copying its literal colors. At desktop sizes:

- header is one compact command row;
- navigator is bounded and persistent;
- Split is 25/75 by default;
- source divider is keyboard and pointer resizable between 20 and 50 percent;
- preview remains the dominant surface;
- contextual drawer is subordinate and closable.

### Responsive behavior is explicit

At the desktop breakpoint, Source, Split, and Preview are available. Below the
minimum usable split width:

- Split resolves to Source or Preview while retaining the preferred fraction;
- project source becomes a temporary MUI drawer;
- the contextual drawer is modal and does not create horizontal page overflow;
- source and preview remain separately reachable by keyboard;
- presentation mode renders preview only.

The reference desktop geometry is a 42-pixel header, 246-pixel navigator,
36-pixel context bar, 25/75 source split, 142-pixel expanded dock, and 24-pixel
status bar. These measurements are centralized Studio geometry tokens. The
implementation may adapt them only at documented responsive breakpoints.

### Performance and failure boundaries remain measurable

Project Source, Monaco, Mapper, export, dialogs, archive codecs, and heavy
assets remain lazy. Project Source starts loading immediately when visible, but
its outline and icon vocabulary do not enter the initial application bundle.
Changing layout or selecting a document must not reconstruct the session or
canvas controller. Source-pane resize changes CSS/grid geometry only and is
committed to preferences on pointer/keyboard completion.

Dense graph checks continue to cover 1,000 nodes and representative links.
Monaco failure falls back to raw source while preview remains usable. Mapper or
export failure is isolated to its drawer/dialog. Invalid YAML never blanks the
preview. Wails calls never occur during pointer movement or Monaco typing.

Production Pages and test builds have distinct artifact ownership. The
deployable Studio build alone writes `site/studio` with the
`/topoviewer/studio/` base. Browser, parity, and performance tests write and
serve an ignored test-only output under `.artifacts/`; they must not overwrite
the deployable site or depend on command ordering for a valid asset base.

## Contract Wiring Matrix

| Contract | Workbench entry | Evidence |
| --- | --- | --- |
| topology source and invalid draft | topology file in source navigator | Monaco apply/revert/diagnostics browser tests |
| stylesheet candidate | stylesheet file and candidate status | Visual-to-source, source-to-Visual, Apply/Revert/Save tests |
| mapper source and Visual tools | mapper file and Mapper drawer | rule CRUD, sample analysis, coverage, source round trip |
| semantic selection | real preview | every selection kind and mixed-selection tests |
| direct manipulation | real preview | create/connect/drag/resize/region/path/text tests |
| viewport and layers | canvas Properties plus navigator | preference and visibility tests |
| project lifecycle | header/project navigator | browser and Wails host-conformance journeys |
| assets and presets | source assets and Add drawer | import/security/self-contained insertion tests |
| validation and normalization | header/problems/source ranges | invalid, review, and recovery tests |
| export and presentation | header actions | bundle/image/snippet/error tests |
| accessibility | complete shell | axe, keyboard, VoiceOver-oriented names/focus tests |
| performance | source, preview, drawer boundaries | bundle, startup, drag, source typing, dense graph budgets |

## Risks / Trade-offs

- **Monaco becomes visually prominent and increases startup cost** -> keep its
  module lazy, render an intentional loading skeleton, and enforce initial
  bundle budgets.
- **Three document lifecycles look uniform but have different semantics** ->
  adapt them behind one typed presentation model while retaining distinct
  session/candidate owners.
- **Direct canvas edits race with an invalid topology draft** -> keep the last
  valid projection, disable incompatible Visual mutations with an explanation,
  and never overwrite the invalid buffer.
- **A contextual drawer can hide topology** -> preserve a measured usable
  preview width, serialize drawer lanes when needed, keep their close behavior
  independent, and make fit/viewport bounds drawer-aware.
- **Existing tests encode old rail selectors** -> replace product-shell tests
  while preserving capability-level tests; do not weaken semantic coverage.
- **Desktop host drifts from browser** -> both mount the same exported Studio
  app and run the same golden journey through host-conformance fixtures.
- **A browser test build corrupts the deployable Pages artifact** -> isolate
  test output from `site/studio` and enforce the two build owners in a contract
  test plus docs smoke.
- **Preference migration loses user layout** -> read the legacy workspace
  preference once, map its active document and panel intent where possible, and
  preserve unknown preference values without touching project source.
- **A broad shell rewrite hides missing contracts** -> use the wiring matrix,
  fail-first browser tests, and sequential task evidence before removing the old
  shell.

## Migration Plan

1. Capture current unit, browser, bundle, accessibility, and desktop baselines.
2. Add the new preference normalizer and source-document presentation model
   behind unit tests.
3. Add failing product-shell browser tests using the existing starter project.
4. Implement the navigator, source editor, layout switch, divider, and real
   preview.
5. Adapt Add, Properties, canvas settings, and Mapper Visual into the one
   contextual drawer.
6. Wire source navigation, diagnostics, candidates, assets, lifecycle, export,
   recovery, and host errors.
7. Remove the old rail and embedded duplicate Code representations in the same
   change.
8. Update architecture, canonical docs, generated projections, screenshots,
   and browser/Wails golden journeys.
9. Run focused and full gates before archive.

Rollback is a source-level revert of the shell change. No project or YAML
migration is required, so projects created in either shell remain compatible.

## Open Questions

None. The approved wireframe establishes the presentation hierarchy, and the
existing architecture establishes all data and runtime ownership.
