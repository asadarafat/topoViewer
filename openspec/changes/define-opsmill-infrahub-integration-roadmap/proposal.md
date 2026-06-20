## Why

OpsMill Infrahub is a graph-native infrastructure source that may map more
naturally to TopoViewer than inventory-only systems. The project should capture
that potential separately from the visual product-story work so Infrahub can be
studied, implemented, or archived independently.

## What Changes

Define the OpsMill/Infrahub integration roadmap as a standalone OpenSpec change:

- establish Infrahub as a feasible graph-native integration candidate;
- prefer an in-platform extension or artifact workflow before standalone export;
- document intended-state, branch/diff, service dependency, and artifact use
  cases;
- document risks around flexible schemas, mapping profiles, authentication, and
  artifact publishing.

## Capabilities

### New Capabilities

- `opsmill-infrahub-integration-roadmap`: feasibility, use cases, first
  integration shape, risks, and public roadmap wording constraints for
  OpsMill/Infrahub.

## Impact

- Public integration roadmap wording for OpsMill/Infrahub.
- Future in-platform OpsMill/Infrahub integration design for TopoViewer views,
  artifacts, and optional YAML export.
- No renderer, schema, MkDocs, or package implementation in this change.

## Non-Goals

- Building an Infrahub adapter.
- Building an Infrahub plugin, extension, artifact workflow, or embedded UI.
- Claiming Infrahub integration is supported.
- Hardcoding one Infrahub schema into TopoViewer core.
