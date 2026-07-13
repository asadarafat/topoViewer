# TopoViewer Studio Design

## Design Principles

1. One portable TopoViewer bundle SHALL be authored once and consumed by every
   supported surface. Studio SHALL NOT ask users to choose MkDocs, Zensical,
   React, Grafana, or presentation before they can begin.
2. The canvas is the primary workspace. YAML, diagnostics, layers, and mapper
   controls support the canvas rather than compete with it for permanent space.
3. Common work SHALL be direct: drag an object to create it, select it to edit
   it, connect visible handles to create relationships, and use keyboard or
   context actions for repeated operations.
4. Runtime schema and style facts SHALL have one canonical owner. Studio may
   add presentation metadata, but SHALL NOT maintain a second list of supported
   fields.
5. Pointer-time interaction state SHALL remain transient. YAML generation,
   validation, persistence, and history commits occur at transaction boundaries.
6. Browser and VS Code hosts SHALL mount the same Studio application and pass
   the same behavior suite. Host-specific filesystem and lifecycle concerns
   stay behind an explicit adapter.
7. Migration SHALL be reversible until Studio has measured parity. Existing
   Harness behavior is a baseline and rollback path, not a permanent duplicate.

## Repository Ownership

```text
packages/topoviewer/
  renderer, compiler, schemas, validation, style resolution, provenance,
  pure graph operations, pure authoring metadata, exported runtime contracts

packages/topoviewer-studio/
  authoring session, command transactions, palette, canvas shell, Inspector,
  YAML workspace, mapper workspace, browser persistence, preview and export UI

packages/vscode-topoviewer/
  extension activation, workspace file access, file watching, webview transport,
  URI translation, CSP, VS Code persistence bridge, Studio mounting

packages/mkdocs-topoviewer/ and packages/grafana-topoviewer-panel/
  consumers of bundle/runtime artifacts; no Studio state or authoring internals
```

Allowed dependency direction:

```text
topoviewer-studio -> topoviewer
vscode-topoviewer -> topoviewer-studio public host entry + topoviewer public API
integration consumers -> topoviewer public runtime/build artifacts
topoviewer -X-> topoviewer-studio or any host package
```

Reusable authoring code currently owned by `vscode-topoviewer` SHALL move with
its tests. Studio SHALL not deep-import host internals during migration.

## Product Shell

The desktop shell consists of four stable areas:

```text
+----------------+-----------------------------------+------------------+
| Object Palette | Canvas                            | Inspector        |
| search/presets | selection, direct manipulation   | selection-aware  |
| drag sources   | layers and helper-line settings  | document-owned   |
+----------------+-----------------------------------+------------------+
| Optional bottom drawer: YAML | Diagnostics | Telemetry | History     |
+-----------------------------------------------------------------------+
```

- The palette is collapsible and searchable. It contains draggable object
  templates, assets, and user presets, not a sequence of modal commands.
- The Inspector follows selection. No selection shows document settings;
  multiple selection shows common actions and compatible bulk fields.
- YAML and mapper details open in a resizable, lazy-loaded drawer.
- Preview, presentation, and export are commands over the current bundle. They
  are not separate authoring modes.
- Narrow screens may replace the sidebars with drawers, but the underlying
  command and session model remains identical.

## Studio Host Contract

`topoviewer-studio` exposes one narrow host interface. The exact TypeScript
shape may evolve before release, but it must cover these capabilities:

```ts
interface StudioHost {
  readonly kind: 'browser' | 'vscode';
  loadProject(reference?: StudioProjectReference): Promise<StudioLoadResult>;
  saveProject(request: StudioSaveRequest): Promise<StudioSaveResult>;
  watchProject?(listener: (event: StudioExternalChange) => void): () => void;
  chooseAssets?(request: StudioAssetRequest): Promise<StudioAssetResult>;
  exportArtifact(request: StudioExportRequest): Promise<void>;
  readPreference<T>(key: string): Promise<T | undefined>;
  writePreference<T>(key: string, value: T): Promise<void>;
  report(event: StudioHostEvent): void;
}
```

The contract passes serializable values and typed errors. It SHALL NOT expose
`window`, VS Code APIs, Node filesystem objects, or host message envelopes to
Studio feature modules.

## Bundle And Session Model

A Studio project contains canonical source documents and assets:

```text
topology.yaml
stylesheet.yaml
mapper.yaml       optional
assets/           optional
project metadata  Studio-only, never required by runtime consumers
```

The authoring session owns:

