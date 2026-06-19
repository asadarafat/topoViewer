## 1. Tests First

- [x] 1.1 Add unit tests for canonical node shape values, including `roundRectangle`
- [x] 1.2 Add unit tests for supported named node shape compilation
- [x] 1.3 Add unit tests for `shapePolygonPoints` array parsing
- [x] 1.4 Add unit tests for canonical `shapePolygonPoints` string parsing
- [x] 1.5 Add validation or semantic lint tests rejecting `shape-polygon-points`
- [x] 1.6 Add validation or semantic lint tests for invalid shape names and invalid polygon points
- [x] 1.7 Add Playwright tests proving named shapes render distinguishable SVG geometry
- [x] 1.8 Add Playwright tests proving icons, labels, selection, attention dimming, and edge anchors still work with shaped nodes

## 2. Style Contract

- [x] 2.1 Define supported canonical node shape names in a shared constant
- [x] 2.2 Compile canonical node shape values in `compileNodeStyle`
- [x] 2.3 Parse and validate polygon point arrays and strings
- [x] 2.4 Update existing `shape: roundrectangle` usage to `shape: roundRectangle`
- [x] 2.5 Export any new public types only if callers need them

## 3. Renderer

- [x] 3.1 Add node body geometry metadata to compiled node data
- [x] 3.2 Render node body geometry in `NetworkNode` using SVG
- [x] 3.3 Keep the existing icon centered inside the node body
- [x] 3.4 Apply background, border, opacity, selected, hover, and attention state to the shape body
- [x] 3.5 Keep React Flow layout, dragging, selection, and edge anchoring stable
- [x] 3.6 Add safe fallback rendering for invalid or unsupported shapes

## 4. Schemas And Lint

- [x] 4.1 Update combined and stylesheet schemas for node `shape` values and polygon point keys
- [x] 4.2 Add semantic lint checks for unsupported shape names
- [x] 4.3 Add semantic lint checks for polygon point count, numeric parsing, and coordinate bounds
- [x] 4.4 Ensure validation diagnostics identify the offending stylesheet or object style path

## 5. Examples And Docs

- [x] 5.1 Add a compact named node shapes example with live viewport, topology YAML, and stylesheet YAML
- [x] 5.2 Add a compact custom polygon example with live viewport, topology YAML, and stylesheet YAML
- [x] 5.3 Update node style docs to list supported canonical shape values
- [x] 5.4 Document stylesheet-first authoring and keep inline object `style` framed as an override
- [x] 5.5 Regenerate docs and examples with `npm run sync:docs`

## 6. Validation

- [x] 6.1 Run `npm run validate:schemas`
- [x] 6.2 Run focused Playwright tests for node shape examples
- [x] 6.3 Run `npm run docs:build`
- [x] 6.4 Run `npm run ci`
- [x] 6.5 Verify local MkDocs examples render correctly at `/topoViewer/`
- [ ] 6.6 Verify remote CI and Docs after pushing implementation milestones
