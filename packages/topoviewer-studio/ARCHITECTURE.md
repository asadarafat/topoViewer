# TopoViewer Studio Architecture Decisions

## ADR-001: Repository Ownership

`topoviewer` owns renderer/runtime contracts, schemas, validation, style
resolution, provenance, pure graph operations, and pure authoring metadata.
`topoviewer-studio` owns project sessions, commands, authoring UI, browser
projects, mapper authoring, and export orchestration. Host packages own only
their filesystem, lifecycle, security, and transport integrations.

Dependency direction is one way:

```text
topoviewer-studio -> topoviewer
host adapters -> topoviewer-studio + topoviewer public APIs
runtime consumers -> topoviewer public APIs
```

## ADR-002: One Authoritative Session

The Studio session owns source documents, the last valid semantic projection,
invalid drafts, diagnostics, selection, history, and project revision. Canvas,
Inspector, YAML, mapper, preview, and export use projections of that session;
they do not maintain independent writable graphs.

## ADR-003: Lossless Source Editing

YAML syntax trees and source ranges are authoritative for structured edits.
Scalar edits patch only scalar ranges. Collection edits preserve source where
possible and otherwise return an explicit normalization diff for confirmation.
Unknown fields and unsupported future extensions are retained.

## ADR-004: Transactional Commands

Every source mutation is an explicit command. Pointer-time state remains in the
renderer interaction path. A completed gesture commits one command, validation,
persistence request, and history entry. Multi-document operations are atomic.

## ADR-005: Pure Authoring Metadata

The core package owns field existence, type, targets, accepted values, defaults,
descriptions, grouping, and control hints as pure data. Studio renders controls
from that data. UI components are not imported into the core package.

## ADR-006: Explicit Host Boundary

Studio accesses files, persistence, assets, preferences, exports, watches, and
host reporting through `StudioHost`. Feature modules do not import browser or
editor-host APIs directly. Host errors and revision conflicts are typed values.

## ADR-007: Reversible Migration

Studio is introduced on `/studio/` while the Browser Harness remains available.
Authoring behavior moves by capability with tests; it is not copied into two
maintained implementations. Route cutover and old-shell removal are separate
changes after quality gates and a rollback window.

## ADR-008: Self-Contained Visual Templates

Studio owns a small trusted starter-template catalog, while the core package
owns only the semantic node-kind helper. Palette previews, newly created node
icon references, and starter stylesheet declarations resolve from that one
catalog. Creating a visual template in an imported project atomically adds a
missing local icon declaration, so exported bundles do not depend on private
Studio state or remote image URLs.

## ADR-009: Interactive Material UI Is Studio-Owned

Interactive Material controls belong to `topoviewer-studio/src/ui`. Feature
modules consume Studio wrappers for controls, density, focus, color, motion,
and theme behavior; they do not own raw interactive HTML or import interactive
Material components directly. Feature modules may direct-import non-interactive
layout and presentation primitives such as `Box`, `Stack`, and `Typography` so
the UI layer does not become a wrapper-for-wrapper abstraction. A static
repository check enforces this boundary. The public `topoviewer` renderer keeps
React Flow and host-neutral contracts and does not gain a Material dependency.

## ADR-010: Text And Direct Manipulation Stay Portable

The core package owns `diagram.texts`, its schema, compiler, renderer, style
metadata, limits, authoring operations, resize component, and object
double-click event. Studio owns the palette template and anchored Material
editor. Quick edits and completed resizes enter the same transactional YAML
command path as Inspector changes, so browser and VS Code hosts retain identical
source, undo, and export behavior.

## ADR-011: One Candidate Stylesheet

Basic and embedded YAML styling are projections of one framework-independent,
per-project stylesheet candidate controller. Basic performs loss-aware exact-ID
rule mutations; YAML replaces candidate text and validates it after a bounded
debounce. Neither path mutates the applied project until Apply.

The canvas renders the latest valid candidate projection. Invalid raw text,
source-mapped diagnostics, editor mode, and recovery metadata remain candidate
state; the applied project and its last valid projection remain independently
recoverable. Apply dispatches one stylesheet replacement command. Revert rebases
the candidate from applied source. Save and export must first apply a valid dirty
candidate and must reject an invalid candidate.

Candidate evaluation consumes parsed topology, mapper, and stylesheet sources
owned by the document session. Clean context changes adopt the session's already
validated projection instead of parsing and compiling unchanged source again.
This keeps topology dragging outside the stylesheet rebuild path while retaining
one semantic validation boundary.

`useStudioController` composes React state, commands, and host actions.
`controllerStylesheetCandidate` owns candidate synchronization and candidate
commands, while `useStudioStylesheetCandidate` owns only the controller's React
lifecycle. This keeps style-source policy out of the already broad workspace
hook without moving it into UI components or host adapters.
