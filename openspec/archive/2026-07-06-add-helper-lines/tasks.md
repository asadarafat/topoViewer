## Sequencing Rule

Tasks are intentionally sequential. Do not start a later phase until the prior
phase has measurable evidence from tests, command output, or local artifacts.
Each phase must produce evidence before implementation advances, but transient
evidence files and screenshots must not be committed under this OpenSpec change.

## 0. Source Study And Current-State Audit

- [x] 0.1 Read the React Flow helper-lines behavior description
- [x] 0.2 Study React Flow drag, viewport, and overlay integration constraints
- [x] 0.3 Identify the required geometry, overlay, drag wrapper, and drag-stop
      cleanup boundaries
- [x] 0.4 Audit current TopoViewer drag integration points in `TopoViewer.tsx`,
      `regionDrag.ts`, and Grafana panel usage
- [x] 0.5 Decide that helper lines are runtime interaction UI, not
      topology/style/mapper YAML
- [x] 0.6 Record source-study evidence in local notes or command output
- [x] 0.7 Audit implementation weaknesses and harden the plan

## 1. Baseline Evidence Before Implementation

- [x] 1.1 Capture the current browser harness drag behavior with no helper
      lines
- [x] 1.2 Capture the current Grafana local node-drag behavior with no helper
      lines, if the Grafana lab is already available; do not block core
      implementation on starting Grafana
- [x] 1.3 Confirm current `onNodePositionChange` reports unsnapped drag-stop
      coordinates
- [x] 1.4 Confirm region dragging still translates member nodes before the
      helper-lines feature is added
- [x] 1.5 Confirm whether parented/contained nodes expose absolute positions
      through React Flow internals in the current renderer
- [x] 1.6 Record baseline screenshots and notes as local validation artifacts
- [x] 1.7 Gate reconciliation: Phase 1 evidence exists and the initial
      sequencing violation is documented before continuing further

## 2. Contract Tests First

- [x] 2.1 Add pure geometry tests for left, center, right, top, center, and
      bottom alignment
- [x] 2.2 Add geometry tests proving hidden nodes and the dragged node are
      excluded from candidates
- [x] 2.3 Add geometry tests for measured dimensions falling back to compiled
      dimensions when React Flow measurement is absent
- [x] 2.4 Add geometry tests proving parent-relative nodes are converted to
      absolute flow-coordinate boxes before alignment
- [x] 2.5 Add threshold tests proving near misses do not snap outside the
      configured threshold
- [x] 2.6 Add tests for guide-only mode where lines render but snapped position
      is not applied
- [x] 2.7 Add tests for snap mode where the snapped position is returned and
      applied to pending node changes
- [x] 2.8 Add tests proving visible fixed objects can be alignment candidates
      even when they are not draggable
- [x] 2.9 Add midpoint tests with a candidate cap so `O(n^2)` behavior is
      bounded
- [x] 2.10 Add region-drag contract tests proving snapped region movement still
      translates region members coherently
- [x] 2.11 Add drag-stop callback tests proving `onNodePositionChange` reports
      the snapped position, not a stale event-node position
- [x] 2.12 Record contract-test evidence in validation output
- [x] 2.13 Gate: do not wire React components until Phase 2 tests exist and
      fail for missing implementation

## 3. Core Geometry And Interaction State

- [x] 3.1 Add `TopoViewerHelperLinesOptions` and normalized defaults to the
      public TypeScript API
- [x] 3.2 Implement a pure helper-line geometry module with no React dependency
- [x] 3.3 Add a helper to extract rendered object boxes in absolute flow
      coordinates from React Flow internals with safe public-node fallbacks
- [x] 3.4 Add a React hook to hold helper-line state and throttle visual updates
      with `requestAnimationFrame`
- [x] 3.5 Add helper-line state cleanup for drag stop, cancelled drag, and
      component unmount
- [x] 3.6 Intercept `NodeChange` position changes so snap mode visibly snaps the
      dragged object during drag
- [x] 3.7 Track snapped drag-session positions so drag-stop callbacks report
      what the user sees