- parsed YAML syntax trees and source text;
- a validated semantic projection used by the renderer;
- transient canvas state such as active drag, hover, selection, and guides;
- command history and transaction coalescing;
- diagnostics and source ranges;
- project dirty state, save revision, and external-change state;
- user authoring-profile overrides.

There is one authoritative project session. Canvas, Inspector, YAML, mapper,
preview, and export use selectors over that session. They SHALL NOT maintain
independent writable copies of the graph.

## Lossless YAML Editing

Structured edits SHALL target YAML syntax trees rather than serialize an entire
JavaScript object on every change. The implementation SHALL preserve, when the
edited structure permits:

- comments and document directives;
- key ordering and scalar style;
- anchors and aliases not invalidated by the edit;
- unknown fields and future extension keys;
- untouched source ranges and line endings.

If an operation cannot be represented without normalization, Studio SHALL show
the proposed diff and require confirmation. Invalid YAML remains an isolated
draft; the last valid semantic projection continues rendering until the draft
is fixed, reverted, or explicitly replaced.

## Commands, Transactions, And History

Every user mutation is an explicit command with `execute`, `undo`, affected
document paths, and a human-readable summary. Commands may compose into one
transaction.

- One drag gesture creates one history item on drag stop.
- Color, number, slider, resize, and text changes coalesce while the control is
  active and commit on blur, Enter, pointer release, or a short idle boundary.
- Pointer movement, helper-line calculation, hover, and selection do not write
  YAML or history.
- Multi-object actions either complete atomically or leave the session
  unchanged.
- Undo and redo restore source, semantic projection, selection where valid,
  and diagnostics consistently.

Pure graph-semantic mutations remain testable without React or a host.

## Direct Manipulation

### Object creation

Dragging a palette item onto the canvas creates a valid object at the drop
position, assigns a deterministic collision-free ID, places it in the default
compatible layer, selects it, and opens its Inspector. The gesture is one undo
transaction.

Click-to-create and keyboard-create remain accessibility fallbacks, not the
primary path.

### Relationships

React Flow handles and connection validation provide direct link creation.
Studio SHALL expose valid source and target affordances clearly while avoiding
a permanent special mode. Path authoring SHALL respect graph reachability and
shall not delete or replace existing links. Region membership, parent/group
behavior, and annotation placement SHALL use the existing TopoViewer semantic
contracts rather than invent canvas-only relationships.

### Presets

The built-in palette starts with a small, coherent set of topology objects.
Users may save selected objects as local presets. Presets reference canonical
fields, carry a profile version, and migrate or report incompatible fields when
the schema changes.

## Specification-Driven Inspector

The canonical style metadata in `topoviewer` is extended with authoring facts:

```ts
interface AuthoringFieldMetadata {
  path: string;
  label: string;
  description: string;
  targets: readonly StyleTarget[];
  valueType: AuthoringValueType;
  defaultValue?: unknown;
  enumValues?: readonly unknown[];
  group: string;
  level: 'basic' | 'advanced';
  order: number;
  control?: AuthoringControlHint;
  visibleWhen?: AuthoringCondition;
  conflictsWith?: readonly string[];
  examples?: readonly unknown[];
}
```

The runtime schema/default registry remains authoritative for field existence,
type, target compatibility, and defaults. UI grouping and control hints are
validated extensions of that registry. CI SHALL fail if a supported style field
is neither renderable by a generic control nor explicitly assigned a reviewed
specialized editor.

The Inspector presents one style list. Common task-oriented fields appear
immediately; **View More** reveals every additional applicable public field in
the same matrix. Search always covers the complete compatible contract, so a
user never has to choose a mode before finding an attribute.

Users can promote fields to the main list, move them behind View More, hide
them, and reorder fields from a contextual menu. Overrides are sparse,
versioned preferences layered over canonical metadata. Reset restores the
shipped profile without touching topology data.

Nested contracts such as `nodeLayout` render as grouped controls. Specialized
editors are allowed for geometry, selector builders, icons/assets, dash arrays,
and other fields where a generic input would be materially worse.

## Style Provenance And Edit Scope

For every effective field, the Inspector can explain:

- the computed value;
- the default, matching rule, inline value, or telemetry state that supplied it;
- the source document and source range;
- overridden competing values;
- the scope where the next edit will be written.

Users choose an explicit scope when ambiguity exists: selected object override,
existing matching rule, or new reusable rule. Studio SHALL preview the affected
object count before changing a shared rule. It SHALL NOT silently create a
one-object selector when the user believes they are editing a reusable policy.

## Mapper Authoring

