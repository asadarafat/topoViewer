## Context

TopoViewer has three relevant ownership layers:

- `topoviewer` owns graph schemas, compilation, rendering, semantic validation,
  style metadata, and host-neutral authoring operations.
- `topoviewer-studio` owns the React and Material UI authoring product, Monaco,
  the document session, commands, history, recovery state, project archives,
  export orchestration, and the `StudioHost` port.
- host adapters own persistence, native lifecycle, filesystem access,
  preferences, export destinations, and transport.

Browser Studio implements `StudioHost` with IndexedDB and optional File System
Access APIs. The experimental VS Code package mounts the same application in a
webview. It also contains `WorkspaceStudioHost`, which is mostly host-neutral
directory-project policy: canonical relative paths, source decoding, project
revisions, recovery, conflict detection, bounded assets, and coordinated
multi-document writes. Keeping that policy under a VS Code package would force
the desktop app either to depend on the retiring adapter or duplicate it.

The VS Code extension is private, experimental, and not published as a VSIX.
The repository can therefore remove that unsupported surface without a public
file-format migration. Existing TopoViewer bundles remain the compatibility
boundary.

Wails v2.13.0 is the current stable Wails v2 module. Wails v3 remains
pre-release and is not an acceptable production dependency for this change.
Wails embeds the compiled frontend and uses each operating system's native
webview, so one source tree produces separate platform artifacts rather than
one executable that runs unchanged on every operating system.

## Goals / Non-Goals

**Goals:**

- Ship the existing Studio application as a dedicated Wails desktop product.
- Preserve one React authoring implementation across browser and desktop.
- Produce versioned macOS, Windows, and Linux release artifacts.
- Provide native folder/file dialogs and reliable local project persistence.
- Preserve typed host errors, recovery, external-change conflicts, source
  fidelity, security limits, and deterministic exports.
- Move host-neutral directory project rules into `topoviewer-studio`.
- Remove the experimental VS Code package after desktop host parity passes.
- Keep core topology, stylesheet, mapper, and consumer contracts unchanged.

**Non-Goals:**

- Reimplementing graph, YAML, mapper, style, history, or export policy in Go.
- Replacing Browser Studio.
- Shipping one identical executable for all operating systems.
- Building on Wails v3 while it is pre-release.
- Adding cloud accounts, synchronization, collaboration, telemetry ingestion,
  automatic updates, or destination-specific authoring models.
- Claiming supported desktop distribution before signing and platform smoke
  evidence exists.

## Decisions

### 1. Keep React Studio authoritative

The Wails frontend SHALL be a thin entry point that imports the public
`topoviewer-studio/app` entry and supplies a `DesktopStudioHost`. It SHALL NOT
copy feature components or import Studio source paths.

Dependency direction:

```text
desktop frontend -> topoviewer-studio public app and host contracts
desktop Go host  -> operating-system APIs and host transport DTOs
topoviewer-studio -> topoviewer public package
```

Go owns files and native lifecycle. TypeScript owns project interpretation and
all TopoViewer semantics.

**Rejected:** A Go rewrite would duplicate the document session, schemas,
validation, style metadata, mapper behavior, and tests while making Browser
Studio a second product.

### 2. Use pinned Wails v2.13.0

The desktop Go module and reproducible tool command SHALL pin Wails v2.13.0.
The repository SHALL NOT install or build against an unbounded `latest`
dependency in CI. Wails v2.13.0 requires Go 1.25 or newer, so desktop
prerequisite checks and CI SHALL use Go 1.25 while the TypeScript repository
continues to require Node.js 24.

**Rejected:** Wails v3 has improved cross-build tooling, but remains alpha. The
product must not make its first desktop persistence surface depend on a
pre-release runtime.

### 3. Add an application-owned desktop directory

The executable SHALL live under `apps/topoviewer-studio-desktop`. Its frontend
is an npm workspace that consumes the built Studio package. Its Go module owns
Wails configuration, native services, embedded frontend assets, icons, and
platform packaging metadata.

Applications are not added to the public npm package contract. The desktop
frontend package remains private.

### 4. Extract one host-neutral directory-project owner

`WorkspaceStudioHost` policy SHALL move from the VS Code package to
`topoviewer-studio` and be renamed around directory projects rather than an
editor workspace. It SHALL consume a narrow `StudioDirectoryPort`.

