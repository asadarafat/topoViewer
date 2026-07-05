## Sequencing Rule

Tasks are intentionally sequential. Do not start a later phase until the prior
phase has measurable evidence from tests, command output, generated reports, or
local artifacts. Do not check tasks out of order when a later task depends on
earlier proof.

Transient traces, bundle reports, screenshots, and profiler files must stay
outside `openspec/changes/**`, preferably under
`.artifacts/react-performance-surface/`.

## 0. Current-State Audit And Baseline

- [x] 0.1 Confirm the worktree state before implementation
- [x] 0.2 Record the exact React best-practice audit findings that motivate
      this change
- [x] 0.3 Inventory Monaco imports in Harness and VS Code webview source paths
- [x] 0.4 Inventory MUI barrel imports in budgeted source paths
- [x] 0.5 Record current Harness build artifact sizes, including raw and gzip
      sizes where available
- [x] 0.6 Record current VS Code webview/harness build artifact sizes,
      including raw and gzip sizes where available
- [x] 0.7 Record current direct `localStorage.setItem` / `sessionStorage`
      write sites in React authoring surfaces
- [x] 0.8 Capture a baseline smoke proving Harness YAML authoring works before
      lazy-loading changes
- [x] 0.9 Gate: do not implement lazy loading until Phase 0 evidence exists

## 1. Bundle Measurement Guardrails First

- [x] 1.1 Add a local bundle-report script for Harness and VS Code webview
      artifacts
- [x] 1.2 Ensure the report distinguishes initial entry chunks from lazy chunks
- [x] 1.3 Ensure the report emits machine-readable output that CI can inspect
- [x] 1.4 Add a temporary no-fail/report-only mode for baseline collection
- [x] 1.5 Add tests or fixture output for the bundle-report parser
- [x] 1.6 Run the report-only command and save local evidence outside OpenSpec
- [x] 1.7 Gate: do not set fail budgets until improved artifact output exists

## 2. Lazy Monaco And YAML Authoring Split

- [x] 2.1 Design the lazy boundary for `TopoViewerWorkbench` editor usage
- [x] 2.2 Design the lazy boundary for `AuthoringRail` / webview editor usage
- [x] 2.3 Add bounded loading states for lazy editor chunks
- [x] 2.4 Dynamically import Monaco/editor components without breaking editor
      refs, diagnostics decorations, or YAML assist
- [x] 2.5 Preserve topology, stylesheet, and mapper tab behavior after lazy
      loading
- [x] 2.6 Add focused tests or Playwright smoke for opening the YAML tab and
      editing/applying YAML after lazy loading
- [x] 2.7 Run the bundle report and confirm Monaco/editor code moved out of the
      initial chunk where expected
- [x] 2.8 Gate: do not proceed to import cleanup until lazy-loading evidence
      exists

## 3. MUI Import Boundary Cleanup

- [x] 3.1 Decide whether direct MUI imports or a Vite-compatible optimizer is
      the safer implementation based on measured output
- [x] 3.2 Replace MUI barrel imports in `TopoViewerWorkbench`
- [x] 3.3 Replace MUI barrel imports in VS Code webview components
- [x] 3.4 Replace or justify remaining barrel imports in budgeted source paths
- [x] 3.5 Add an import guard that fails on forbidden MUI barrel imports in
      budgeted paths
- [x] 3.6 Run typecheck/build for affected packages
- [x] 3.7 Run the bundle report and record before/after import cleanup evidence
- [x] 3.8 Gate: do not enable CI budget failure until import cleanup evidence
      exists

## 4. Checked-In Bundle Budgets

- [x] 4.1 Set Harness initial-entry and lazy-chunk budgets from the improved
      artifact output
- [x] 4.2 Set VS Code webview initial-entry and lazy-chunk budgets from the
      improved artifact output
- [x] 4.3 Document the allowed tolerance and why it is enough for normal build
      variance
- [x] 4.4 Switch the bundle-budget script from report-only to fail-on-regression
      mode
