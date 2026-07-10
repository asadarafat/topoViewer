# Current-State Audit

## Existing Strengths To Preserve

The Browser Harness already proves substantial authoring behavior:

- node, link, path, region, shape, and callout CRUD;
- graph-valid paths and deterministic relationship IDs;
- direct movement, resize, marquee, clipboard, alignment, and nudge;
- region membership, group movement, collapse, and expansion;
- smooth transient drag with commit-time YAML persistence;
- helper lines and grid snap;
- Inspector editing for identity, labels, data, relationships, and geometry;
- YAML schema assist, diagnostics, invalid-draft isolation, apply, and revert;
- mapper presets, rule builder, topology-aware pickers, and coverage preview;
- undo/redo, browser persistence, image export, and bundle download;
- broad unit and Playwright regression coverage.

The core package already owns useful authoring facts. `styleDefaults.ts`
defines style keys, labels, target object kinds, data types, values,
descriptions, and default behavior. The mapper JSON Schema describes compact
rules and canonical mappings. These are the correct foundations for generated
forms, but they lack complete UI grouping, control hints, Basic/Advanced
classification, conditions, ordering, provenance, and profile metadata.

## Current Product Gaps

- “Harness” communicates an internal test utility instead of a product.
- The persistent left rail gives implementation categories equal weight:
  Build, Inspect, YAML, Attention, and Layers.
- The Build view is often mostly empty while consuming a large part of the
  viewport.
- Common creation requires selecting a tool and then clicking the canvas;
  object templates are not directly draggable.
- Template lifecycle controls compete with the primary authoring workflow.
- The canvas toolbar is icon-only and visually detached from the object model.
- Style authoring exposes only a subset of the runtime style contract.
- Mapper authoring exposes a curated hand-coded subset rather than the full
  schema and target-compatible style surface.
- Users cannot see why an effective style value won or where an edit will be
  written.
- Save, template revert, YAML draft apply, and YAML draft revert expose several
  overlapping state concepts.
- Browser local storage is useful for fixtures but is not a production project
  store with migrations, quotas, corruption recovery, and crash restoration.

## Current Maintainability Pressure

The current shell coordinates many responsibilities in a few large modules:

```text
WebviewApp.tsx             approximately 1,200 lines
AuthoringRail.tsx          approximately   900 lines
WebviewChrome.tsx          approximately   870 lines
topologyMutations.ts       approximately 1,300 lines
```

Line count is not itself a defect. The risk is broad coordination among
document state, host state, YAML drafts, canvas tools, selection, Inspector,
mapper, persistence, and product navigation. Studio needs explicit state and
ownership boundaries before more UI capability is added.

## Reuse And Move Candidates

Reuse from `topoviewer`:

- renderer, compiler, style resolution, schemas, semantic validation;
- helper-line geometry, label placement, export, limits, and security helpers;
- existing `topoviewer/integration` controls where they fit the Studio shell.

Move with tests from `vscode-topoviewer` into Studio ownership:

- canvas authoring commands and tool state;
- topology mutation and graph-semantic helpers;
- selection, clipboard, alignment, and region commands;
- YAML authoring and diagnostics adapters;
- mapper builder, presets, pickers, and coverage preview;
- browser storage behavior that remains relevant after the persistence redesign.

Keep in `vscode-topoviewer`:

- extension activation and commands;
- VS Code workspace reads/writes and file watching;
- webview messaging, URI translation, and CSP;
- VS Code-specific state restoration and host errors.

## Baseline Evidence Required Before Implementation

Store transient measurements under `.artifacts/topoviewer-studio/baseline/`:

- desktop and narrow screenshots of the default Harness, new topology, object
  selection, YAML editing, and mapper authoring;
- a recorded two-node authoring workflow with gesture/click count;
- initial and lazy bundle sizes;
- startup, 1,000-node render, pan/zoom, drag, drop-to-visible, and commit timing;
- current browser and VS Code persistence/recovery behavior;
- current import/export round-trip behavior for comments, ordering, aliases,
  unknown fields, and unsupported future keys;
- a feature parity matrix mapping each current workflow to reusable code,
  Studio replacement, or deliberate removal.

## Interaction Lessons To Adopt

The useful external-editor lesson is interaction hierarchy: canvas first,
draggable concrete templates, a contextual panel that changes with selection,
clear connection affordances, and few actions between intent and visible
result. Network-lab runtime and lifecycle features are not Studio scope. No
external editor's source architecture is a template to copy; Studio adopts the
observable UX principles while preserving TopoViewer's portable semantic model,
graph rules, and package boundaries.

## Primary Risks

- duplicating the old Harness instead of moving behavior;
- creating a second style or mapper metadata registry;
- losing comments or unknown YAML fields during structured edits;
- generating a generic schema form that is complete but unpleasant to use;
- flooding history and persistence with slider, color, or pointer updates;
- coupling Studio to browser-only or VS Code-only APIs;
- allowing preview/export destinations to become separate authoring modes;
- carrying both Studio and Harness indefinitely;
- claiming production readiness from automated tests without workflow review.
