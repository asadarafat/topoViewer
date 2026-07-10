# Harness To Studio Parity Contract

This matrix is the reviewable cutover contract between the legacy Browser
Harness and TopoViewer Studio. A workflow is complete only when its replacement
has executable evidence. Harness-specific shell behavior may be removed only
when the product decision is explicit below.

| Harness workflow | Studio disposition | Evidence | Status |
|---|---|---|---|
| Open a built-in fixture | Replaced by browser projects, portable archive import, and curated example bundles rather than a fixture-runner lifecycle. | [persistence browser tests](tests/browser/studio-persistence.spec.ts) | Delivered |
| Create a blank topology | Replaced by a schema-valid starter project and compact New project action. | [shell journey](tests/browser/studio-shell.spec.ts), [project lifecycle](tests/browser/studio-persistence.spec.ts) | Delivered |
| Create a node on the canvas | Replaced by searchable palette drag/drop with a keyboard placement fallback. | [direct CRUD](tests/browser/studio-crud.spec.ts), [keyboard journey](tests/browser/studio-accessibility.spec.ts) | Delivered |
| Create a link directly | Uses visible native React Flow connection affordances, validates endpoints, and normalizes reverse connections. | [direct CRUD](tests/browser/studio-crud.spec.ts) | Delivered |
| Create or edit a path | Uses selected traversal or deterministic shortest-path creation and rejects unreachable traversal. | [path authoring tests](tests/browser/studio-crud.spec.ts) | Delivered |
| Create a region and manage membership | Provides direct placement, containment preview, group movement, collapse/expand, nesting, resize, and explicit release. | [region authoring tests](tests/browser/studio-regions.spec.ts) | Delivered |
| Create shapes and callouts | Uses annotation palette objects in the annotations layer. | [object-family CRUD](tests/browser/studio-crud.spec.ts), [Inspector visual coverage](tests/browser/studio-inspector-visual.spec.ts) | Delivered |
| CRUD every object family | Uses typed commands for nodes, links, paths, regions, shapes, callouts, layers, assets, and presets. | [direct CRUD](tests/browser/studio-crud.spec.ts), [layer CRUD](tests/browser/studio-layers.spec.ts) | Delivered |
| Marquee and multi-select | Reuses the core canvas selection bridge and provides selection-scoped commands. | [selection tests](tests/browser/studio-crud.spec.ts) | Delivered |
| Move, resize, nudge, align, and distribute | Keeps pointer preview transient and commits one transactional source mutation on release. | [direct CRUD](tests/browser/studio-crud.spec.ts), [drag stability](tests/browser/studio-drag-stability.spec.ts) | Delivered |
| Clipboard, duplicate, and delete | Uses deterministic IDs and atomic dependent-object cleanup. | [direct CRUD](tests/browser/studio-crud.spec.ts) | Delivered |
| Helper lines and grid snap | Reuses core renderer settings while keeping active drag outside YAML and persistence work. | [drag stability](tests/browser/studio-drag-stability.spec.ts), [performance contract](PERFORMANCE.md) | Delivered |
| Undo and redo | Replaced by command history with one reversible transaction per semantic gesture. | [command browser tests](tests/browser/studio-crud.spec.ts), [dispatcher unit tests](tests/unit/command-dispatcher.test.ts) | Delivered |
| Toggle layer visibility | Uses canvas settings without changing layer membership. | [layer tests](tests/browser/studio-layers.spec.ts) | Delivered |
| Author layers | Provides create, rename, reorder, assign, filter, and reference-safe delete. | [layer tests](tests/browser/studio-layers.spec.ts) | Delivered |
| Author attention and overlays | Replaces the permanent Attention tab with Inspector/document controls and independent endpoint/bandwidth overlays. | [overlay tests](tests/browser/studio-overlays.spec.ts), [generated Inspector coverage](tests/browser/studio-inspector.spec.ts) | Delivered |
| Edit identity, labels, and data | Uses selection-driven object controls and generated metadata fields. | [Inspector tests](tests/browser/studio-inspector.spec.ts), [direct CRUD](tests/browser/studio-crud.spec.ts) | Delivered |
| Create style rules | Requires an explicit object or matching-rule scope and previews provenance. | [style scope and provenance](tests/browser/studio-inspector.spec.ts) | Delivered |
| Edit typed style values | Generates Basic, Advanced, All, and Modified views from canonical authoring metadata. | [Inspector tests](tests/browser/studio-inspector.spec.ts), [authoring profile tests](tests/unit/authoring-profile.test.ts) | Delivered |
| Edit YAML in Monaco | Lazy-loads isolated topology, stylesheet, and mapper models in the workspace drawer. | [YAML workspace tests](tests/browser/studio-yaml-workspace.spec.ts) | Delivered |
| Use YAML completion, hover, and diagnostics | Derives assistance from canonical schemas/metadata and maps source ranges to canvas objects. | [YAML workspace tests](tests/browser/studio-yaml-workspace.spec.ts), [YAML assistance unit tests](tests/unit/yaml-assist.test.ts) | Delivered |
| Apply or revert an invalid draft | Preserves the last valid canvas projection and offers source diagnostics, diff review, and explicit revert. | [YAML recovery tests](tests/browser/studio-yaml-workspace.spec.ts), [recovery persistence](tests/browser/studio-persistence.spec.ts) | Delivered |
| Build mapper rules from presets/forms | Replaced by schema-driven Basic and Advanced mapper authoring in the same project. | [mapper authoring tests](tests/browser/studio-mapper.spec.ts) | Delivered |
| Pick mapper topology identities | Uses current selection, discovered metrics, compatible join fields, and explicit ambiguity resolution. | [mapper discovery tests](tests/browser/studio-mapper.spec.ts) | Delivered |
| Preview mapper coverage | Reports resolved, unresolved, ambiguous, duplicate, and ignored samples with rule/object navigation. | [mapper coverage tests](tests/browser/studio-mapper.spec.ts) | Delivered |
| Persist browser work | Replaced by IndexedDB projects, bounded recovery snapshots, and actionable storage failures. | [persistence tests](tests/browser/studio-persistence.spec.ts), [host conformance](tests/unit/host-conformance.test.ts) | Delivered |
| Save and watch a VS Code workspace | Kept as a host adapter with workspace trust, atomic writes, file watching, and conflict handling. | [VS Code golden journey](../vscode-topoviewer/tests/studio-host/golden-authoring.spec.ts), [workspace host tests](../vscode-topoviewer/tests/unit/workspaceStudioHost.test.ts) | Delivered |
| Export PNG or SVG | Reuses a bounded, lazy export path and restores authoring viewport/selection after presentation. | [export tests](tests/browser/studio-export.spec.ts) | Delivered |
| Download a YAML bundle | Replaced by deterministic `.tvstudio` archive export/import plus destination packaging from canonical source. | [archive lifecycle](tests/browser/studio-persistence.spec.ts), [portable consumer tests](tests/unit/project-archive.test.ts) | Delivered |
| Use light, dark, high-contrast, or reduced-motion UI | Uses shared Studio preferences and host theme input with forced-color and reflow coverage. | [accessibility tests](tests/browser/studio-accessibility.spec.ts), [shell tests](tests/browser/studio-shell.spec.ts) | Delivered |
| Resize a permanent authoring rail | Removed. Studio uses contextual sidebars and a resizable lazy bottom drawer so the canvas remains primary. | [workspace drawer tests](tests/browser/studio-yaml-workspace.spec.ts), [product design](../../openspec/changes/build-topoviewer-studio/design.md) | Intentional removal |
| Switch among Build, Inspect, YAML, Attention, and Layers tabs | Removed. The capabilities remain in palette, Inspector, canvas settings, mapper workspace, and YAML drawer without a mode-first shell. | [shell journey](tests/browser/studio-shell.spec.ts), [product design](../../openspec/changes/build-topoviewer-studio/design.md) | Intentional removal |
| Revert a built-in fixture | Removed. Save/reload/recovery apply to owned projects; examples are import sources rather than mutable fixture state. | [project lifecycle](tests/browser/studio-persistence.spec.ts), [product design](../../openspec/changes/build-topoviewer-studio/design.md) | Intentional removal |
| Show the debug input route | Retained only as deterministic test-host instrumentation and excluded from the production host path. | [test host](src/hosts/testHost.ts), [production entry](src/main.tsx) | Test-only |

There are no unapproved parity gaps. The supported compatibility boundary is the
portable TopoViewer source bundle, not Harness shell state or fixture lifecycle.
