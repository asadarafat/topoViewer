## 1. Tests First

- [x] 1.1 Add compiler unit tests for label placement, offsets, wrapping, backing, and opacity style compilation
- [x] 1.2 Add renderer tests for top/right/bottom/left/center label placement and label backing
- [x] 1.3 Add unit tests for `minZoomedLabelFontSize` behavior
- [x] 1.4 Add compiler unit tests for border style, dash pattern, outline, and underlay values
- [x] 1.5 Add renderer tests for border dash, outline, and underlay layering on shaped nodes
- [x] 1.6 Add compiler and renderer tests for icon opacity, padding, fit, and icon background
- [x] 1.7 Add compiler and renderer tests for badge and status marker style inheritance
- [x] 1.8 Add attention reduction tests for aggregate-generated badge/status defaults if implemented
- [x] 1.9 Add lint or validation tests for unsupported values, invalid numeric ranges, and non-canonical kebab-case keys
- [x] 1.10 Add Playwright tests for the new node examples

## 2. Style Contract

- [x] 2.1 Define supported `labelPosition` values in a shared constant
- [x] 2.2 Define supported `labelTextWrap` and `labelTextOverflow` values in shared constants
- [x] 2.3 Define supported `borderStyle`, `iconFit`, `badgePosition`, and `statusPlacement` values in shared constants
- [x] 2.4 Compile label placement, wrapping, backing, opacity, and zoom threshold keys
- [x] 2.5 Compile border style, dash pattern, border opacity, outline, and underlay keys
- [x] 2.6 Compile icon opacity, padding, fit, and icon background keys
- [x] 2.7 Compile badge and status marker keys
- [x] 2.8 Keep existing node style behavior compatible when new keys are absent
- [x] 2.9 Export public constants or types only where TypeScript callers need discoverability

## 3. Renderer

- [x] 3.1 Render node labels at supported positions with offsets
- [x] 3.2 Render label wrapping, overflow, background, border, padding, and opacity
- [x] 3.3 Apply zoom-aware label suppression without changing graph structure
- [x] 3.4 Render node border style, dash pattern, and border opacity on SVG node geometry
- [x] 3.5 Render outline and underlay behind node bodies without changing React Flow node bounds
- [x] 3.6 Render icon opacity, padding, fit, and icon background for glyph, SVG, and image icons
- [x] 3.7 Render badge overlays with supported positions
- [x] 3.8 Render status markers with supported placements and sizes
- [x] 3.9 Preserve existing attention, selection, focus, drag, edge anchor, and export behavior

## 4. Attention Aggregate Integration

- [x] 4.1 Decide whether aggregate summary nodes receive default badge labels from hidden member count
- [x] 4.2 Decide whether aggregate summary nodes receive default status colors from severity summary
- [x] 4.3 Ensure explicit stylesheet and per-object styles override generated aggregate badge/status defaults
- [x] 4.4 Document generated aggregate defaults if implemented

## 5. Schemas And Lint

- [x] 5.1 Update combined and stylesheet schemas with the new node style keys
- [x] 5.2 Add semantic lint for unsupported enum-like node style values
- [x] 5.3 Add semantic lint for invalid opacity, padding, outline, underlay, offset, and status size values
- [x] 5.4 Add semantic lint for malformed `borderDashPattern`
- [x] 5.5 Add optional warning for long `badgeLabel` values
- [x] 5.6 Ensure diagnostics identify the offending stylesheet rule or object style path

## 6. Examples And Docs

- [x] 6.1 Add `nodes/label-placement` with live viewport, topology YAML, stylesheet YAML, and expected assertions
- [x] 6.2 Add `nodes/border-outline-underlay` with live viewport, topology YAML, stylesheet YAML, and expected assertions
- [x] 6.3 Add `nodes/icon-fit-and-badges` with live viewport, topology YAML, stylesheet YAML, and expected assertions
- [x] 6.4 Add an aggregate badge/status example under attention or nodes with live viewport, topology YAML, stylesheet YAML, and expected assertions
- [x] 6.5 Update node reference docs to list supported keys and non-goals
- [x] 6.6 Update stylesheet docs so node keys are discoverable in canonical `camelCase`
- [x] 6.7 Sync MkDocs and Zensical docs after implementation

## 7. Validation

- [x] 7.1 Run `npm run validate:schemas`
- [x] 7.2 Run focused compiler/style unit tests
- [x] 7.3 Run focused Playwright tests for node examples
- [x] 7.4 Run `npm run docs:build:parallel`
- [x] 7.5 Run `npm run ci`
- [x] 7.6 Verify local MkDocs and Zensical preview with `npm run docs:preview`
