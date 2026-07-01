# TopoViewer

**Support status:** Supported

TopoViewer turns `topology.yaml` + `stylesheet.yaml` into interactive,
embeddable, schema-validated topology diagrams for infrastructure docs,
internal portals, and ops dashboards.

```bash
npm install topoviewer @xyflow/react react react-dom
```

## Direction

TopoViewer treats network topology as the flagship use case, not the architectural boundary. The renderer is designed around a generic layered graph model:

- Nodes represent things: routers, services, cloud resources, applications, sites, or logical objects.
- Links represent relationships: physical links, protocol adjacencies, service bindings, dependency edges, or tunnel paths.
- Regions represent membership and scope: domains, areas, sites, availability zones, administrative ownership, or failure domains.
- Diagram primitives represent explanation: shapes, callouts, exact pin targets, and line-only callout relationships that are not semantic graph entities.
- Layers and toggles let the reader decide which parts of the graph story are visible at a given moment.

The target use cases are:

- Interactive network and service-topology diagrams in documentation.
- Standalone topology exploration for labs and trade-show demos.
- Embeddable renderers for MkDocs, internal portals, VS Code previews, and CLI-generated static exports.

The authoring model is intentionally not React Flow-specific:

- Topology YAML describes graph facts: layers, nodes, links, paths, regions, labels, data, and optional seed positions.
- Stylesheet YAML describes presentation intent: layout policy, icons, label fields, and Cytoscape-style selectors.
- The compiler maps graph facts plus matching style rules into React Flow nodes and edges.
- Layout is auto-layout-assisted by default with deterministic force-directed placement. Manual positions are treated as layout seeds, not as the only valid placement mechanism.

## Release Model

TopoViewer is licensed under Apache-2.0. The monorepo root remains marked `private` to prevent accidental workspace publication, while the `packages/topoviewer` package is publish-shaped for intentional npm releases.

The intended package split is:

- `topoviewer`: the public React renderer, schemas, compiler, and embeddable browser bundle.
- `mkdocs-topoviewer`: the public MkDocs plugin that vendors the approved browser bundle.
- Private or customer-specific packages: customer-owned templates, proprietary icon packs, private importers, private policy checks, or deployment-specific server-side workflows that should not be generalized.

Extension packages remain useful for truly private material or customer-specific integrations, but generic renderer capabilities should stay in the Apache-2.0 public packages.

## SVG Icons

Node icons can be text glyphs, external image sources, or inline SVG. Inline SVG follows the same practical pattern used by Cytoscape examples: TopoViewer URL-encodes the SVG string and renders it as a `data:image/svg+xml` image inside the node icon container.

```yaml
icons:
  controller.nsp:
    alt: NSP controller
    svg: |
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
        <rect x="8" y="14" width="80" height="58" rx="12" fill="#ffb454"/>
        <text x="48" y="52" text-anchor="middle" font-size="22" font-weight="800">NSP</text>
      </svg>

stylesheet:
  - selector: node[labels.app = "nsp"]
    style:
      icon: controller.nsp
      iconSize: 48
      backgroundColor: transparent
      borderWidth: 0
```

Use `src` instead of `svg` when the icon already exists as a URL or data URI.

## Quick Start

Install the public package with its React and React Flow peer dependencies:

```bash
npm install topoviewer @xyflow/react react react-dom
```

Use it from React:

```tsx
import { TopoViewer, type TopoDocument } from 'topoviewer';
import 'topoviewer/style.css';

const documentSpec: TopoDocument = {
  graph: {
    layers: [{ id: 'physical', name: 'Physical' }],
    nodes: [
      { id: 'R01', name: 'R01', labels: { node: 'router' }, layers: ['physical'], position: [120, 160] },
      { id: 'R02', name: 'R02', labels: { node: 'router' }, layers: ['physical'], position: [360, 160] }
    ],
    links: [
      { id: 'R01-R02', source: 'R01', target: 'R02', labels: { link: 'physical' }, layers: ['physical'] }
    ]
  },
  stylesheet: [
    { selector: 'node', style: { backgroundColor: '#6ea8fe', borderColor: '#d8e8ff' } },
    { selector: 'link', style: { lineColor: '#6ea8fe', lineWidth: 1 } }
  ]
};

export function Diagram() {
  return <TopoViewer document={documentSpec} selectedLayerIds={['physical']} style={{ height: 520 }} />;
}
```

