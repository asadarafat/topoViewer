## Why

VS Code can make TopoViewer easier to author: live preview, schema validation,
semantic lint, examples, and export commands map directly to the project’s
existing contracts. That integration deserves its own roadmap spec so it can be
planned independently from the visual product-story page.

## What Changes

Define the VS Code integration roadmap as a standalone OpenSpec change:

- establish VS Code as feasible and authoring-focused;
- prefer a live-preview and validation extension before broader workflow
  automation;
- document authoring, diagnostics, examples, docs, and export use cases;
- document risks around webview CSP, local assets, multi-file pairing, workspace
  trust, packaging, and marketplace publishing.

## Capabilities

### New Capabilities

- `vscode-integration-roadmap`: feasibility, use cases, first integration shape,
  risks, and public roadmap wording constraints for VS Code.

## Impact

- Public integration roadmap wording for VS Code.
- Future extension design for TopoViewer YAML authoring.
- No renderer, schema, MkDocs, or package implementation in this change.

## Non-Goals

- Building a VS Code extension.
- Publishing to the VS Code Marketplace.
- Claiming VS Code integration is supported.
- Defining a divergent TopoViewer language or validation model.
