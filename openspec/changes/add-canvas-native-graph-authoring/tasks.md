## Sequencing Rule

Tasks are intentionally sequential. Do not start a later phase until the prior
phase has measurable evidence from command output, tests, or ignored local
artifacts. Do not check in transient evidence artifacts under this change.

Each implementation phase must prove:

- the UI behavior works;
- the YAML mutation is correct;
- undo/redo is correct;
- reload persistence is correct when applied state changes;
- browser console errors are either absent or explicitly classified.

## 0. Baseline And Scope Confirmation

- [x] 0.1 Confirm current Harness CRUD coverage for button/Inspector workflows
- [x] 0.2 Add focused authoring regression coverage for fresh-topology
      positioning, visible-layer insertion, regions, links, paths, callouts,
      shapes, delete, undo/redo, and reload persistence
- [x] 0.3 Run focused authoring CRUD tests and full Harness tests
- [x] 0.4 Capture a current UI capability matrix: supported, partially
      supported, missing, and intentionally out of scope
- [x] 0.5 Decide the Phase 1 minimum viable canvas-native tool set

## 1. Interaction Architecture

- [x] 1.1 Define `CanvasAuthoringTool` and tool-state reducer outside
      `WebviewApp.tsx`
- [x] 1.2 Add shared pointer-to-topology coordinate conversion helpers
- [x] 1.3 Add shared `AuthoringCommand` mutation boundary helpers
- [x] 1.4 Gate canvas mutations when YAML draft state is dirty
- [x] 1.5 Add unit tests for tool-state transitions and coordinate conversion
- [x] 1.6 Run unit/typecheck evidence before UI work

## 2. Canvas Tool Palette Shell

- [x] 2.1 Add compact canvas toolbar with select, pan, generic node, link,
      path, region, callout, and shape tools based on implemented support
- [x] 2.2 Add active-tool visual state and cursor state
- [x] 2.3 Add keyboard shortcuts for supported tools
- [x] 2.4 Add tooltip labels and shortcut hints without adding noisy in-app
      explanatory text
- [x] 2.5 Add Playwright smoke coverage for tool activation and keyboard
      shortcuts

## 3. Click-To-Create Generic Nodes

- [x] 3.1 Implement click-to-place for the generic node tool
- [x] 3.2 Use clicked topology coordinates, not hard-coded insertion positions
- [x] 3.3 Respect selected visible authoring layers
- [x] 3.4 Select the newly created object after creation
- [x] 3.5 Add Playwright coverage for generic node click-to-place
- [x] 3.6 Verify undo/redo and reload persistence for click-created nodes

## 4. Drag-To-Connect Links

- [ ] 4.1 Add link drawing interaction state and live preview
- [ ] 4.2 Support source/target node and handle detection
- [ ] 4.3 Commit valid drops as deterministic `graph.links[]` YAML mutations
- [ ] 4.4 Cancel invalid drops without mutating YAML
- [ ] 4.5 Add Playwright coverage for valid link draw, invalid drop, parallel
      link creation, undo/redo, and reload persistence

## 5. Canvas Path Authoring

- [ ] 5.1 Add path tool with click-to-build node sequence
- [ ] 5.2 Show pending path preview and selected sequence state
- [ ] 5.3 Commit with Enter or button, cancel with Escape
- [ ] 5.4 Reject invalid sequences with actionable feedback
- [ ] 5.5 Add Playwright coverage for create, edit, cancel, delete, undo/redo

## 6. Region And Group-Like Authoring

- [ ] 6.1 Add region creation from current selection
- [ ] 6.2 Add region creation from marquee/bounds when object membership can be
      derived deterministically
- [ ] 6.3 Decide whether region drag translates members, moves explicit region
      geometry, or remains a style/selection operation
- [ ] 6.4 Add region membership edit affordance
- [ ] 6.5 Add Playwright coverage for create, edit members, move behavior,
      collapse/expand interaction, delete, undo/redo

## 7. Shapes, Callouts, And Text-Like Annotations

- [ ] 7.1 Add shape drawing for supported shape primitives
- [ ] 7.2 Add resize handles for shape geometry
- [ ] 7.3 Add callout creation from selected target and click placement
- [ ] 7.4 Add callout movement and leader persistence
- [ ] 7.5 Decide whether standalone text is a callout variant or a new diagram
      primitive before exposing a text tool
- [ ] 7.6 Add Playwright coverage for create, move, resize, edit, delete,
      undo/redo, and reload persistence

## 8. Marquee, Clipboard, And Keyboard Editing

- [ ] 8.1 Add marquee selection for positioned objects
- [ ] 8.2 Add multi-select move as one transaction
- [ ] 8.3 Add Delete/Backspace selected-object deletion
- [ ] 8.4 Add Cmd/Ctrl+C, Cmd/Ctrl+V, and Cmd/Ctrl+D for copy/paste/duplicate
- [ ] 8.5 Rewrite duplicated IDs and internal references deterministically
- [ ] 8.6 Add Playwright coverage for selection, duplicate, paste, delete,
      undo/redo, and dependency handling

## 9. Alignment, Distribution, And Snap

- [ ] 9.1 Add align left/center/right/top/middle/bottom commands
- [ ] 9.2 Add distribute horizontal/vertical commands
- [ ] 9.3 Add arrow-key nudge and Shift+nudge
- [ ] 9.4 Add optional grid snap separate from helper-line snap
- [ ] 9.5 Add Playwright coverage asserting YAML positions after each command

## 10. Inspector And Rail Rebalancing

- [ ] 10.1 Move high-frequency creation actions out of the Build rail into the
      canvas toolbar
- [ ] 10.2 Keep Build rail only for advanced or fallback structured flows that
      are not yet canvas-native
- [ ] 10.3 Ensure Inspector remains the detailed property editor for selected
      objects
- [ ] 10.4 Verify small viewport behavior and no horizontal page overflow
- [ ] 10.5 Add Playwright coverage for compact/narrow viewport authoring

## 11. Documentation

- [ ] 11.1 Update Harness use-case guide to lead with canvas authoring
- [ ] 11.2 Add a polished "Graph Authoring" feature guide
- [ ] 11.3 Document keyboard shortcuts and tool behavior
- [ ] 11.4 Document what each UI action writes into YAML
- [ ] 11.5 Sync generated MkDocs and Zensical docs

## 12. Final Validation

- [ ] 12.1 Run focused unit tests for authoring commands and coordinate helpers
- [ ] 12.2 Run focused Playwright specs for each phase
- [ ] 12.3 Run `npm run test:vscode-harness`
- [ ] 12.4 Run `npm run lint`
- [ ] 12.5 Run `npm run validate:schemas`
- [ ] 12.6 Run `npm run ci`
- [ ] 12.7 Capture final local/remote validation status before archive