Use it in MkDocs Material with the bundled plugin:

````markdown
```topoviewer
topology: ./topoviewer-topo.yaml
stylesheet: ./topoviewer-style.yaml
height: 640px
title: MV network SR-TE service path
controls: true
```
````

## Documentation

- [Getting started](https://asadarafat.github.io/topoviewer/docs/mkdocs/topoviewer/start/first-topology/)
- [React usage](https://asadarafat.github.io/topoviewer/docs/mkdocs/topoviewer/embed/react/)
- [MkDocs embed](https://asadarafat.github.io/topoviewer/docs/mkdocs/topoviewer/embed/mkdocs/)
- [Examples gallery](https://asadarafat.github.io/topoviewer/docs/mkdocs/topoviewer/examples/examples-gallery/)
- [Object attributes](https://asadarafat.github.io/topoviewer/docs/mkdocs/topoviewer/reference/object-attributes/)
- [Stylesheet reference](https://asadarafat.github.io/topoviewer/docs/mkdocs/topoviewer/reference/stylesheet-reference/)
- [TypeScript API](https://asadarafat.github.io/topoviewer/docs/mkdocs/topoviewer/reference/typescript-api/)

## Development

Use Node.js 24 LTS for local development and CI. The library is built with Vite 8 and `@vitejs/plugin-react` 6; MkDocs users consume the vendored browser bundle and do not need Node/npm during their documentation builds.

```bash
npm ci
npm run dev
npm run build
npm run sync:mkdocs
npm run test:all
```

`npm run sync:mkdocs` copies the built embeddable bundle from `dist/embed/` into the sibling Python package at `../mkdocs-topoviewer/mkdocs_topoviewer/assets/`. Run it after `npm run build` whenever the MkDocs plugin package should vendor the latest viewer bundle.

The intended repository shape is a monorepo with separate package roots:

```text
topoviewer/
  package.json            # npm workspace orchestrator
  packages/
    topoviewer/           # npm package: topoviewer
    mkdocs-topoviewer/    # Python package: mkdocs-topoviewer
```

The renderer is the product core. The MkDocs package is an adapter that vendors
the approved browser bundle so MkDocs users can render live YAML examples
without running npm during documentation builds. Do not advertise the public
PyPI install command until the Python package is published and verified
separately.

The renderer validates topology and stylesheet documents at runtime before compiling them into React Flow state. Validation is intentionally permissive about custom fields, but it rejects malformed core graph objects such as links without `source`/`target`, paths without a two-node `sequence`, or entities without an `id`.

Semantic lint is separate from schema validation:

```bash
npm run validate:schemas
npm run validate:semantics
```

Schema validation checks shape. Semantic lint checks broken references, missing names, unknown layers, invalid parent relationships, renderer limits, unused selectors, and unsafe references.

JSON Schemas for YAML authoring are available under `schemas/` and are included in the npm package. Use them for editor autocomplete and CI validation:

```yaml
$schema: ./node_modules/topoviewer/schemas/topoviewer-topology.schema.json
```

## Package Surface

The package name is `topoviewer`; the primary exported component is `TopoViewer`.

```tsx
import { TopoViewer } from 'topoviewer';
import 'topoviewer/style.css';
```

The package also exports `validateTopoDocument`, `compileTopoGraph`, `computeLayoutPositions`, `rebuildRegionNodes`, and TypeScript types for graph documents and component props.

Private extension packages should depend on this public surface instead of importing internal source files. The stable extension hook is the `extensions` prop on `TopoViewer`.
