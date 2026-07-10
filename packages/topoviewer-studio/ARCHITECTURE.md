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

