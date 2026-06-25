## Why

TopoViewer already has many useful style defaults, but they are scattered
across compiler code, React components, region bounds helpers, layout helpers,
the VS Code harness metadata, and documentation prose. This makes defaults easy
to drift:

- runtime can render one value;
- docs can describe another value;
- YAML assist can suggest keys without explaining the default;
- schema can validate a key but not expose useful authoring metadata;
- tests have no single source to prove that all surfaces agree.

This matters because TopoViewer is an authored "Topology as Code" tool. Authors
should be able to ask, "what happens if I omit this style key?" and get the same
answer from runtime behavior, docs, schema, and the harness editor.

## What Changes

### 1. Add a canonical style defaults registry

Create a TypeScript registry owned by `packages/topoviewer` that describes
style keys by object kind.

The registry should cover:

- nodes;
- links;
- paths;
- regions;
- diagram shapes;
- callouts;
- shared label keys;
- source/target edge label keys;
- renderer-affecting style keys such as `zIndex`, `display`, `opacity`, and
  interaction flags.

Each style key must explicitly declare one of these states:

- an explicit default value;
- a derived default with the source of derivation;
- no TopoViewer default, meaning the key only applies when authored.

Omitted defaults must be represented intentionally, not by leaving metadata
blank.

### 2. Make runtime consume the registry

The style compiler should use the registry for default resolution where
practical. The existing visual behavior must remain the baseline unless a
separate user-approved change explicitly changes a default.

The current decision that node `shape` defaults to `square` belongs in this
registry so renderer, docs, schema, and YAML assist all agree.

### 3. Make docs, schema, and YAML assist consume the same metadata

The registry should become the source used by:

- generated stylesheet reference content;
- schema descriptions or generated schema metadata;
- VS Code/browser harness YAML assist;
- typed style value editors;
- unit and regression tests.

The public stylesheet reference should remain readable and author-friendly. Keep
the current `Key | Values | Use` table shape unless a later product decision
changes it. Defaults should be included in the `Use` text or in focused default
behavior sections.

### 4. Add alignment tests

Add tests that fail if:

- compiler defaults drift from the registry;
- docs omit default behavior for keys with explicit defaults;
- YAML assist metadata is missing a key or default hint;
- schema/style metadata accepts a key not known to the registry;
- a key exists in the registry but is missing from docs, schema, or YAML assist.

## Capabilities

### New Capabilities

- `canonical-style-defaults-registry`: a single style metadata/default source of
  truth for runtime, docs, schema, and authoring surfaces.

### Modified Capabilities

- `topoviewer-renderer`: resolves style defaults from the canonical registry
  where possible.
- `stylesheet-reference-docs`: displays default behavior from the canonical
  registry.
- `topoviewer-schema`: aligns style key metadata with the canonical registry.
- `vscode-topoviewer-yaml-authoring`: uses canonical default metadata for
  suggestions, hover/help text, and typed value editors.

## Impact

- `packages/topoviewer/src/core/style.ts` - replace inline fallback literals
  with registry-backed default helpers where practical.
- `packages/topoviewer/src/core/nodeShapes.ts` - keep shape constants but expose
  default shape through the defaults registry.
- `packages/topoviewer/src/core/types.ts` and public exports - expose stable
  metadata types only if needed by the harness and docs tooling.
- `packages/vscode-topoviewer/src/webview/webviewStyleMetadata.ts` - stop
  owning duplicated style key/default metadata.
- `packages/topoviewer/content/pages/stylesheet.md` and generated docs - update
  default explanations from the registry.
- schema generation/validation scripts - verify schema and registry alignment.
- tests - add compiler, docs, schema, and harness metadata alignment coverage.

## Non-Goals

- Do not add kebab-case aliases.
- Do not change the canonical camelCase style key contract.
- Do not redesign the visual appearance of defaults beyond the already requested
  node shape default change.
- Do not make arbitrary CSS a public style contract.
- Do not add automatic label collision detection or layout behavior.
