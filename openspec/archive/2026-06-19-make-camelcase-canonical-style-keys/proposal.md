## Why

TopoViewer is both a TypeScript library and a YAML-authored documentation/runtime tool. Today the stylesheet docs expose a mix of `camelCase` and `kebab-case` style keys. That creates avoidable uncertainty for authors: users cannot easily tell which spelling is the stable public API.

TopoViewer should have one canonical casing rule across TypeScript objects, Stylesheet YAML, docs, schemas, examples, and generated reference pages. Because the library API is TypeScript-first and style declarations are serialized objects, `camelCase` should be canonical everywhere.

## What Changes

### 1. Make camelCase canonical

Public TopoViewer style keys SHALL be documented, typed, validated, and generated in `camelCase`:

```yaml
stylesheet:
  - selector: node[labels.role = "pe"]
    style:
      backgroundColor: "#e0f2fe"
      borderColor: "#0369a1"
      borderWidth: 2
      labelFontSize: 12
```

### 2. Reject kebab-case style keys

`kebab-case` style keys SHALL NOT be part of the public TopoViewer contract. Existing first-party docs and examples that use kebab-case style keys should be migrated to canonical `camelCase`; schemas and lint should reject new kebab-case style keys instead of silently mapping them.

### 3. Remove alias normalization from the public style contract

Renderer behavior should depend on canonical keys only. Any importer that reads a foreign style dialect, such as Cytoscape, must translate into canonical TopoViewer style keys before handing the document to the renderer.

### 4. Update examples and docs

All first-party examples, generated docs, and OpenSpec implementation plans should use `camelCase`.

## Capabilities

### New Capabilities

- `canonical-style-key-casing`: `camelCase` as the canonical public style key spelling across TypeScript APIs and Stylesheet YAML.

### Modified Capabilities

- `stylesheet-node-style`, `stylesheet-edge-style`, `stylesheet-region-style`, `stylesheet-shape-style`, and `stylesheet-callout-style`: documentation and examples prefer `camelCase`.
- `topoviewer-schemas`: schemas validate canonical keys and reject kebab-case style keys.
- `topoviewer-lint`: reports non-canonical style keys.
- `topoviewer-examples`: generated examples use canonical style keys.

## Impact

- `packages/topoviewer/docs/stylesheet.md` and generated `docs/topoviewer/stylesheet.md` - remove mixed casing from primary authoring tables.
- `packages/topoviewer/examples/test-cases/**/stylesheet.yaml` - prefer canonical `camelCase`.
- `packages/topoviewer/src/core/style.ts` - compile canonical style keys only.
- `packages/topoviewer/src/core/validation.ts` and `packages/topoviewer/schemas/*` - define accepted canonical keys and reject non-canonical keys.
- `packages/topoviewer/src/core/lint.ts` - surface non-canonical style key usage.
- Active OpenSpec changes - use canonical `camelCase` in public examples.