Mapper authoring uses the same session, Inspector patterns, metadata pipeline,
and target-compatible style editor as topology styling.

- Basic view provides compact rule creation for common metric-to-object joins.
- Advanced view exposes the canonical mapping contract, identity settings,
  transforms, states, formatting, diagnostics, and conflict behavior.
- Every public mapper field is either represented by a typed control or clearly
  marked as raw-YAML-only until a reviewed editor exists.
- State styles reuse the same applicable style metadata as the target object
  kind; incompatible fields cannot be selected.
- Sample telemetry can be pasted or loaded locally. Dragging a discovered
  metric onto an object proposes a rule using available labels and object
  identity. Studio asks only for unresolved or ambiguous decisions.
- Coverage reports resolved, unresolved, ambiguous, duplicate, and ignored
  samples without requiring Grafana to be running.

The mapper remains optional. A bundle without `mapper.yaml` is fully valid, and
non-telemetry consumers ignore it without requiring a different topology.

## Preview, Presentation, And Export

The live canvas uses the same renderer contracts as consumers. Destination
commands may change viewport chrome, controls, dimensions, theme, or packaging,
but never fork topology data.

Supported outputs include:

- deterministic TopoViewer bundle archive;
- topology, stylesheet, mapper, and asset files;
- PNG and SVG exports with explicit dimensions and theme;
- copyable MkDocs and static-embed snippets that reference the same files;
- Grafana bundle packaging that validates mapper/source requirements;
- distraction-free presentation mode using the current session.

Every export runs schema, semantic, asset, and destination-specific validation.
Warnings may be acknowledged; errors block the affected export only.

## Browser Persistence

The browser host stores projects in IndexedDB, not `localStorage`. Local storage
may contain only small UI preferences through safe, versioned helpers.

Browser projects include schema version, source revision, timestamps, recovery
snapshots, and content hashes. Writes are atomic. Quota, corruption, migration,
and interrupted-write failures surface actionable recovery choices. The File
System Access API may provide explicit folder integration where available;
bundle download/upload remains the portable fallback.

No project or telemetry content leaves the browser unless the user invokes an
explicit host/export action.

## VS Code Host

The VS Code adapter maps the host contract to workspace files and webview
messages. It owns:

- trusted workspace roots and URI translation;
- content security policy and nonce handling;
- atomic writes and external file watching;
- save conflicts using revision/content hashes;
- workspace trust and file-size checks;
- extension lifecycle and error presentation.

An external change while Studio is clean reloads safely. An external change
while Studio is dirty produces a three-way choice: inspect diff, keep Studio
draft, or reload disk. It SHALL NOT silently overwrite either side.

## React And State Boundaries

Studio SHALL avoid one application component coordinating every concern.
Suggested boundaries are:

```text
StudioApp                 host lifecycle and top-level error boundary
StudioSessionProvider     project session and command dispatcher
CanvasSurface             renderer bridge and transient interaction state
ObjectPalette             templates, search, drag sources
Inspector                 selection-derived forms and provenance
WorkspaceDrawer           lazy YAML, diagnostics, telemetry, history panels
PreviewController         presentation and export orchestration
```

Feature components subscribe to narrow selectors. High-frequency drag state is
kept local to the canvas/renderer path. Monaco, YAML assistance, mapper sample
tools, export encoders, and heavy asset pickers load dynamically. Package
imports remain direct and tree-shakeable; new barrel imports in interaction-hot
paths are prohibited.

## Performance Contract

Before implementation, the Harness baseline is measured on a documented
reference machine and browser. Studio budgets are then recorded in CI rather
than inferred from subjective feel.

Initial targets, subject to baseline confirmation:

- initial compressed browser entry SHALL NOT exceed the current Harness entry
  and SHALL exclude Monaco, mapper sample tooling, and export encoders;
- a 1,000-node/2,500-link supported fixture SHALL render without blank output,
  unbounded memory growth, or blocking the UI for more than the recorded budget;
- active drag p95 frame time SHALL stay within one 60 Hz frame where practical
  and SHALL regress by no more than 10 percent from the accepted baseline;
- no representative drag may trigger full-document YAML serialization;
- drop-to-visible SHOULD remain below 100 ms and semantic/YAML commit SHOULD
  remain below 250 ms on the reference runner;
- Inspector search and field switching SHOULD respond within 100 ms for the
  complete style registry;
- long tasks above 50 ms during representative direct manipulation are treated
  as failures unless explicitly measured and waived.

