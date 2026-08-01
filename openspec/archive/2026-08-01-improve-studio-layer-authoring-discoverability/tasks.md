## 1. Contract And Baseline

- [x] 1.1 Audit core, Studio, browser/Wails host, tests, documentation, and
  current local changes to confirm existing layer ownership
- [x] 1.2 Validate the proposal, design, and delta specifications with the
  OpenSpec CLI before production changes
- [x] 1.3 Record the focused pre-change test baseline and identify the tests
  that must fail before implementation

## 2. Test-First Contract

- [x] 2.1 Add a failing core unit test for complete layer-reference counts,
  including diagram connectors and unknown-layer behavior
- [x] 2.2 Add failing Studio browser coverage for explicit disclosure, Add
  cancellation/confirmation, source navigation, selection, and usage counts
- [x] 2.3 Add failing Studio browser coverage proving invalid drafts disable
  YAML mutations without disabling view-only actions
- [x] 2.4 Update existing browser interactions to use the explicit Project
  Source layer affordances while preserving CRUD and safe-delete coverage

## 3. Core Projection

- [x] 3.1 Add one pure `authoringLayerReferenceCount` projection beside the
  existing layer authoring plans
- [x] 3.2 Export the projection through the public authoring entry point without
  changing schemas or runtime behavior
- [x] 3.3 Pass the focused core layer-authoring unit tests

## 4. Studio Layer Experience

- [x] 4.1 Add a count, sibling Add action, and explicit disclosure control to
  the Project Source Layers header without nested interactive elements
- [x] 4.2 Separate manager expansion from `graph.layers` source navigation and
  preserve the lazy feature boundary
- [x] 4.3 Add a Material UI create-layer form with required name, deterministic
  ID preview, cancel semantics, latest-snapshot confirmation, and focus return
- [x] 4.4 Select a newly created or clicked layer for contextual Properties
- [x] 4.5 Display live per-layer usage counts and preserve visibility, rename,
  reorder, membership, and safe-delete behavior
- [x] 4.6 Disable source-changing layer controls while authoring is unavailable
  or the semantic projection is invalid

## 5. Documentation And Contract Alignment

- [x] 5.1 Update canonical Studio authoring documentation to locate Layers in
  Project Source and explain definition, membership, visibility, and View YAML
- [x] 5.2 Synchronize generated documentation from the canonical content source
- [x] 5.3 Confirm no current specification or documentation claims that Layers
  lives on the canvas toolbar

## 6. Evidence And Verification

- [x] 6.1 Pass focused core and Studio unit tests
- [x] 6.2 Pass Studio browser, accessibility, performance, and visual checks in
  both light and dark themes where applicable
- [x] 6.3 Inspect desktop and narrow Playwright screenshots for hierarchy,
  clipping, overlap, and focus affordances
- [x] 6.4 Run the full local `npm run ci` gate and fix every fallout attributable
  to this change
- [x] 6.5 Update this checklist only as each task's evidence passes; do not
  archive the change until implementation and required verification are clean
