# 1. Baseline And Reproduction

- [x] 1.1 Add a Playwright helper that can open the same canonical fixture in harness, MkDocs, and Zensical
- [x] 1.2 Capture viewer-only screenshots, not full-page screenshots
- [x] 1.3 Record DOM counts for nodes, links/paths, regions, labels, and icon containers
- [x] 1.4 Record edge path `d` values, stroke widths, and label bounding boxes
- [x] 1.5 Add fixture coverage for `graph/basic`, `harness/clos-2spine-4leaf`, `regions/region-label-placement`, `styling/label-z-index`, and one SVG icon template

# 2. Shared Composition Contract

- [x] 2.1 Add `composeTopoViewerDocument` under `packages/topoviewer/src/core`
- [x] 2.2 Document exact precedence for topology vs stylesheet keys
- [x] 2.3 Replace harness `composeTopoDocument` with the shared helper
- [x] 2.4 Replace embed `composeSpec` with the shared helper
- [x] 2.5 Add unit tests for overlapping top-level keys: `layout`, `limits`, `icons`, `labelFields`, `stylesheet`, `toggles`, and `attention`

# 3. Parity Render Mode

- [x] 3.1 Add a harness parity route or query mode that opens a fixture directly and hides authoring chrome
- [x] 3.2 Add a docs parity page or test-only fixture page for MkDocs embeds
- [x] 3.3 Add a docs parity page or test-only fixture page for Zensical embeds
- [x] 3.4 Force the same viewport size, color scheme, selected layers, and controls state in parity mode
- [x] 3.5 Ensure parity mode does not change normal public docs or harness UX

# 4. Theme And CSS Contract

- [x] 4.1 Define a canonical TopoViewer parity CSS variable set
- [x] 4.2 Ensure harness, MkDocs, and Zensical can opt into that variable set
- [x] 4.3 Assert node dimensions, icon dimensions, label offsets, and edge endpoints under the parity theme
- [x] 4.4 Keep docs-specific theme wrappers documented as presentation wrappers, not renderer behavior

# 5. CI Integration

- [x] 5.1 Run parity after `build`, `sync:mkdocs-assets`, `docs:build:fast`, `zensical:build`, and `vscode:harness:build`
- [x] 5.2 Add a CI lane such as `ci:render-parity`
- [x] 5.3 Add renderer parity to the full `npm run ci` order after docs build
- [x] 5.4 Store screenshots under `.artifacts/render-parity` for local debugging
- [x] 5.5 Keep thresholds deterministic enough for GitHub runners

# 6. Documentation

- [x] 6.1 Document that the harness is the golden authoring surface
- [x] 6.2 Document which differences are allowed: page chrome, surrounding docs layout, and non-parity theme wrappers
- [x] 6.3 Document which differences are not allowed: graph geometry, edge visibility, label placement, icon fit, style defaults, and YAML composition

# 7. Validation

- [x] 7.1 Run `npm run ci:quality`
- [x] 7.2 Run `npm run ci:schemas`
- [x] 7.3 Run `npm run ci:test:topoviewer`
- [x] 7.4 Run `npm run ci:test:harness`
- [x] 7.5 Run `npm run ci:docs`
- [x] 7.6 Run the new renderer parity lane locally
- [x] 7.7 Run full `npm run ci` after generated outputs are committed

# 8. Scale, Shape, And Hull Follow-Up

- [x] 8.1 Record Playwright evidence for `graph/basic` harness/docs zoom and node stack differences
- [x] 8.2 Cap automatic React Flow fit zoom at `1` for initial fit and fit-to-screen controls
- [x] 8.3 Preserve `square` and `circle` body aspect ratio while keeping `rectangle` and `ellipse` stretched
- [x] 8.4 Default inner icon/image size to the visible body size for aspect-preserving node shapes
- [x] 8.5 Update stylesheet and React usage docs with scale and shape semantics
- [x] 8.6 Add unit and renderer parity coverage for the new scale/shape contract
- [x] 8.7 Recompute region hulls from compiled node stack dimensions

# 9. Documentation CSS Geometry Boundary

- [x] 9.1 Record Playwright evidence that MkDocs and Zensical host CSS leaked SVG sizing into `graph/basic`
- [x] 9.2 Define that documentation surfaces may override color variables only, not sizing, padding, line-height, SVG/image sizing, or shape geometry
- [x] 9.3 Add scoped TopoViewer CSS rules that protect node SVGs, shape SVGs, icon images, text metrics, edge paint SVGs, and viewport control geometry
- [x] 9.4 Extend renderer parity metrics to compare SVG geometry boxes, not just node/icon container boxes
- [x] 9.5 Add docs-like hostile SVG/image/button CSS resets to renderer parity pages
- [x] 9.6 Rebuild docs assets and verify MkDocs/Zensical `graph/basic` geometry matches harness
- [x] 9.7 Rerun renderer parity and quality checks after generated assets refresh