- [x] 3.8 Preserve existing behavior when helper lines are omitted or disabled
- [x] 3.9 Preserve region-drag member translation by routing snapped region
      changes through the existing `applyTopoNodeChanges` path
- [x] 3.10 Run Phase 2 focused tests and typecheck
- [x] 3.11 Record geometry and interaction evidence in validation output
- [x] 3.12 Gate: do not add overlay rendering until Phase 3 evidence exists

## 4. Overlay Rendering

- [x] 4.1 Add an internal `HelperLinesOverlay` component inside the TopoViewer
      React Flow surface
- [x] 4.2 Transform flow-coordinate guide lines using the active React Flow
      viewport
- [x] 4.3 Ensure overlay lines stay accurate after pan and zoom
- [x] 4.4 Ensure the overlay uses `pointer-events: none`
- [x] 4.5 Ensure z-index is above graph content but below controls, menus, and
      dialogs
- [x] 4.6 Add CSS variables or theme-safe defaults for normal and midpoint guide
      colors
- [x] 4.7 Add renderer tests or Playwright checks for line visibility and cleanup
- [x] 4.8 Record overlay-rendering evidence in validation output
- [x] 4.9 Gate: do not enable any product surface until Phase 4 evidence exists

## 5. Product Surface Integration

- [x] 5.1 Expose `helperLines` on `TopoViewerProps`
- [x] 5.2 Enable helper lines in the browser harness authoring flow or add a
      clear harness toggle
- [x] 5.3 Integrate Grafana helper lines through existing interaction state
      without adding YAML or mapper state
- [x] 5.4 Ensure Grafana helper lines do not write mounted bundle YAML
- [x] 5.5 Ensure docs and static examples do not show helper lines unless a
      user is actively dragging
- [x] 5.6 Add focused tests for Harness behavior
- [x] 5.7 Add focused tests or smoke evidence for Grafana behavior when
      interaction-state integration is enabled
- [x] 5.8 Record surface-integration evidence in validation output
- [x] 5.9 Gate: do not document as supported until Phase 5 evidence exists

## 6. Documentation And Examples

- [x] 6.1 Document helper lines in the TypeScript API reference
- [x] 6.2 Document that helper lines are runtime/editor interaction and not YAML
      syntax
- [x] 6.3 Add a short authoring guide for aligning topology objects in the
      browser harness
- [x] 6.4 Add a focused example with manual layout and card-style nodes where
      helper lines materially improve authoring
- [x] 6.5 Mention Grafana behavior only if the Grafana option is implemented
- [x] 6.6 Sync generated MkDocs and Zensical docs
- [x] 6.7 Record docs/examples evidence in validation output
- [x] 6.8 Gate: do not run final visual verification until docs are synced

## 7. Visual And Cross-Surface Verification

- [x] 7.1 Capture Playwright screenshot/video evidence of helper lines in the
      browser harness while dragging a node
- [x] 7.2 Capture Playwright evidence at a zoomed and panned viewport to prove
      guide lines stay aligned
- [x] 7.3 Capture evidence for region drag if region helper lines are included
      in the implementation
- [x] 7.4 Capture evidence that helper lines disappear after drag stop
- [x] 7.5 Capture evidence that existing examples still render without helper
      lines when the feature is disabled
- [x] 7.6 Capture Grafana evidence if Grafana helper lines are enabled
- [x] 7.7 Record visual-verification evidence as local artifacts
- [x] 7.8 Gate: do not mark the feature complete until Phase 7 evidence exists

## 8. Final Validation

- [x] 8.1 Run focused helper-line unit tests
- [x] 8.2 Run focused TopoViewer renderer tests
- [x] 8.3 Run focused browser harness Playwright tests
- [x] 8.4 Run focused Grafana panel tests if Grafana integration changed
- [x] 8.5 Run `npm run check:content`
- [x] 8.6 Run `npm run validate:schemas`
- [x] 8.7 Run `npm run docs:lint`
- [x] 8.8 Run `npm run render:parity`
- [x] 8.9 Run full `npm run ci`
- [x] 8.10 Record final validation evidence in command output
- [x] 8.11 Archive gate satisfied only after implementation, docs, examples,
      visual evidence, and full CI are complete
