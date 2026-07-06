## Why

The React performance audit against Vercel's React best-practice framework found
that TopoViewer's highest-risk React issue is not the core renderer contract. It
is the authoring surface payload and re-render shape around the browser harness
and VS Code webview.

The current authoring experience eagerly imports heavy editor/runtime
dependencies such as Monaco and broad MUI barrel imports. That makes the first
load heavier than it needs to be and lets bundle growth hide until users feel it.
The checked build artifact already shows a multi-megabyte harness entry chunk.

The webview also has a broad state surface. `WebviewApp` owns editor text,
validation state, object editing state, attention controls, split resizing,
presets, diagnostics, relationship composition, mapper state, and preview state
in one component. That is workable while iterating, but it is not a strong
long-term React shape for a serious authoring tool.

The goal of this change is to harden the React surfaces that users feel first:

- lazy-load heavy YAML authoring/editor functionality;
- stop relying on broad barrel imports where the Vite build cannot optimize
  them for us;
- add measurable bundle budgets for the Harness and VS Code webview;
- profile and reduce unnecessary authoring re-renders;
- make browser storage writes safe and centralized.

This is adoption work. A fast, predictable Harness makes TopoViewer easier to
try, easier to trust, and harder to accidentally regress.

## What Changes

Add performance guardrails and implementation changes for React authoring
surfaces:

- split Monaco/YAML authoring behind dynamic imports;
- replace MUI barrel imports with direct imports or a measured Vite-compatible
  import optimizer;
- add bundle-size reporting and budget checks for the browser Harness and VS
  Code webview;
- profile `WebviewApp` before and after refactoring, then split editor,
  preview, rail, and persistence state boundaries where evidence shows waste;
- wrap direct `localStorage.setItem` calls in safe storage helpers with
  quota/error handling and consistent versioned keys.

The implementation should preserve current user behavior. Users should still be
able to open the Harness, edit topology/style/mapper YAML, use YAML assist, use
object editing controls, preview the graph, and persist local preferences. The
difference should be lower initial payload, clearer chunk boundaries, safer
storage behavior, and less avoidable re-rendering while typing or dragging UI
controls.

## Capabilities

### New Capabilities

- `react-performance-surface`: bundle budgets, lazy authoring chunks, profile
  evidence, and safe browser storage for React authoring surfaces.

### Modified Capabilities

- `topoviewer-harness`: lazy-loads heavy authoring dependencies and is covered
  by bundle budgets.
- `vscode-topoviewer-webview`: uses measured import boundaries, safer storage
  writes, and profiled component splits.
- `topoviewer-ci`: enforces bundle-budget regressions for the authoring
  surfaces.
- `topoviewer-dev-docs`: records the performance workflow and evidence needed
  before changing React authoring surfaces.

## Backward Compatibility

This change must not change topology, stylesheet, mapper, or public renderer
YAML contracts.

The public `topoviewer` runtime API should remain source-compatible unless a
small internal import path is explicitly marked as non-public. React consumers
should not need to change application code because the Harness or webview
became more lazy-loaded.

Storage migration must preserve existing user preferences where practical. When
old storage values are invalid or too large, the app may fall back to defaults
without crashing.

## Non-Goals

- Replacing MUI, Monaco, React Flow, or the current Harness architecture.
- Migrating the repo to Next.js or React Server Components.
- Changing public topology/style/mapper YAML semantics.
- Adding new authoring features.
- Making Grafana performance changes unless shared code directly affects it.
- Enforcing arbitrary byte budgets before measuring the current and improved
  artifact shape.

## Implementation Discipline

Tasks are sequential and evidence-gated. Do not implement a later phase until
the prior phase has measurable evidence in command output, generated reports, or
local artifacts.

This change must include before/after bundle evidence. Budget thresholds should
be set from the improved artifact sizes, not from guesses. Once budgets are
enabled, CI should fail on meaningful regression.

Transient evidence files, screenshots, traces, and profiles belong under
`.artifacts/` and must not be committed under this OpenSpec change.