The shared TypeScript owner retains:

- canonical relative paths and bundle limits;
- topology, stylesheet, mapper, and asset projection;
- source and asset revision calculation;
- recovery acceptance rules;
- external-change suppression for self-writes;
- typed Studio errors;
- coordinated multi-document saves with rollback.

The port owns only native mechanisms:

- choose and retain an approved root;
- enumerate safe relative files;
- read bytes;
- commit a set of relative writes;
- choose assets and export destinations;
- store bounded preferences and recovery;
- watch approved roots;
- report host events.

This extraction is justified because browser-independent directory policy
already exists and both VS Code during migration and Wails consume the same
concept.

### 5. Keep absolute paths inside Go

The frontend SHALL receive an opaque project token, display name, relative
entries, bytes, revisions, and typed errors. It SHALL NOT receive authority to
read or write arbitrary absolute paths.

The Go host SHALL:

- create a token only after a native directory selection;
- canonicalize and retain the approved root;
- reject empty, absolute, traversal, and malformed relative paths;
- reject symbolic links and files that resolve outside the root;
- enforce Studio file-count and byte limits before returning content;
- use restrictive app-data permissions for preferences and recovery;
- redact absolute user paths from normal logs and reports.

The desktop frontend SHALL validate every native response before projecting it
into the Studio host contract.

### 6. Coordinate saves as a recoverable transaction

The Go host SHALL stage every changed document beside its target, flush and
close staged files, retain bounded backups for existing targets, and rename
staged files only after all staging succeeds. If a rename fails, it SHALL
restore prior files where possible and return a typed partial-failure error.
Temporary files SHALL be removed on success and best-effort cleanup.

The caller supplies the expected directory revision. A changed revision SHALL
return `conflict` without writing. Self-generated watcher events SHALL be
suppressed, while external changes are emitted after a bounded debounce.

True atomic replacement of multiple independent files is not available on all
target filesystems. The contract is therefore coordinated, rollback-capable
multi-file persistence rather than an inaccurate claim of filesystem-level
atomicity.

### 7. Start from a recoverable local project

Desktop Studio SHALL reopen the most recent valid approved directory when
possible. With no recent directory, it SHALL open an untitled starter project
without writing to disk. First Save SHALL use a native directory chooser and
create the canonical source files in an empty destination.

Folder selection, initial source writes, recovery migration, token binding, and
recent-project promotion SHALL be one native first-save operation. The native
service SHALL stage and install the canonical source files before binding the
opaque token or promoting the destination as recent. If validation, staging,
installation, revision calculation, recovery migration, or lifecycle
persistence fails, it SHALL roll back installed files where possible, retain
the untitled authority and dirty project, and return a typed failure. The
frontend SHALL NOT compose first save from separate bind and commit calls.

An existing non-empty bundle is opened through Open Folder rather than selected
as a first-save destination. This keeps creation distinct from adoption and
prevents accidental replacement of unrelated content.

Open Folder SHALL separate temporary root approval from recent-project
promotion. The frontend SHALL load and validate a candidate through a temporary
directory host before replacing the active host. It SHALL promote the candidate
only after validation succeeds, and SHALL release the temporary authority when
validation or promotion fails. This prevents malformed directories from
becoming startup state and keeps the current project intact.

New and imported projects remain Studio-owned in memory until their first
desktop save. Project deletion SHALL never recursively delete a user-selected
directory; removing a recent entry and deleting filesystem content are
different operations.

### 8. Use generated bindings behind an adapter

Generated Wails TypeScript bindings SHALL be consumed only by the desktop
transport adapter. `DesktopStudioHost`, Studio features, and core packages SHALL
not import Wails runtime modules.

Go DTOs SHALL be transport structures, not copies of `StudioProject`. The
frontend adapter translates them to the shared directory port and maps native
failures to `StudioHostErrorCode`.

External file notifications SHALL use one namespaced Wails event whose payload
is runtime-validated before use.

### 9. Keep dense rendering performance in React

The Wails host SHALL not participate in pointer-time canvas behavior. Node
dragging, helper lines, selection, rendering, Monaco, mapper analysis, and
candidate stylesheet preview stay in the existing React/runtime path. Native
persistence runs only at save, recovery, asset, export, and watcher boundaries.

