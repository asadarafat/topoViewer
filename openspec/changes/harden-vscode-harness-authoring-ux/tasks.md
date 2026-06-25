# 1. Audit Baseline

- [x] 1.1 Inspect browser harness and VS Code webview export code paths
- [x] 1.2 Inspect Monaco suggestion, hover, and keyboard registration
- [x] 1.3 Run a local Playwright probe against `http://127.0.0.1:5174/`
- [x] 1.4 Record current export, suggestion, indentation, and keyboard findings
- [x] 1.5 Review SR Linux CLI help/completion/candidate behavior as interaction reference

# 2. Export Contract

- [x] 2.1 Replace browser harness export mock with real PNG export
- [x] 2.2 Add stable export file naming based on fixture/topology ID and timestamp or deterministic suffix
- [x] 2.3 Add export in-progress and export-complete status states
- [x] 2.4 Disable export when blocking diagnostics prevent rendering
- [x] 2.5 Add VS Code webview export message carrying format, file name, and data URL
- [x] 2.6 Add VS Code extension save dialog and file write behavior
- [x] 2.7 Replace mock-export Playwright assertion with non-empty download assertion
- [x] 2.8 Add VS Code host unit or webview-adapter test for export message shape

# 3. YAML Context Engine

- [x] 3.1 Create a YAML context helper that classifies document, path, key, indentation-sensitive contexts, and selector kind
- [x] 3.2 Make the helper tolerate incomplete and invalid YAML
- [x] 3.3 Use TopoViewer JSON schemas to enumerate legal keys by path
- [x] 3.4 Use style metadata for stylesheet style keys and typed values
- [x] 3.5 Use applied topology document for node ID, link ID, path ID, region ID, layer ID, label, and data references
- [x] 3.6 Return indentation repair guidance when the current line is structurally invalid
- [x] 3.7 Add unit tests for root, graph, nodes, links, paths, regions, labels, data, position, attention, stylesheet selector, and stylesheet style contexts

# 4. YAML Assist UI

- [x] 4.1 Rename or redesign `Suggestions` as an explicit YAML assist action
- [x] 4.2 Show context help and completions with short explanations
- [x] 4.3 Ensure snippets are only offered at valid insertion points
- [x] 4.4 Ensure inserted snippets preserve current indentation
- [x] 4.5 Add a visible empty state when no suggestions are valid
- [x] 4.6 Add regression tests for context-specific suggestions and snippets

# 5. Keyboard Contract

- [x] 5.1 Remove Space from Monaco completion trigger characters
- [x] 5.2 Add Ctrl/Cmd+Space as explicit YAML assist trigger
- [x] 5.3 Restrict `?` help to structural YAML locations
- [x] 5.4 Allow literal `?` in comments, quoted strings, scalar values, labels, data values, and callout bodies
- [x] 5.5 Verify Tab accepts suggestions only when the completion widget is visible
- [x] 5.6 Add Playwright tests for Space, `?`, Tab, Enter, and Escape behavior

# 6. Candidate Apply Workflow

- [x] 6.1 Introduce draft topology and draft stylesheet state in the webview
- [x] 6.2 Keep the canvas on the last valid applied document while drafts are dirty
- [x] 6.3 Add `Apply` and `Revert draft` controls to the YAML action row
- [x] 6.4 Validate drafts before apply
- [x] 6.5 Persist applied state and optionally persist draft state separately in browser harness local storage
- [x] 6.6 Prevent or resolve structured Build/Inspect/Attention mutations while YAML draft is dirty
- [x] 6.7 Update undo/redo behavior so Apply is a durable transaction
- [x] 6.8 Add Playwright tests for valid apply, invalid apply, revert draft, refresh persistence, and canvas stability

# 7. Diagnostics

- [x] 7.1 Add a diagnostics list with document, line, severity, code, and message
- [x] 7.2 Make diagnostics clickable
- [x] 7.3 Clicking a diagnostic switches to the correct YAML tab and reveals the line
- [x] 7.4 Ensure transient command messages do not hide blocking diagnostics
- [x] 7.5 Add Playwright coverage for diagnostic click-to-line behavior
- [x] 7.6 Investigate and either eliminate or explicitly classify `ResizeObserver loop completed with undelivered notifications` console noise

# 8. Documentation

- [x] 8.1 Document browser harness export behavior
- [x] 8.2 Document VS Code preview export behavior
- [x] 8.3 Document YAML assist keyboard behavior
- [x] 8.4 Document candidate/apply workflow for authoring
- [x] 8.5 Update `packages/vscode-topoviewer/README.md`
- [x] 8.6 Update integration roadmap wording if the VS Code surface changes materially

# 9. Validation

- [x] 9.1 Run `npm --workspace vscode-topoviewer run test:vscode-harness`
- [x] 9.2 Run `npm run ci:test:harness`
- [x] 9.3 Run `npm run ci:quality`
- [x] 9.4 Run `npm run vscode:harness:build`
- [x] 9.5 Run `npm run ci`
- [ ] 9.6 Push and confirm GitHub `CI` and `Docs` pass before archiving
