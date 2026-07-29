# TopoViewer Studio Architecture Decisions

## ADR-001: Repository Ownership

`topoviewer` owns renderer/runtime contracts, schemas, validation, style
resolution, provenance, pure graph operations, and pure authoring metadata.
`topoviewer-studio` owns project sessions, commands, authoring UI, browser
projects, mapper authoring, and export orchestration. Host packages own only
their filesystem, lifecycle, security, and transport integrations.

Studio consumes `topoviewer` through package exports. It does not resolve or
import `packages/topoviewer/src/**`, including during local development.

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

## ADR-007: One Authoring Product

Studio is the only maintained authoring application. Browser Studio and the
Wails desktop shell mount that same application through typed host contracts;
the repository does not ship a second authoring runtime. Rollback uses source
control and release artifacts rather than preserving divergent implementations.

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
command path as Inspector changes, so browser and desktop hosts retain identical
source, undo, and export behavior.

## ADR-011: One Candidate Stylesheet

Visual and embedded YAML styling are projections of one framework-independent,
per-project stylesheet candidate controller. The visual form performs
loss-aware exact-ID rule mutations; YAML replaces candidate text and validates
it after a bounded debounce. Neither path mutates the applied project until
Apply.

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

`useStudioController` composes feature capabilities and shared session state.
`useStudioStyleCapability` owns candidate synchronization, candidate commands,
and its React lifecycle. This keeps style-source policy outside the application
shell without moving it into UI components or host adapters.

## ADR-012: Public Package Consumption Is A Required Boundary

Normal Studio development, type checking, and production builds resolve the
documented `topoviewer` package entries. Vite and TypeScript source aliases into
the core package are prohibited. `npm run studio:packed-core:check` packs the
core artifact, installs it into an isolated workspace, and builds Studio
against that artifact. A missing export therefore fails before publication
instead of working only inside the monorepo.

Static image and PDF code is imported from `topoviewer/export` and remains lazy.
Core source paths, generated chunk names, and unlisted `dist` paths are not
Studio contracts.

## ADR-013: Feature Capabilities Own Domain Behavior

The application shell composes project/session, canvas, style, mapper,
viewport, palette, and export capabilities. Each capability owns its domain
operations and exposes a narrow model/action contract. Feature modules do not
import from `src/app`; the shell may import features, never the reverse.

`CanvasSurface` receives immutable `StudioCanvasModel` and stable
`StudioCanvasActions` objects. It does not receive the root controller or a
flat list of unrelated callbacks. Project/session mutations continue through
transactional commands, while pointer-time drag state remains inside React
Flow and the core renderer.

The dependency direction is:

```text
app composition -> feature capabilities -> session/contracts
                -> topoviewer public entries
host adapters -> Studio app/host contracts
```

`npm run studio:boundaries` rejects reverse feature imports, core source
aliases, direct host API use, and unsafe storage writes.

## ADR-014: Rendering And Expensive Work Have Explicit Owners

Active node movement updates React Flow runtime state. Studio commits source
YAML once on drag stop; a position-only commit patches compiled positions
without rebuilding unchanged topology and stylesheet semantics. The committed
source-backed projection is published immediately, so a remount cannot restore
pre-drag coordinates. Canvas memo boundaries permit selection, style, and
viewport changes to render only the capability they affect.

Monaco, Properties, the generated Inspector, Mapper, archive, and export
workflows remain lazy feature boundaries. Large mapper analysis runs in a worker, while sample text
stays feature-local and only a non-rendering reference crosses the capability
boundary for proposal generation. Viewport culling begins at 100 nodes or 250
links so dense authoring renders the useful working area without changing the
complete source graph.

Performance thresholds live in `performance-budgets.json`; measured reports are
written under ignored `.artifacts/topoviewer-studio/performance/`. Threshold
changes require a before/after measurement and rationale in `PERFORMANCE.md`.

## ADR-015: Context And Theme Have Single Owners

Studio exposes four workspace destinations: Add, Properties, Mapper, and
Project. Add owns object creation. Properties projects either the current
selection or the empty-canvas viewport contract. Mapper is an explicit
specialist workspace and remains active while canvas selection changes. Project
answers "what is in my project" through source files and layers.

The panel changes destination only for a reason the user can see: activating a
rail destination, selecting a canvas object, or opening a document or problem.
Palette creation, edge authoring, drags, and empty-canvas clicks never move it,
so repeated creation is not interrupted and an empty selection simply projects
the viewport contract. Narrow layouts never force the dock open over the object
that was just clicked.

Context changes never steal focus from the canvas object that caused them.
Workspace tabs report the active destination, while the existing polite live
region announces selection and command results.

## ADR-016: One Canvas, One Panel, One Rail

Studio uses a workbench shell rather than a set of competing panes: a 40px
command bar (product, project menu, save state and Save, undo/redo, search,
appearance, export, overflow), the canvas as one unbroken dominant rectangle, a
44px rail on the trailing edge that names every destination, the one authoring
panel outboard of that rail, and a 24px readout (problems, object and link
counts, zoom, host). There is no second panel system and no separate inspector
overlay: the rail is adjacent to the panel it drives, so the relationship
between choosing a destination and seeing it is self-evident.

The panel resizes between 320px and 560px by dragging the handle between canvas
and rail, which grows the panel toward the canvas. Panel width, collapsed
state, and the active destination persist through the `workspace-layout` host
preference so a relaunch restores the previous session. A command palette on
Ctrl/Cmd+K searches objects and commands. Canvas-scoped controls (zoom, fit,
tool mode, selection actions, overlays) stay attached to the canvas rather than
the command bar.

Below the desktop breakpoint the rail stacks above the panel and the pair
becomes a contextual overlay opened from the command bar, so a narrow viewport
never permanently reduces canvas space. Save state appears once, beside the
Save action; the readout states passive facts only.

The host owns one persisted appearance preference: System, Light, or Dark.
Studio owns one canonical color contract (`src/ui/colorContract.ts`) — warm
paper neutrals for the field, plain surfaces for the tools, one functional
accent reserved for interaction, and muted status colors — and
`createStudioTheme` is its only consumer, populating MUI's light
and dark color schemes from it. Monaco follows the resolved scheme, and feature
panels consume semantic MUI palette tokens; no other Studio source file owns
chrome color literals. Canvas content colors belong to project stylesheets and
never borrow the chrome accent. Viewport colors are versioned as either
theme-owned or explicit custom values. Legacy dark defaults migrate to theme
ownership without changing project YAML; explicit legacy colors remain custom.
