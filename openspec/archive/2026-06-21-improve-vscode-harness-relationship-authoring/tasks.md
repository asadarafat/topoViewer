## 1. Relationship Composer

- [x] 1.1 Add Build-mode `Connection` composer instead of immediate implicit insertion failure
- [x] 1.2 Add source and target node controls populated from validated `graph.nodes`
- [x] 1.3 Prefill connection controls from selected node order when available
- [x] 1.4 Validate source/target presence and reject identical endpoints
- [x] 1.5 Create links through structured YAML mutation
- [x] 1.6 Add undo/redo coverage for created links

## 2. Path Composer

- [x] 2.1 Add Build-mode `Path` composer with source, transit nodes, and target controls
- [x] 2.2 Prefill path controls from selected node order when available
- [x] 2.3 Add transit-node add/remove controls
- [x] 2.4 Add transit-node reorder controls
- [x] 2.5 Create paths with canonical `sequence: [source, ...transit, target]`
- [x] 2.6 Add undo/redo coverage for created paths

## 3. Inspector Relationship Editing

- [x] 3.1 Show source/target controls when a single link is selected
- [x] 3.2 Update selected link endpoints through structured YAML mutation
- [x] 3.3 Show source/transit/target controls when a single path is selected
- [x] 3.4 Update selected path sequence through structured YAML mutation
- [x] 3.5 Keep mixed or incompatible selection compact and non-destructive

## 4. Node Position Persistence

- [x] 4.1 Capture canvas node drag-stop events from TopoViewer/React Flow
- [x] 4.2 Add shared mutation helper for updating node position by ID
- [x] 4.3 Preserve tuple/object position shape where practical
- [x] 4.4 Round persisted coordinates to stable integers
- [x] 4.5 Add undo/redo transaction labels for node movement
- [x] 4.6 Ensure invalid YAML blocks position writeback without corrupting Monaco content

## 5. Tests And Fixtures

- [x] 5.1 Add or update a small relationship-authoring fixture
- [x] 5.2 Add Playwright coverage for connection composer with no preselection
- [x] 5.3 Add Playwright coverage for selection-prefilled connection composer
- [x] 5.4 Add Playwright coverage for editing existing link endpoints in Inspector
- [x] 5.5 Add Playwright coverage for path source/transit/target creation
- [x] 5.6 Add Playwright coverage for transit-node reorder and removal
- [x] 5.7 Add Playwright coverage for editing existing path sequence in Inspector
- [x] 5.8 Add Playwright coverage for drag-stop node position persistence
- [x] 5.9 Add Playwright coverage for undo/redo of relationship and position mutations
- [x] 5.10 Add Playwright coverage for compact relationship controls at minimum rail width

## 6. Inspect Sync

- [x] 6.1 Hydrate Labels from selected object YAML into editable rows
- [x] 6.2 Hydrate Data from selected object YAML into editable rows
- [x] 6.3 Replace label/data records from visible Inspect rows
- [x] 6.4 Show style provenance for stylesheet, inline, and new style rows
- [x] 6.5 Apply only changed style rows to inline object style
- [x] 6.6 Reset inline style overrides back to stylesheet/default behavior
- [x] 6.7 Group style key picker entries by purpose
- [x] 6.8 Add Playwright coverage for hydrated labels/data and style sync

## 7. Validation

- [x] 7.1 Run `npm --workspace vscode-topoviewer run build`
- [x] 7.2 Run `npm --workspace vscode-topoviewer run test:vscode-harness`
- [x] 7.3 Run `git diff --check`