- [x] 4.5 Wire the budget check into the appropriate local CI path
- [x] 4.6 Add a negative test or fixture proving budget failures are actionable
- [x] 4.7 Run the budget check and record passing evidence
- [x] 4.8 Gate: do not refactor WebviewApp state until bundle guardrails are
      active

## 5. Safe Browser Storage Helpers

- [x] 5.1 Add or consolidate a small browser storage helper for string and JSON
      values
- [x] 5.2 Support unavailable storage, blocked storage, quota errors, invalid
      JSON, and fallback defaults
- [x] 5.3 Preserve current versioned keys for split percentage, saved presets,
      active fixture, custom fixtures, and Grafana interaction state where
      applicable
- [x] 5.4 Replace direct storage writes in `WebviewApp`
- [x] 5.5 Replace direct storage writes in webview host helpers where safe
- [x] 5.6 Keep Grafana interaction-state behavior unchanged or explicitly
      migrate it through the shared helper if the boundary fits
- [x] 5.7 Add unit tests for storage unavailable, write failure, invalid JSON,
      valid JSON, and existing-key preservation
- [x] 5.8 Run focused storage tests and affected typecheck
- [x] 5.9 Gate: do not split WebviewApp state until storage behavior is
      centralized and tested

## 6. WebviewApp Profiling Before Refactor

- [x] 6.1 Choose a lightweight profiling method: React Profiler capture,
      render-count instrumentation, or both
- [x] 6.2 Capture baseline evidence for typing in YAML, changing tabs, changing
      selected layers, resizing the split pane, and selecting graph objects
- [x] 6.3 Identify which state updates cause unnecessary preview, rail, or
      editor re-renders
- [x] 6.4 Record baseline profiling evidence under `.artifacts/`
- [x] 6.5 Gate: do not split components without baseline profiling evidence

## 7. WebviewApp State Boundary Refactor

- [x] 7.1 Split editor text/editor-ready/diagnostics state into an editor
      boundary or hook where evidence supports it
- [x] 7.2 Split preview document/viewer rendering into a preview boundary where
      evidence supports it
- [x] 7.3 Split authoring rail controls into narrower typed props and remove
      `Record<string, any>` from `AuthoringRailProps`
- [x] 7.4 Split persistence effects away from render-heavy component paths
- [x] 7.5 Memoize subtrees only where profiling shows a benefit
- [x] 7.6 Preserve YAML assist, object editing, relationship editing, mapper
      builder, diagnostics, and preview behavior
- [x] 7.7 Run focused Harness/webview smoke after each meaningful split
- [x] 7.8 Capture after-state profiling evidence for the same interactions from
      Phase 6
- [x] 7.9 Gate: do not update documentation until focused behavior and profiling
      evidence exists

## 8. Documentation And Developer Workflow

- [x] 8.1 Document the bundle-report command and budget-check command in the
      maintainer/developer docs
- [x] 8.2 Document the lazy editor boundary so future work does not eagerly
      import Monaco again
- [x] 8.3 Document storage-helper usage for authoring surfaces
- [x] 8.4 Update the local dev skill if new guardrail commands become part of
      the standard workflow
- [x] 8.5 Sync generated docs if public or maintainer docs changed
- [x] 8.6 Gate: do not run final validation until docs and generated projections
      are current

## 9. Final Validation

- [x] 9.1 Run bundle report and budget check
- [x] 9.2 Run import-boundary guard
- [x] 9.3 Run focused storage tests
- [x] 9.4 Run focused Harness/webview Playwright or smoke tests
- [x] 9.5 Run affected package typecheck/build commands
- [x] 9.6 Run `npm run ci` unless the user explicitly narrows validation
      (attempted; the generated-projection cleanliness gate stops on the
      intentionally dirty docs projection until this change is committed)
- [x] 9.7 Record final before/after summary in command output or a local
      `.artifacts/` report
- [ ] 9.8 Archive gate satisfied only after implementation, documentation,
      guardrails, local validation, and requested remote validation are complete
