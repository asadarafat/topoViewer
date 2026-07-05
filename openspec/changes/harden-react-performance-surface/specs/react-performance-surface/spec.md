## ADDED Requirements

### Requirement: Lazy Authoring Dependencies

TopoViewer SHALL keep heavy YAML authoring dependencies out of initial authoring
surface entry chunks when those dependencies are not needed for first paint.

#### Scenario: Monaco editor is lazy-loaded

- **WHEN** the browser Harness or VS Code webview first boots
- **THEN** Monaco/editor-only authoring code SHALL NOT be part of the initial
  entry chunk where the surface can render useful chrome or preview without it
- **AND** the editor SHALL load when the user opens or uses YAML authoring

#### Scenario: YAML authoring behavior is preserved

- **WHEN** the user opens the YAML authoring tab after lazy loading is added
- **THEN** existing topology, stylesheet, and mapper editing SHALL still work
- **AND** existing diagnostics, YAML assist, apply/revert, and copy/download
  workflows SHALL remain available

#### Scenario: Loading state is explicit

- **WHEN** the editor chunk is still loading
- **THEN** the surface SHALL show a bounded loading state
- **AND** the rest of the surface SHALL NOT crash or render a blank app

### Requirement: Import Boundaries

React authoring surfaces SHALL avoid import forms that defeat practical bundle
inspection or optimization.

#### Scenario: MUI barrel imports are removed from budgeted source paths

- **WHEN** source files under the budgeted Harness and VS Code webview paths are
  checked
- **THEN** imports from broad MUI barrels such as `@mui/material` SHALL be
  replaced with direct imports or covered by a measured Vite-compatible import
  optimizer

#### Scenario: Import check fails on regression

- **WHEN** a budgeted source file reintroduces a forbidden barrel import
- **THEN** the local guardrail SHALL fail with the file path and import text

### Requirement: Bundle Budget Guardrails

TopoViewer SHALL enforce measured bundle budgets for React authoring surfaces.

#### Scenario: Baseline is recorded before budgets are set

- **WHEN** this change starts implementation
- **THEN** current Harness and VS Code webview bundle sizes SHALL be recorded
- **AND** the record SHALL include raw size, gzip size when available, largest
  entry chunk, and largest lazy chunk

#### Scenario: Budgets are based on improved output

- **WHEN** lazy loading and import-boundary changes have been implemented
- **THEN** checked-in budgets SHALL be set from the improved build output
- **AND** the budget file or script SHALL document the allowed regression
  tolerance

#### Scenario: CI fails on meaningful bundle regression

- **WHEN** the Harness or VS Code webview build exceeds its checked-in budget
  plus tolerance
- **THEN** the budget check SHALL fail locally and in CI
- **AND** the failure SHALL identify the offending artifact and measured size

#### Scenario: Initial chunks are distinguished from lazy chunks

- **WHEN** the budget check reports bundle sizes
- **THEN** it SHALL distinguish initial entry chunks from lazy-loaded chunks
- **AND** it SHALL NOT treat a deliberate Monaco lazy chunk as an initial-load
  regression

### Requirement: Webview Render Profiling

TopoViewer SHALL use evidence before refactoring the VS Code webview render
surface.

#### Scenario: Profiling evidence exists before splitting

- **WHEN** `WebviewApp` is refactored for re-render reduction
- **THEN** before-state profiling or render-count evidence SHALL exist
- **AND** the evidence SHALL identify which interactions cause broad re-renders

#### Scenario: Refactor preserves authoring behavior

- **WHEN** editor, preview, rail, or persistence state is split into smaller
  boundaries
- **THEN** existing authoring workflows SHALL continue to pass focused Harness
  or webview smoke tests

#### Scenario: After-state evidence is recorded

- **WHEN** the render-boundary refactor is complete
- **THEN** after-state profiling or render-count evidence SHALL be recorded
- **AND** the result SHALL show no worse behavior for the measured interactions

### Requirement: Safe Browser Storage

TopoViewer SHALL centralize browser storage writes for React authoring surfaces.

#### Scenario: Storage write failures do not crash the app

- **WHEN** `localStorage` or `sessionStorage` throws because storage is
  unavailable, blocked, or over quota
- **THEN** the Harness or webview SHALL continue running
- **AND** the preference write SHALL degrade to an in-memory/default behavior

#### Scenario: Invalid stored JSON is ignored safely

- **WHEN** a stored JSON preference is malformed or has the wrong shape
- **THEN** the storage helper SHALL return the documented fallback
- **AND** the app SHALL NOT crash during startup

#### Scenario: Versioned keys are preserved

- **WHEN** existing versioned preference keys are valid
- **THEN** the storage helper SHALL keep reading them
- **AND** users SHALL NOT lose existing preferences because of this refactor

### Requirement: Validation And Documentation

TopoViewer SHALL document and validate the React performance guardrails.

#### Scenario: Developer docs explain the performance workflow

- **WHEN** a maintainer needs to change Harness or webview React code
- **THEN** documentation SHALL explain how to run the bundle report, budget
  check, and focused authoring smoke

#### Scenario: Final validation includes focused and full checks

- **WHEN** this change is complete
- **THEN** focused bundle, storage, Harness/webview tests SHALL pass
- **AND** full local validation SHALL be run unless the user explicitly scopes
  the validation down
