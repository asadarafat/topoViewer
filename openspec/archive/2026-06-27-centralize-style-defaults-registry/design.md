## Design

### Registry shape

Create a renderer-agnostic TypeScript metadata module in `packages/topoviewer`,
implemented as `packages/topoviewer/src/core/styleDefaults.ts`:

```ts
export type StyleTargetKind =
  | 'node'
  | 'link'
  | 'path'
  | 'region'
  | 'shape'
  | 'callout';

export type StyleDefault =
  | { kind: 'value'; value: unknown }
  | { kind: 'derived'; from: string; fallback?: unknown; description: string }
  | { kind: 'none'; description: string };

export interface StyleKeyDefinition {
  key: string;
  label: string;
  dataType: 'text' | 'enum' | 'boolean' | 'integer' | 'number' | 'color' | 'numberList';
  values?: string[];
  default: StyleDefault;
  use: string;
  targets: StyleTargetKind[];
}
```

The exact file name can be adjusted during implementation, but the registry
must live in `packages/topoviewer` rather than the VS Code package. The harness
can import or consume generated metadata from the package, but it must not keep
its own independent style default table.

### Default states

Every style key must have an explicit default state:

- `value`: TopoViewer applies this concrete value when the key is omitted.
- `derived`: TopoViewer computes the value from another field, icon, object, or
  renderer state.
- `none`: TopoViewer does not apply a default. The style key has no effect until
  the author declares it.

Examples:

```ts
{
  key: 'shape',
  dataType: 'enum',
  values: ['square', 'circle', 'ellipse', 'triangle'],
  default: { kind: 'value', value: 'square' },
  targets: ['node']
}

{
  key: 'backgroundColor',
  dataType: 'color',
  default: {
    kind: 'derived',
    from: 'icon.fill',
    fallback: '#6ea8fe',
    description: 'Node fill comes from the selected icon fill.'
  },
  targets: ['node']
}

{
  key: 'labelZIndex',
  dataType: 'number',
  default: {
    kind: 'none',
    description: 'Labels use normal object-local ordering unless labelZIndex is authored.'
  },
  targets: ['node', 'link', 'path', 'region', 'shape', 'callout']
}
```

### Runtime use

The registry should be used by style compilation for stable, primitive defaults:

- node body dimensions, shape, label position, badge/status placement, object
  interaction, and z-index;
- edge line color, width, curve style, arrow defaults, label interaction, and
  z-index;
- region body defaults, label placement, and interaction;
- diagram shape/callout dimensions and z-index.

Derived defaults can remain calculated in the compiler, but the registry must
describe the derivation and tests must prove the compiler still follows it.

Avoid turning the registry into a slow runtime abstraction. It can provide small
helpers such as:

```ts
styleDefaultValue('node', 'width')
styleDefaultDefinition('edge', 'curveStyle')
styleDefinitionsForKind('region')
```

### Docs generation

The canonical content remains under `packages/topoviewer/content/**`.

The stylesheet reference should continue using the existing `Key | Values |
Use` shape. The generated `Use` text should include default behavior where it
helps authors. Example:

```text
Key: shape
Values: square, circle, ellipse, triangle, ...
Use: Node body shape. Defaults to square.
```

For keys with `default.kind === 'none'`, avoid noisy prose for every row. Use
plain wording such as "Optional" only when it clarifies behavior.

The docs build should fail if a public style key in the registry is not
documented.

### Schema alignment

Schemas should continue validating document shape. The registry is not a
replacement for schema validation, but it should align with schema metadata.

Implementation options:

1. Generate schema style-key descriptions from the registry.
2. Keep schema definitions hand-authored but add a test that compares schema
   style keys to the registry.

Prefer the smallest implementation that prevents drift. If schema generation
would make the current build brittle, start with alignment tests and a small
metadata export.

### YAML assist and harness

The VS Code extension/browser harness should use the registry for:

- style key suggestions;
- accepted enum values;
- typed value editors;
- hover/help text;
- default value hints;
- "what happens if omitted?" guidance.

The harness can keep UI grouping metadata if needed, but groups should reference
registry keys rather than define a second list of style keys.

### Public API boundary

The registry is exported from `topoviewer` as an authoring metadata API because
the browser harness and VS Code webview consume the package the same way an
external authoring surface would. This keeps suggestions, typed editors, docs,
and runtime defaults on the same package-owned contract.

The exported API should stay intentionally narrow:

- metadata records and target-kind groupings;
- default lookup helpers;
- value-definition helpers for typed editors;
- canonical key lookup helpers for lint and validation.

Do not expose renderer internals or UI grouping as package API. Harness grouping
remains a local view layer over registry keys.

### Testing strategy

Add four alignment layers:

1. Compiler tests: omitted style keys produce registry-declared defaults.
2. Metadata tests: all registry keys have data type, values/use text, and an
   explicit default state.
3. Docs tests: stylesheet reference includes every public registry key and
   default behavior for explicit defaults.
4. Harness tests: YAML assist suggestions and typed editors use registry
   metadata, including enum values and default hints.

### Migration

This is an internal consolidation. Existing authored YAML should continue to
work. No migration script is required.

The implementation should preserve current behavior unless the behavior is
already part of a separate accepted change, such as the node `shape` default
becoming `square`.

## Risks

- Over-centralizing derived defaults can make simple compiler code harder to
  read. Keep the registry descriptive and use helpers only where they reduce
  drift.
- Exporting the registry as public API too early can freeze implementation
  details. Keep the public boundary narrow.
- Docs may become noisy if every "no default" key gets repeated prose. Use
  default wording only where it helps authors.
- The VS Code harness may have practical UI grouping needs that do not belong
  in runtime metadata. Keep grouping as a thin layer over canonical keys.
