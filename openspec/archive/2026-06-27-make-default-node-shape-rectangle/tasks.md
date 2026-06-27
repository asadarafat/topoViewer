## 1. Contract And Audit

- [x] 1.1 Confirm all active docs/examples/templates that rely on omitted node `shape`
- [x] 1.2 Decide final default dimensions for rectangle nodes; keep `width: 82`, `height: 60` unless implementation proves a better default is needed
- [x] 1.3 Identify all runtime locations that currently calculate node visual size, icon size, edge anchor size, or React Flow node size independently
- [x] 1.4 Decide canonical default size for explicit `square`/`circle` when neither width nor height is authored

## 2. Runtime Implementation

- [x] 2.1 Change canonical default node shape from `square` to `rectangle`
- [x] 2.2 Add a shared resolved node body box helper
- [x] 2.3 Use the resolved body box for React Flow node dimensions
- [x] 2.4 Use the resolved body box for SVG body, underlay, and outline sizing
- [x] 2.5 Use the resolved body box for default icon/image dimensions
- [x] 2.6 Use the resolved body box for edge anchor geometry
- [x] 2.7 Preserve explicit `shape: square` and `shape: circle` aspect-locked rendering
- [x] 2.8 Derive missing height from width for explicit `shape: square` and `shape: circle`
- [x] 2.9 Derive missing width from height for explicit `shape: square` and `shape: circle`

## 3. Validation

- [x] 3.1 Add error for `shape: square` with two authored unequal width/height values
- [x] 3.2 Add error for `shape: circle` with two authored unequal width/height values
- [x] 3.3 Ensure errors cover stylesheet rules
- [x] 3.4 Ensure errors cover inline object styles where supported
- [x] 3.5 Keep camelCase style key validation unchanged

## 4. Docs, Examples, And Harness

- [x] 4.1 Update canonical stylesheet reference to say node shape defaults to `rectangle`
- [x] 4.2 Update node shape docs with practical rectangle/square/ellipse/circle guidance
- [x] 4.3 Update YAML assist/default hints to say `rectangle` is the default
- [x] 4.4 Make harness templates explicit when they intentionally require `shape: square`
- [x] 4.5 Regenerate package docs, MkDocs docs, and Zensical docs from canonical content

## 5. Tests

- [x] 5.1 Add unit test for omitted node shape resolving to `rectangle`
- [x] 5.2 Add unit test that rectangular default dimensions keep rectangular body and edge anchor
- [x] 5.3 Add unit tests for square/circle aspect-locked body and anchor dimensions
- [x] 5.4 Add unit tests for deriving missing square/circle dimension from the authored dimension
- [x] 5.5 Add validation tests for rejecting two unequal square/circle dimensions
- [x] 5.6 Add metadata/docs alignment tests for default shape text
- [x] 5.7 Add or update Playwright parity smoke for harness, MkDocs, and Zensical graph-basic rendering

## 6. Validation

- [x] 6.1 Run focused TopoViewer unit tests
- [x] 6.2 Run semantic lint/schema checks
- [x] 6.3 Run docs sync and docs build
- [x] 6.4 Run VS Code harness tests if YAML assist metadata changes
- [x] 6.5 Run full `npm run ci`