Budgets SHALL use repeatable fixtures and retain before/after JSON reports under
CI artifacts. Threshold changes require a reviewable rationale.

## Accessibility Contract

Studio targets WCAG 2.2 AA for its authoring shell:

- all palette, creation, selection, connection, edit, layer, and export actions
  have keyboard-operable paths;
- drag and drop has an equivalent choose-and-place interaction;
- focus order and focus restoration remain predictable across drawers and
  dialogs;
- controls expose names, descriptions, validation, and current values;
- canvas selections and command results have screen-reader announcements;
- helper lines, states, and diagnostics do not rely on color alone;
- contrast, zoom, high-contrast mode, reduced motion, and narrow viewport tests
  pass;
- icon-only controls have tooltips and accessible names.

Automated accessibility checks are necessary but not sufficient; each release
gate includes a documented keyboard and screen-reader workflow review.

## Security And Resource Boundaries

Studio treats YAML, Markdown, labels, SVG, images, mapper templates, telemetry,
bundle archives, and workspace files as untrusted.

- Runtime sanitizers and renderer limits remain in `topoviewer`.
- Studio validates archive paths, compression ratios, file counts, individual
  sizes, aggregate sizes, data URLs, image dimensions, and supported MIME types.
- SVG preview uses the canonical sanitizer and never executes script or remote
  references.
- Markdown/labels render inert content unless a host explicitly opts into a
  separately reviewed trusted mode.
- The browser host performs no implicit network fetch from imported content.
- The VS Code host enforces workspace roots, trust state, CSP, and atomic writes.
- Telemetry samples are bounded and processed off the interaction-critical path
  when large.
- Import, parser, transform, and renderer failures are contained by error
  boundaries and preserve recoverable source text.

Threat-model tests SHALL cover traversal, archive bombs, hostile SVG/Markdown,
oversized YAML, alias expansion, malicious URLs, mapper expressions, telemetry
cardinality, and corrupt persistence.

## Reliability And Recovery

- Browser sessions maintain bounded recovery snapshots independent of explicit
  saves.
- Crashes or reloads offer recovery when a newer valid draft exists.
- Invalid drafts are never promoted over the last valid recoverable project.
- Migrations are versioned, deterministic, tested forward, and retain a backup.
- Save/export failures preserve the dirty session and provide retryable errors.
- An error in Monaco, mapper tooling, or export does not blank the canvas.
- Destructive actions require undo or explicit confirmation appropriate to
  impact; routine reversible actions avoid modal interruption.

## Testing And Evidence

Testing is layered by ownership:

- `topoviewer`: pure graph operations, metadata completeness, schema,
  validation, provenance, security, and renderer behavior;
- `topoviewer-studio`: command transactions, session/YAML round trips,
  Inspector generation, mapper inference, persistence, React behavior, and
  accessibility;
- browser host: IndexedDB, import/export, recovery, responsive shell, and
  cross-browser Playwright workflows;
- VS Code host: message contract, CSP, file conflicts, workspace trust, and the
  shared Studio behavioral contract;
- integration consumers: exported bundle compatibility, not Studio internals.

The primary Playwright journey is repeated in Chromium, Firefox, and WebKit:

1. create a project;
2. drag two nodes from the palette;
3. connect them;
4. edit common and progressively disclosed style fields;
5. create and validate a mapper rule from sample telemetry;
6. edit YAML, introduce and recover from an error;
7. undo and redo;
8. reload/recover;
9. export and re-import the bundle;
10. verify the same result in a runtime consumer fixture.

Screenshots and traces cover desktop and narrow viewports, light and dark
themes, overlap/blank-output regressions, and representative dense graphs.

## Migration And Cutover

1. Measure and freeze the Harness parity matrix.
2. Introduce Studio at `/studio/` with no change to `/harness/`.
3. Move reusable authoring logic by capability with tests; do not copy and
   maintain parallel implementations.
4. Reach primary workflow parity in browser and VS Code.
5. Run an adoption preview and record deliberate differences or removals.
6. Redirect the public Harness CTA/route only after all production gates pass.
7. Keep one release rollback path.
8. Remove the old shell and compatibility code in a separate reviewed commit.

If Studio fails a production gate, the route remains opt-in and the change
stays active. Feature count alone is not sufficient for cutover.

## Release And Support Position

Studio begins as an experimental application surface. The stable contract is
the exported TopoViewer YAML bundle and core runtime, not Studio's internal
component API. Promotion to supported requires two release cycles without a
data-loss, blank-canvas, unrecoverable persistence, or host-parity regression,
plus completion of every gate in this change.
