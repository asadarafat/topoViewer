# YAML Schemas

TopoViewer publishes JSON Schemas for YAML authoring. They are intended for editor autocomplete, CI validation, and early error reporting before a document reaches the renderer.

## Published Schemas

| Schema | Use |
|---|---|
| `schemas/topoviewer.schema.json` | Combined topology plus stylesheet document. |
| `schemas/topoviewer-topology.schema.json` | Topology-only YAML: `graph`, `toggles`, and optional `layout`. |
| `schemas/topoviewer-stylesheet.schema.json` | Stylesheet-only YAML: `layout`, `icons`, `labelFields`, `toggles`, and `stylesheet`. |
| `schemas/topoviewer-mapper.schema.json` | Telemetry mapper YAML: metric selectors, TopoViewer targets, resolvers, thresholds, and runtime overlays. |
| `schemas/topoviewer-mkdocs-block.schema.json` | YAML block used inside a MkDocs `topoviewer` fence. |
| `schemas/topoviewer-examples-catalog.schema.json` | Canonical package catalog for feature examples and generated docs pages. |
| `schemas/topoviewer-test-expected.schema.json` | Per-test-case expected render, DOM, semantic-lint, and snapshot contract. |
| `schemas/topoviewer-examples-manifest.schema.json` | Generated docs catalog compatibility schema. |

The schemas are shipped in the npm package and exported as package subpaths:

```text
topoviewer/schemas/topoviewer.schema.json
topoviewer/schemas/topoviewer-topology.schema.json
topoviewer/schemas/topoviewer-stylesheet.schema.json
topoviewer/schemas/topoviewer-mapper.schema.json
topoviewer/schemas/topoviewer-mkdocs-block.schema.json
topoviewer/schemas/topoviewer-examples-catalog.schema.json
topoviewer/schemas/topoviewer-examples-manifest.schema.json
topoviewer/schemas/topoviewer-test-expected.schema.json
```

## Inline `$schema`

For standalone YAML files, add a relative `$schema` hint:

```yaml
$schema: ../../schemas/topoviewer-topology.schema.json
graph:
  id: mv-network
```

For stylesheet YAML:

```yaml
$schema: ../../schemas/topoviewer-stylesheet.schema.json
layout:
  mode: force
stylesheet: []
```

For Grafana mapper YAML:

```yaml
$schema: ../../schemas/topoviewer-mapper.schema.json
version: 1
rules:
  - id: link-utilization
    metric: topoviewer_link_utilization_percent
    select: link
    join: link_id
    value: percent
    states:
      saturated: ">=90"
    style:
      saturated:
        lineColor: "#d32f2f"
```

## VS Code YAML Extension

With the Red Hat YAML extension, associate schemas by file pattern:

```json
{
  "yaml.schemas": {
    "./node_modules/topoviewer/schemas/topoviewer-topology.schema.json": [
      "topoviewer-topo.yaml",
      "**/*.topoviewer-topology.yaml",
      "**/*.topo.tv.yaml"
    ],
    "./node_modules/topoviewer/schemas/topoviewer-stylesheet.schema.json": [
      "topoviewer-style.yaml",
      "**/*.topoviewer-style.yaml",
      "**/*.style.tv.yaml"
    ],
    "./node_modules/topoviewer/schemas/topoviewer-mapper.schema.json": [
      "topoviewer-mapper.yaml",
      "**/*.topoviewer-mapper.yaml",
      "**/*.mapper.tv.yaml"
    ]
  }
}
```

Use inline `$schema` when diagrams live outside a project with shared VS Code settings.

The browser harness uses the same document split for Grafana bundle authoring:
`Topology YAML` exports as `*.topo.tv.yaml`, `Stylesheet YAML` exports as
`*.style.tv.yaml`, and `Mapper YAML` exports as `*.mapper.tv.yaml`.

## Validation Philosophy

The schemas are strict for TopoViewer's core graph contract:

- Graph entities require `id`.
- Links require `source` and `target`.
- Paths require either a `sequence` with at least two nodes, or `source`, `target`, and `parent` when the path is carried by another path.
- Positions must be `[x, y]` or `{ x, y }`.
- `version` is a first-class string field for future migrations.
- `limits` is a first-class renderer guardrail object.
- MkDocs fenced blocks only allow known embed options.
- Mapper files require `version: 1` plus compact `rules` or canonical `mappings`.
- Compact mapper rules use `select`, optional `join`, optional `value`, optional `states`, and state-keyed runtime style patches.
- Canonical mapper mappings expose target kinds, resolver modes, thresholds, conditions, and overlay controls for advanced cases.
- Mapper palettes may define severity colors with shorthand strings or `color`/`accent` mappings.

The schemas are intentionally permissive for domain-specific metadata:

- `labels` accepts scalar classification values.
- `data` accepts arbitrary values.
- `style` accepts arbitrary keys so new renderer style keys do not require immediate schema changes.
- Graph entities allow additional properties for future extensions.

That balance keeps the model robust without turning TopoViewer into a closed network-only schema.

Schema validation is not semantic validation. Run `npm run validate:semantics` to catch broken references, missing names, invalid parents, unknown layers, unused selectors, unsafe image references, and renderer limit violations.

## Canonical Example Catalog

Documented examples are authored in one place:

```text
content/examples/catalog.yaml
content/examples/<feature>/<case>/topology.yaml
content/examples/<feature>/<case>/stylesheet.yaml
content/examples/<feature>/<case>/README.md
content/examples/<feature>/<case>/expected.yaml
```

One test case equals one documented behavior. The topology and stylesheet define the fixture, `README.md` becomes the generated docs prose, and `expected.yaml` stays internal to CI. It defines DOM counts, feature assertions, semantic lint expectations, and the visual snapshot flag; it is not copied into MkDocs or Zensical public pages.

Run `npm run sync:docs` to generate package projections and docs files from the canonical content root. Use `node scripts/sync-examples.mjs --docs-root ./docs` only when regenerating the MkDocs example projection after `npm run sync:content`. Run `npm run check:examples` to fail when generated docs drift from the canonical sources.

## Local Validation

Run:

```bash
npm run validate:schemas
npm run validate:semantics
```

The script compiles every schema with AJV strict mode and validates:

- Local example topology YAML.
- Local example stylesheet YAML.
- Local composed TopoViewer document.
- Local MkDocs fenced-block YAML.
- Local Grafana TopoViewer bundle mapper YAML when the lab bundle directory exists.
- The sibling `rtfm` TopoViewer demo files when that tree is present.
- The canonical feature test-case catalog.
- The generated docs examples catalog.
- Every referenced topology/style file and every corresponding MkDocs fenced block.

`npm run test:all` includes this schema validation step.
