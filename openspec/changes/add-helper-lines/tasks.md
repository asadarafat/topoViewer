## Sequencing Rule

Tasks are intentionally sequential. Do not start a later phase until the prior
phase has its required evidence file checked in and reviewed. Each phase must
produce measurable evidence before implementation advances.

## 0. Source Study And Current-State Audit

- [x] 0.1 Read the React Flow helper-lines behavior description
- [x] 0.2 Study React Flow drag, viewport, and overlay integration constraints
- [x] 0.3 Identify the required geometry, overlay, drag wrapper, and drag-stop
      cleanup boundaries
- [x] 0.4 Audit current TopoViewer drag integration points in `TopoViewer.tsx`,
      `regionDrag.ts`, and Grafana panel usage
- [x] 0.5 Decide that helper lines are runtime interaction UI, not
      topology/style/mapper YAML
- [x] 0.6 Write source-study evidence:
      `evidence/phase-0-source-study.md`

## 1. Baseline Evidence Before Implementation

- [ ] 1.1 Capture the current browser harness drag behavior with no helper
      lines
- [ ] 1.2 Capture the current Grafana local node-drag behavior with no helper
      lines, if the Grafana lab is available
- [ ] 1.3 Confirm current `onNodePositionChange` reports unsnapped drag-stop
      coordinates
- [ ] 1.4 Confirm region dragging still translates member nodes before the
      helper-lines feature is added
- [ ] 1.5 Record baseline screenshots and notes in:
      `evidence/phase-1-baseline-drag.md`
- [ ] 1.6 Gate: do not add helper-line code until Phase 1 evidence exists

## 2. Contract Tests First

- [ ] 2.1 Add pure geometry tests for left, center, right, top, center, and
      bottom alignment
- [ ] 2.2 Add geometry tests proving hidden nodes and the dragged node are
      excluded from candidates
- [ ] 2.3 Add geometry tests for measured dimensions falling back to compiled
      dimensions when React Flow measurement is absent
- [ ] 2.4 Add threshold tests proving near misses do not snap outside the
      configured threshold
- [ ] 2.5 Add tests for guide-only mode where lines render but snapped position
      is not applied
- [ ] 2.6 Add tests for snap mode where the snapped position is returned and
      applied to pending node changes
- [ ] 2.7 Add midpoint tests with a candidate cap so `O(n^2)` behavior is
      bounded
- [ ] 2.8 Add region-drag contract tests proving snapped region movement still
      translates region members coherently
- [ ] 2.9 Write evidence:
      `evidence/phase-2-contract-tests.md`
- [ ] 2.10 Gate: do not wire React components until Phase 2 tests exist and
      fail for missing implementation

## 3. Core Geometry And Interaction State

- [ ] 3.1 Add `TopoViewerHelperLinesOptions` and normalized defaults to the
      public TypeScript API
- [ ] 3.2 Implement a pure helper-line geometry module with no React dependency
- [ ] 3.3 Add a React hook to hold helper-line state and throttle visual updates
      with `requestAnimationFrame`
- [ ] 3.4 Add helper-line state cleanup for drag stop, cancelled drag, and
      component unmount
- [ ] 3.5 Intercept position changes so snap mode visibly snaps the dragged
      object during drag
- [ ] 3.6 Preserve existing behavior when helper lines are omitted or disabled
- [ ] 3.7 Preserve region-drag member translation by routing snapped region
      changes through the existing `applyTopoNodeChanges` path
- [ ] 3.8 Run Phase 2 focused tests and typecheck
- [ ] 3.9 Write evidence:
      `evidence/phase-3-geometry-interaction.md`
- [ ] 3.10 Gate: do not add overlay rendering until Phase 3 evidence exists

## 4. Overlay Rendering

- [ ] 4.1 Add an internal `HelperLinesOverlay` component inside the TopoViewer
      React Flow surface
- [ ] 4.2 Transform flow-coordinate guide lines using the active React Flow
      viewport
- [ ] 4.3 Ensure overlay lines stay accurate after pan and zoom
- [ ] 4.4 Ensure the overlay uses `pointer-events: none`
- [ ] 4.5 Ensure z-index is above graph content but below controls, menus, and
      dialogs
- [ ] 4.6 Add CSS variables or theme-safe defaults for normal and midpoint guide
      colors
- [ ] 4.7 Add renderer tests or Playwright checks for line visibility and cleanup
- [ ] 4.8 Write evidence:
      `evidence/phase-4-overlay-rendering.md`
- [ ] 4.9 Gate: do not enable any product surface until Phase 4 evidence exists

## 5. Product Surface Integration

- [ ] 5.1 Expose `helperLines` on `TopoViewerProps`
- [ ] 5.2 Enable helper lines in the browser harness authoring flow or add a
      clear harness toggle
- [ ] 5.3 Add Grafana panel option only if the interaction state model can keep
      helper lines runtime-only
- [ ] 5.4 Ensure Grafana helper lines do not write mounted bundle YAML
- [ ] 5.5 Ensure docs and static examples do not show helper lines unless a
      user is actively dragging
- [ ] 5.6 Add focused tests for Harness behavior
- [ ] 5.7 Add focused tests or smoke evidence for Grafana behavior when the
      option is added
- [ ] 5.8 Write evidence:
      `evidence/phase-5-surface-integration.md`
- [ ] 5.9 Gate: do not document as supported until Phase 5 evidence exists

## 6. Documentation And Examples

- [ ] 6.1 Document helper lines in the TypeScript API reference
- [ ] 6.2 Document that helper lines are runtime/editor interaction and not YAML
      syntax
- [ ] 6.3 Add a short authoring guide for aligning topology objects in the
      browser harness
- [ ] 6.4 Add a focused example with manual layout and card-style nodes where
      helper lines materially improve authoring
- [ ] 6.5 Mention Grafana behavior only if the Grafana option is implemented
- [ ] 6.6 Sync generated MkDocs and Zensical docs
- [ ] 6.7 Write evidence:
      `evidence/phase-6-docs-examples.md`
- [ ] 6.8 Gate: do not run final visual verification until docs are synced

## 7. Visual And Cross-Surface Verification

- [ ] 7.1 Capture Playwright screenshot/video evidence of helper lines in the
      browser harness while dragging a node
- [ ] 7.2 Capture Playwright evidence at a zoomed and panned viewport to prove
      guide lines stay aligned
- [ ] 7.3 Capture evidence for region drag if region helper lines are included
      in the implementation
- [ ] 7.4 Capture evidence that helper lines disappear after drag stop
- [ ] 7.5 Capture evidence that existing examples still render without helper
      lines when the feature is disabled
- [ ] 7.6 Capture Grafana evidence if Grafana helper lines are enabled
- [ ] 7.7 Write evidence:
      `evidence/phase-7-visual-verification.md`
- [ ] 7.8 Gate: do not mark the feature complete until Phase 7 evidence exists

## 8. Final Validation

- [ ] 8.1 Run focused helper-line unit tests
- [ ] 8.2 Run focused TopoViewer renderer tests
- [ ] 8.3 Run focused browser harness Playwright tests
- [ ] 8.4 Run focused Grafana panel tests if Grafana integration changed
- [ ] 8.5 Run `npm run check:content`
- [ ] 8.6 Run `npm run validate:schemas`
- [ ] 8.7 Run `npm run docs:lint`
- [ ] 8.8 Run `npm run render:parity`
- [ ] 8.9 Run full `npm run ci`
- [ ] 8.10 Write final evidence:
      `evidence/phase-8-final-validation.md`
- [ ] 8.11 Archive gate satisfied only after implementation, docs, examples,
      visual evidence, and full CI are complete