At drag stop, the Studio document session SHALL commit the final coordinates
once and publish that source-backed projection. The TopoViewer incremental
position compiler owns no-jitter reconciliation with React Flow. Studio SHALL
not retain a stale candidate projection as a substitute for reconciliation,
because a remount or later projection update can restore pre-drag coordinates.

Desktop bundle budgets SHALL measure the added entry and generated bindings.
Existing Studio startup, drag, dense graph, Monaco lazy-load, and memory budgets
remain authoritative.

### 10. Build native artifacts on native CI runners

The release matrix SHALL build:

- macOS universal application bundle from arm64 and amd64 binaries, then sign,
  notarize, and package it for distribution;
- Windows amd64 executable and installer with explicit WebView2 bootstrap
  behavior; Windows arm64 remains a separate artifact when enabled;
- Linux amd64 executable plus a package or AppImage with declared
  GTK/WebKitGTK ABI requirements; Linux arm64 remains separate when enabled.

Ordinary pull-request CI SHALL run pure Go tests, frontend tests, contract
tests, and at least one Linux Wails compile/smoke. Native packaging jobs MAY run
only when desktop-owned files change, while trusted signing runs only for
release workflows.

Unsigned or unnotarized artifacts SHALL be labeled internal and SHALL not
promote Desktop Studio to Supported.

### 11. Retire VS Code only after parity

The VS Code package remains a temporary migration oracle while shared directory
policy is extracted. It is removed in the same change only after the Wails host
passes:

- shared host conformance;
- the golden authoring journey;
- save/reload and external-conflict tests;
- hostile path and asset tests;
- Monaco and mapper lazy-workspace checks;
- export round-trip checks.

Removal includes workspace declarations, lockfile entries, root scripts,
bundle budgets, workflows, docs, issue templates, OpenSpec active wording, and
public support tables. Archived OpenSpec history is not rewritten.

## Risks / Trade-offs

- **Native webviews differ across platforms** -> Run the golden journey and
  Monaco smoke on Windows, macOS, and Linux artifacts; retain Browser Studio as
  a recovery and evaluation surface.
- **Linux is not truly dependency-free** -> Publish explicit GTK3 and
  WebKit2GTK ABI requirements and package metadata; do not call the Linux file
  fully static.
- **Windows WebView2 may be missing** -> Build with an explicit bootstrapper
  strategy and test the missing-runtime path.
- **macOS distribution requires credentials** -> Keep signing and notarization
  in a protected release environment; mark unsigned pull-request artifacts
  internal.
- **Multi-file saves can partially fail** -> Stage all writes, retain backups,
  rollback, preserve Studio dirty state, and expose a typed actionable error.
- **File watchers can report self-writes or event storms** -> Tag active writes,
  compare revisions, debounce external events, and make watch cancellation
  deterministic.
- **Generated bindings can drift** -> Pin the Wails generator and add a
  regeneration consistency check.
- **Adding Go increases contributor setup** -> Keep browser development as the
  default UI loop and isolate native prerequisites to desktop commands and CI.
- **Immediate VS Code deletion could hide regressions** -> Delay deletion until
  the Wails parity gate is green, then remove all unsupported surface code
  rather than maintaining both.

## Migration Plan

1. Record current browser and VS Code host parity and package baselines.
2. Add directory-host contract tests in `topoviewer-studio` and prove they fail
   before extraction.
3. Extract directory-project policy and keep VS Code green temporarily.
4. Add the Wails Go service, generated bindings, desktop transport adapter, and
   thin frontend.
5. Pass focused Go, TypeScript, security, and shared host-conformance tests.
6. Add Linux compile/smoke and native platform packaging workflows.
7. Update canonical documentation and support status.
8. Remove the VS Code package and all live references.
9. Run the full local gate and remote platform build matrix.

Rollback before VS Code removal is deletion of the desktop app and restoration
of the prior host export. After removal, source control can restore the
experimental adapter, but no runtime data migration is needed because portable
TopoViewer YAML bundles remain unchanged.

## Open Questions

- Trusted macOS signing and notarization secrets are an operational
  prerequisite and cannot be proven in an untrusted local environment.
- The first Linux public artifact format will be selected from AppImage plus
  distribution packages after runtime smoke evidence; the dependency contract
  is required regardless of format.
- Native Windows arm64 and Linux arm64 artifacts remain optional until the
  amd64 and macOS universal release path is stable.
