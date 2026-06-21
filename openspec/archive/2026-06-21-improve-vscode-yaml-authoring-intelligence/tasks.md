## 1. Inspect Simplification

- [x] 1.1 Remove visible Style section from Inspect
- [x] 1.2 Remove style apply/reset/remove controls from Inspect
- [x] 1.3 Keep labels/data/relationships/properties working
- [x] 1.4 Update tests to assert Inspect is semantic-only

## 2. Suggestion Metadata

- [x] 2.1 Define topology key metadata for common YAML paths
- [x] 2.2 Define stylesheet key/value metadata from existing style options
- [x] 2.3 Derive current document IDs, layer IDs, label keys, and data keys
- [x] 2.4 Keep metadata reusable outside React where practical

## 3. Monaco Completion Provider

- [x] 3.1 Register YAML completion provider in the harness
- [x] 3.2 Suggest topology keys by YAML path
- [x] 3.3 Suggest node IDs for link/path references
- [x] 3.4 Suggest stylesheet selectors from current topology
- [x] 3.5 Suggest style keys by selector kind
- [x] 3.6 Suggest enum/boolean/color values
- [x] 3.7 Add useful snippets for nodes, links, paths, regions, attention, and stylesheet rules

## 4. Hover And Diagnostics

- [x] 4.1 Add short hover help for known keys
- [x] 4.2 Preserve existing Monaco markers and diagnostic line highlights

## 5. Tests

- [x] 5.1 Add Playwright coverage for topology key suggestions
- [x] 5.2 Add Playwright coverage for ID/value suggestions
- [x] 5.3 Add Playwright coverage for stylesheet key and selector suggestions
- [x] 5.4 Preserve invalid YAML diagnostic marker coverage

## 6. Validation

- [x] 6.1 Run `npm --workspace vscode-topoviewer run build`
- [x] 6.2 Run `npm --workspace vscode-topoviewer run test:vscode-harness`
- [x] 6.3 Run `git diff --check`

## 7. CLI-Style Style Discovery

- [x] 7.1 Add visible `Create style rule` / `Style in YAML` action for the current canvas selection
- [x] 7.2 Insert or focus a selector-specific stylesheet rule and place the cursor inside `style:`
- [x] 7.3 Open or clearly surface style-key suggestions after rule creation
- [x] 7.4 Group style suggestions by purpose and show concise descriptions/value types
- [x] 7.5 Add `?` or visible help action that opens context help without leaving invalid YAML behind
- [x] 7.6 Add Playwright coverage for selected-node style rule creation
- [x] 7.7 Add Playwright coverage for selected-link/path style rule creation
- [x] 7.8 Add Playwright coverage for `?`/help-triggered style suggestions
- [x] 7.9 Re-run `npm --workspace vscode-topoviewer run build`
- [x] 7.10 Re-run `npm --workspace vscode-topoviewer run test:vscode-harness`
- [x] 7.11 Re-run `git diff --check`
- [x] 7.12 Add regression coverage for every stylesheet style key and every value type
