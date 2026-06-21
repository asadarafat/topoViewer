## 1. Roadmap Definition

- [x] 1.1 Verify VS Code extension API, webview, custom editor, and language extension documentation references
- [x] 1.2 Define the first VS Code integration shape as live preview plus validation
- [x] 1.3 Define Material UI as the webview UI toolkit for authoring controls, diagnostics, toolbar actions, layer toggles, and preview settings
- [x] 1.4 Define a local browser-runnable test harness for the webview UI that can run outside VS Code with representative fixtures
- [x] 1.5 Define the browser client adapter, strict local Vite server, fixture routes, validation route, fixed port behavior, and Playwright command
- [x] 1.6 Capture authoring, diagnostics, examples, docs-linking, and screenshot/export use cases
- [x] 1.7 Capture webview, CSP, local asset, workspace trust, Material UI theme mapping, browser-harness parity, strict local server behavior, fixture API drift, and multi-file pairing risks
- [x] 1.8 Write public roadmap wording that avoids claiming support before an extension exists

## 2. Extension Implementation

- [x] 2.1 Add `packages/vscode-topoviewer` as a root workspace package
- [x] 2.2 Add VS Code extension manifest metadata, commands, YAML editor menus, and preview pairing settings
- [x] 2.3 Implement extension host command registration, webview CSP, asset loading, topology/stylesheet file pairing, and save refresh
- [x] 2.4 Implement shared React and Material UI webview UI for preview, diagnostics, layer controls, source tabs, docs, and export entry points
- [x] 2.5 Implement shared validation using the existing TopoViewer schema and semantic lint APIs
- [x] 2.6 Implement `VsCodeHostAdapter` and `BrowserHarnessHostAdapter`
- [x] 2.7 Implement strict local Vite browser harness with fixture and validation routes on `127.0.0.1:5174`
- [x] 2.8 Implement Playwright harness coverage for fixture loading, diagnostics, preview rendering, layer toggles, and export wiring
- [x] 2.9 Wire root build and CI commands to include the VS Code package and harness tests
- [x] 2.10 Add browser system color-scheme initialization, light/dark toolbar toggle, and Playwright coverage
- [x] 2.11 Add Monaco YAML editing, wider authoring layout, top-left preview actions, compact scrollable layer controls, and Playwright layout coverage
- [x] 2.12 Add curated harness fixtures, layer object counts, and coverage that rejects empty harness layers

## 3. Documentation And Validation

- [x] 3.1 Update public integration roadmap wording to mark VS Code as experimental package
- [x] 3.2 Document local VS Code package commands and browser harness behavior
- [x] 3.3 Update npm lockfile for the new workspace package
- [x] 3.4 Run extension package build
- [x] 3.5 Run browser harness Playwright tests
- [x] 3.6 Run docs sync and docs build validation
- [x] 3.7 Run root CI or the closest practical local quality gate
