## Why

VS Code can make TopoViewer easier to author: live preview, schema validation,
semantic lint, examples, and export commands map directly to the project’s
existing contracts. The repo now needs the first real extension implementation,
not only a roadmap, so the planned shape is visible and testable under
`packages/vscode-topoviewer`.

## What Changes

Implement the first experimental VS Code integration package:

- add `packages/vscode-topoviewer` as a workspace package;
- build a VS Code extension that opens a TopoViewer preview for
  `topology.yaml` plus paired `stylesheet.yaml`;
- reuse the existing TopoViewer renderer, schema validation, and semantic lint;
- use a shared React, Material UI, and Monaco webview app for VS Code and
  browser tests;
- add `VsCodeHostAdapter` and `BrowserHarnessHostAdapter` boundaries so the UI
  does not depend directly on `acquireVsCodeApi()`;
- add a strict local Vite browser harness on `127.0.0.1:5174` with fixture and
  validation routes;
- add Playwright coverage for fixture loading, diagnostics, Monaco editor
  rendering, preview rendering, layer toggles, preview action placement, and
  export wiring;
- keep harness fixtures curated so every exposed layer has objects and visible
  layer counts;
- document the package as experimental until packaging, marketplace publishing,
  and deeper editor features are added.

## Capabilities

### New Capabilities

- `vscode-integration-roadmap`: feasibility, use cases, first integration shape,
  risks, and public roadmap wording constraints for VS Code.
- `vscode-topoviewer-extension`: experimental package, extension host,
  Material UI webview, browser harness, and Playwright validation.

## Impact

- Root workspace includes `packages/vscode-topoviewer`.
- Root build and CI include the VS Code package and browser harness tests.
- Public integration roadmap can describe VS Code as an experimental package,
  not only a planned integration.
- No changes to the canonical TopoViewer YAML language beyond reusing existing
  schema and semantic lint behavior.

## Non-Goals

- Publishing to the VS Code Marketplace.
- Shipping a signed `.vsix` release artifact.
- Implementing a full language server, completion provider, or diagnostics
  collection.
- Implementing a custom editor with write-back semantics.
- Defining a divergent TopoViewer language or validation model.
