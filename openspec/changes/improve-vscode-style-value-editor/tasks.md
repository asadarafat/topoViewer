## 1. Style Datatype Metadata

- [x] 1.1 Define style value datatypes for enum, boolean, integer, number, color, and text
- [x] 1.2 Add kind-specific enum values for node, region, and diagram `shape`
- [x] 1.3 Add kind-specific enum values for `labelPosition`
- [x] 1.4 Expand color detection for `*Color`, `color`, `fill`, `pipeFill`, and `stroke`

## 2. Inspect UI

- [x] 2.1 Render enum and boolean style values as select controls
- [x] 2.2 Render integer and number style values as numeric inputs
- [x] 2.3 Render color style values as color pickers
- [x] 2.4 Keep text/list-like style values as text fields
- [x] 2.5 Keep key/value/remove controls on the same row

## 3. YAML Output And Tests

- [x] 3.1 Coerce boolean style values to booleans
- [x] 3.2 Coerce integer style values to integers
- [x] 3.3 Coerce number style values to numbers
- [x] 3.4 Add Playwright coverage for enum, color, and numeric style rows
- [x] 3.5 Populate Inspect rows from effective renderer style
- [x] 3.6 Add Playwright coverage for stylesheet-applied style sync

## 4. Validation

- [x] 4.1 Run `npm --workspace vscode-topoviewer run build`
- [x] 4.2 Run `npm --workspace vscode-topoviewer run test:vscode-harness`
- [x] 4.3 Run `git diff --check`
