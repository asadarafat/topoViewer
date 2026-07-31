## Why

TopoViewer calls topology code, but Studio currently makes the canvas primary
and hides the three YAML documents behind contextual Visual/Code modes. The
approved YAML-first workbench makes the portable bundle visible and editable at
all times while retaining the real renderer and every existing authoring,
mapper, persistence, recovery, and export contract.

## What Changes

- **BREAKING UI:** replace the Add/Properties/Mapper/Project rail shell with one
  YAML-first workbench; this does not break YAML, package, project, or host APIs.
- Keep a persistent project-source navigator for topology, stylesheet, optional
  mapper, assets, layers, diagnostics, and project actions.
- Add one first-class, schema-aware Monaco source pane for all three YAML
  documents, with Source, Split, and Preview layouts.
- Make Split the default desktop layout with a 25 percent source pane and a
  75 percent real TopoViewer preview, using a bounded resizable divider.
- Keep `CanvasSurface` and the authoritative Studio session as the only preview
  and mutation owners; do not copy the wireframe parser or preview engine.
- Move Add, contextual Properties, canvas settings, and Mapper Visual into a
  preview-local drawer that does not replace or duplicate the source editor.
- Preserve direct manipulation, selection, style candidates, invalid drafts,
  source navigation, normalization review, project lifecycle, assets, mapper
  analysis, validation, export, presentation, and recovery behavior.
- Use the existing Material UI theme and controls for browser and Wails Studio,
  with responsive and accessible narrow-screen behavior.
- Retire obsolete canvas-first rail requirements and update architecture,
  canonical documentation, tests, screenshots, and performance evidence.

## Capabilities

### New Capabilities

- `studio-yaml-first-workbench`: defines the source navigator, shared document
  editor, source/preview layouts, real preview, contextual drawers, contract
  wiring, responsiveness, and host-neutral failure behavior.

### Modified Capabilities

- `studio-product-contract`: replaces the canvas-first product shell with one
  portable YAML-first workbench while preserving selection-driven visual
  authoring and destination-neutral bundles.
- `studio-spec-driven-authoring`: replaces the workspace rail and embedded Code
  representations with one shared source editor plus a contextual Visual
  drawer.
- `studio-telemetry-mapper`: keeps mapper YAML in the shared source editor and
  mapper forms, coverage, and inference in the preview-local Visual drawer.
- `studio-production-readiness`: updates visual, accessibility, bundle,
  browser, and Wails evidence for the new shell and removes retired VS Code
  assumptions.

## Impact

The primary implementation is in `packages/topoviewer-studio`, including shell
composition, workspace state, Monaco integration, source navigation, contextual
drawer composition, tests, architecture records, and canonical documentation.
`apps/topoviewer-studio-desktop` remains a thin Wails host and consumes the same
public Studio application. `packages/topoviewer` remains the canonical owner of
schemas, authoring metadata, compilation, and rendering and requires no YAML or
public API migration.

No runtime dependency, destination wizard, host-specific editor, alternate
preview model, or external repository assumption is introduced. Browser and
desktop projects remain backward compatible, including unknown YAML fields,
comments, asset references, recovery snapshots, and optional mapper documents.
