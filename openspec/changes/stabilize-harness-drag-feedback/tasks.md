## Sequencing Rule

Tasks are intentionally sequential. Do not start a later phase until the prior
phase has measurable evidence from tests, command output, traces, or local
artifacts. Transient evidence files must stay out of this OpenSpec change.

## 0. Current-State Confirmation

- [x] 0.1 Inspect `TopoViewer.tsx`, `helperLines.ts`, `regionDrag.ts`, and
      browser harness wiring for live drag behavior
- [x] 0.2 Confirm the harness enables helper lines with snap and midpoint guides
- [x] 0.3 Run a browser harness drag probe and record discontinuity evidence in
      command output
- [x] 0.4 Confirm current tests cover helper-line visibility/final position but
      not drag smoothness

## 1. Reproducible Regression Probe

- [ ] 1.1 Add a focused browser-level drag smoothness test using a deterministic
      two-node manual-layout fixture
- [ ] 1.2 Sample pointer and node screen positions at each drag step
- [ ] 1.3 Fail when node motion has repeated zero-motion frames while the pointer
      moves or when node delta exceeds the pointer delta by a configured
      tolerance
- [ ] 1.4 Keep helper-line visibility and cleanup assertions in the same fixture
- [ ] 1.5 Record the failing baseline output before implementation changes

## 2. Helper-Line State Scheduling

- [ ] 2.1 Change helper-line visual state updates to use `requestAnimationFrame`
- [ ] 2.2 Cancel pending helper-line frames on drag stop, disabled helper lines,
      and component unmount
- [ ] 2.3 Avoid setting helper-line state when the next state is structurally
      equivalent to the current state
- [ ] 2.4 Run focused helper-line unit tests and the failing smoothness probe

## 3. Smooth Drag Snap Model

- [ ] 3.1 Add a runtime-only snap mode or equivalent harness-specific behavior
      that separates live pointer-following from final snap commit
- [ ] 3.2 Keep guide calculation based on the proposed drag position without
      rewriting `NodeChange.position` in smooth mode
- [ ] 3.3 Store the current stable snap candidate in drag-session state
- [ ] 3.4 On drag stop, report the snap candidate only when it is still valid;
      otherwise report the current React Flow node position
- [ ] 3.5 Preserve the existing live-snap path behind explicit compatibility or
      hysteresis if needed
- [ ] 3.6 Run helper-line unit tests, region drag tests, and the smoothness probe

## 4. Candidate Stability

- [ ] 4.1 Add tests for snap candidate acquire/release threshold behavior if live
      snap remains supported
- [ ] 4.2 Prevent rapid candidate switching across equal-distance guide targets
- [ ] 4.3 Make midpoint live snapping opt-in or commit-only for the browser
      harness
- [ ] 4.4 Confirm dense helper-line candidate caps still prevent expensive scans

## 5. Harness And Host Integration

- [ ] 5.1 Update browser harness helper-line options to use the smooth default
- [ ] 5.2 Verify dragged node positions still persist into topology YAML on drag
      stop with undo/redo
- [ ] 5.3 Verify selected-object inspector coordinates update after drag stop
- [ ] 5.4 Verify Grafana runtime node position overrides still work and do not
      mutate mounted bundle YAML
- [ ] 5.5 Verify docs/static embeds still render helper lines only during active
      drag when controls enable them

## 6. Validation

- [ ] 6.1 Run focused helper-line unit tests
- [ ] 6.2 Run focused TopoViewer interaction Playwright tests
- [ ] 6.3 Run focused VS Code harness Playwright tests
- [ ] 6.4 Run `npm run test:vscode-harness`
- [ ] 6.5 Run `npm run ci:quality`
- [ ] 6.6 Run `npm run ci:test:topoviewer`
- [ ] 6.7 Run `npm run ci:test:harness`
- [ ] 6.8 Record final before/after drag smoothness evidence in command output
