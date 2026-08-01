## Why

The Material workspace revamp retained Studio's schema-aware Monaco editor but
made its assistance easy to miss. Authors can reach Code, yet the editor chrome
does not expose that topology, stylesheet, and mapper YAML still provide
completion, hover documentation, diagnostics, and context-sensitive discovery.

## What Changes

- Keep topology and stylesheet YAML in Properties Code and mapper YAML in
  Mapper Code.
- Expose one accessible context-help command in every Studio YAML editor.
- Reuse the existing shared Monaco and YAML-assist implementation so the
  command opens field documentation when available and compatible suggestions
  otherwise.
- Preserve keyboard completion, `?` discovery, hover, diagnostics, lazy
  loading, drafts, and Visual/Code state.
- Add browser coverage for topology, stylesheet, and mapper help discovery.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `studio-product-contract`: make schema-aware YAML authoring visibly
  discoverable from the owned Code workspaces.
- `studio-spec-driven-authoring`: expose contextual help through the same
  canonical completion and hover metadata used by Monaco.

## Impact

The change is limited to `packages/topoviewer-studio` editor controls, internal
Monaco handle behavior, browser tests, and canonical Studio documentation. It
does not change TopoViewer YAML, public package APIs, schemas, renderer
behavior, project persistence, host contracts, or runtime dependencies.

Monaco remains lazy and outside the initial Studio bundle. The browser and VS
Code hosts consume the same Studio implementation and require no host-specific
integration.
